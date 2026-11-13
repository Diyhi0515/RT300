from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required
from flask_limiter.util import get_remote_address

from ...composition import auth_service, emisor_tokens
from ...core.respuesta import responder
from ...core.security import usuario_actual
from ...core.sesion_cookie import borrar_renovacion, exigir_cabecera_csrf, guardar_renovacion, renovacion_de_la_cookie
from ...extensions import limiter
from .schemas import LoginIn, LoginOut, MeOut, OkOut, TokenOut, UsuariosOut

bp = Blueprint("auth", __name__)


def _clave_por_usuario() -> str:
    """Límite por usuario además del de IP: frena adivinar la clave de una cuenta desde varias direcciones."""
    usuario = str((request.get_json(silent=True) or {}).get("usuario", "")).strip().upper()[:30]
    return f"usuario:{usuario}" if usuario else get_remote_address()


@bp.get("/usuarios")
@limiter.limit("30/minute")
def usuarios():
    return responder(UsuariosOut, {"usuarios": auth_service().listar_usuarios()})


@bp.post("/login")
@limiter.limit("10/minute")
@limiter.limit("10 per 10 minutes", key_func=_clave_por_usuario)
def login():
    body = LoginIn.model_validate(request.get_json(silent=True) or {})
    resultado = auth_service().login(body.usuario, body.clave)
    datos = emisor_tokens().emitir(resultado.usuario, resultado.local)
    renovacion = datos.pop("refresh_token")
    respuesta, status = responder(LoginOut, datos)
    guardar_renovacion(respuesta, renovacion)
    return respuesta, status


@bp.post("/refresh")
@limiter.limit("60/minute")
@jwt_required(refresh=True)
def refresh():
    exigir_cabecera_csrf()
    return responder(TokenOut, emisor_tokens().renovar(get_jwt()))


@bp.post("/logout")
@limiter.limit("30/minute")
def logout():
    exigir_cabecera_csrf()
    autorizacion = request.headers.get("Authorization", "")
    acceso = autorizacion[7:] if autorizacion.startswith("Bearer ") else None
    emisor_tokens().cerrar_sesion(acceso, renovacion_de_la_cookie())
    respuesta, status = responder(OkOut, {"ok": True})
    borrar_renovacion(respuesta)
    return respuesta, status


@bp.get("/me")
@jwt_required()
def me():
    return responder(MeOut, {"perfil": usuario_actual().claims()})
