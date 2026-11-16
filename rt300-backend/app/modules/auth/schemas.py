from pydantic import BaseModel, Field

from ...core.respuesta import Salida


class LoginIn(BaseModel):
    usuario: str = Field(min_length=1, max_length=30)
    clave: str = Field(min_length=1, max_length=64)


# ───────────── Salida ─────────────
class UsuarioListaOut(Salida):
    usuario: str
    nombre: str | None = None


class UsuariosOut(Salida):
    usuarios: list[UsuarioListaOut]


class SesionOut(Salida):
    """Lo que lleva el token (nunca la clave)."""

    usuario: str
    nombre: str
    cloc: int
    calm: int
    cmon: int
    nreg: int
    rol: str
    cven: int


class PerfilOut(SesionOut):
    local: str   # nombre del local, para mostrar en pantalla


class LoginOut(Salida):
    access_token: str
    perfil: PerfilOut


class TokenOut(Salida):
    access_token: str


class MeOut(Salida):
    perfil: SesionOut


class OkOut(Salida):
    ok: bool
