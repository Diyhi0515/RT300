"""Emisión, renovación y revocación de tokens JWT. Es infraestructura de autenticación: el servicio decide
QUIÉN entra; este módulo decide cómo se firma y se revoca el pase."""
from __future__ import annotations

from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

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
        u = Usuario.desde_claims(jwt_refresh)
        return {"access_token": create_access_token(u.usuario, additional_claims=u.claims())}

    def cerrar_sesion(self, jwt_actual: dict, refresh_token: str | None) -> None:
        """Revoca el token presentado y, si se envía, también el refresh_token de la misma persona."""
        revocar(jwt_actual["jti"], jwt_actual["exp"])
        if not refresh_token:
            return
        try:
            d = decode_token(refresh_token)
        except Exception:  # noqa: BLE001 - un refresh inválido no impide cerrar sesión
            return
        if d.get("sub") == jwt_actual.get("sub"):
            revocar(d["jti"], d["exp"])
