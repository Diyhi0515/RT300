"""Emisión, renovación y revocación de tokens JWT. Es infraestructura de autenticación: el servicio decide
QUIÉN entra; este módulo decide cómo se firma y se revoca el pase."""
from __future__ import annotations

from datetime import timedelta

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

from ...core.credenciales_sesion import credenciales_sesion
from ...core.errors import Unauthorized
from ...domain.usuario import Usuario
from ...extensions import revocar


class EmisorTokens:
    @staticmethod
    def _ttl_credencial() -> float:
        ttl = current_app.config.get("JWT_REFRESH_TOKEN_EXPIRES", timedelta(days=1))
        return ttl.total_seconds() if isinstance(ttl, timedelta) else 86400

    def emitir(self, u: Usuario, local: str, clave: str | None = None) -> dict:
        claims = u.claims()
        perfil = {**claims, "local": local}
        if clave is not None:
            claims["sid"] = credenciales_sesion.guardar(clave, self._ttl_credencial())
        return {
            "access_token": create_access_token(u.usuario, additional_claims=claims),
            "refresh_token": create_refresh_token(u.usuario, additional_claims=claims),
            "perfil": perfil,
        }

    def renovar(self, jwt_refresh: dict) -> dict:
        if "cven" not in jwt_refresh:
            raise Unauthorized("Tu sesión es anterior a una actualización. Inicia sesión de nuevo.", "SESION_DESACTUALIZADA")
        u = Usuario.desde_claims(jwt_refresh)
        claims = u.claims()
        if u.sesion_id:
            if not credenciales_sesion.renovar(u.sesion_id, self._ttl_credencial()):
                raise Unauthorized("La sesión perdió la credencial del servicio. Inicia sesión nuevamente.", "REAUTENTICACION_REQUERIDA")
            claims["sid"] = u.sesion_id
        return {"access_token": create_access_token(u.usuario, additional_claims=claims)}

    def cerrar_sesion(self, acceso: str | None, renovacion: str | None) -> None:
        """Revoca los tokens presentados que sigan vigentes. Cerrar sesión nunca falla: uno vencido o inválido se ignora."""
        decodificados = [self._decodificar(t) for t in (acceso, renovacion)]
        validos = [d for d in decodificados if d]
        if len({d.get("sub") for d in validos}) > 1:
            return
        for sid in {str(d.get("sid") or "") for d in validos}:
            credenciales_sesion.eliminar(sid)
        for d in validos:
            revocar(d["jti"], d["exp"])

    @staticmethod
    def _decodificar(token: str | None) -> dict | None:
        if not token:
            return None
        try:
            return decode_token(token)
        except Exception:  # noqa: BLE001 - vencido o inválido: no hay nada que revocar
            return None
