"""Emisión, renovación y revocación de tokens JWT. Es infraestructura de autenticación: el servicio decide
QUIÉN entra; este módulo decide cómo se firma y se revoca el pase."""
from __future__ import annotations

from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

from ...core.errors import Unauthorized
from ...domain.usuario import Usuario
from ...extensions import revocar


class EmisorTokens:
    def emitir(self, u: Usuario, local: str) -> dict:
        claims = u.claims()
        return {
            "access_token": create_access_token(u.usuario, additional_claims=claims),
            "refresh_token": create_refresh_token(u.usuario, additional_claims=claims),
            "perfil": {**claims, "local": local},
        }

    def renovar(self, jwt_refresh: dict) -> dict:
        if "cven" not in jwt_refresh:
            raise Unauthorized("Tu sesión es anterior a una actualización. Inicia sesión de nuevo.", "SESION_DESACTUALIZADA")
        u = Usuario.desde_claims(jwt_refresh)
        return {"access_token": create_access_token(u.usuario, additional_claims=u.claims())}

    def cerrar_sesion(self, acceso: str | None, renovacion: str | None) -> None:
        """Revoca los tokens presentados que sigan vigentes. Cerrar sesión nunca falla: uno vencido o inválido se ignora."""
        decodificados = [self._decodificar(t) for t in (acceso, renovacion)]
        validos = [d for d in decodificados if d]
        if len({d.get("sub") for d in validos}) > 1:
            return
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
