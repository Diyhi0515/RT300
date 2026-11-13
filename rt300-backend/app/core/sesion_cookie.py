"""Cookie del token de renovación y defensa contra CSRF.

El token de renovación viaja solo en una cookie HttpOnly (JavaScript no puede leerla, así que un XSS no puede robarla),
limitada a la ruta de autenticación y con SameSite=Strict (el navegador no la envía desde otros sitios).
Además, las rutas que la usan exigen una cabecera propia: un sitio ajeno no puede enviarla sin pasar por CORS."""
from __future__ import annotations

from flask import Response, request
from flask_jwt_extended import set_refresh_cookies, unset_refresh_cookies

from .errors import Forbidden

NOMBRE_COOKIE = "rt300_rt"
RUTA_COOKIE = "/api/v1/auth"
CABECERA_CSRF = "X-Requested-With"
VALOR_CSRF = "rt300"


def exigir_cabecera_csrf() -> None:
    if request.headers.get(CABECERA_CSRF) != VALOR_CSRF:
        raise Forbidden("Solicitud no permitida.", "CSRF")


def guardar_renovacion(respuesta: Response, token: str) -> None:
    set_refresh_cookies(respuesta, token)


def borrar_renovacion(respuesta: Response) -> None:
    unset_refresh_cookies(respuesta)


def renovacion_de_la_cookie() -> str | None:
    return request.cookies.get(NOMBRE_COOKIE)
