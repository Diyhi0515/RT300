"""JWT y autorización. El token lleva usuario/local/almacén/rol; nunca la clave."""
from __future__ import annotations

from functools import wraps

from flask_jwt_extended import get_jwt, verify_jwt_in_request

from ..domain.usuario import ROLES, Usuario  # noqa: F401 (re-export)
from .errors import Forbidden

def usuario_actual() -> Usuario:
    return Usuario.desde_claims(get_jwt())


def requiere_rol(*roles: str):
    """Exige JWT válido y, si se indican roles, que el del usuario esté entre ellos."""

    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **kw):
            verify_jwt_in_request()
            if roles and get_jwt().get("rol") not in roles:
                raise Forbidden("No tiene permiso para esta acción.")
            return fn(*a, **kw)

        return wrapper

    return deco


autenticado = requiere_rol()
