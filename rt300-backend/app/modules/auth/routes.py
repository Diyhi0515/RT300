from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required
from flask_limiter.util import get_remote_address

from ...composition import auth_service, emisor_tokens
from ...core.respuesta import responder
from ...core.security import usuario_actual
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
    return responder(LoginOut, emisor_tokens().emitir(resultado.usuario, resultado.local))


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    return responder(TokenOut, emisor_tokens().renovar(get_jwt()))


@bp.post("/logout")
@jwt_required(verify_type=False)
def logout():
    refresh_token = (request.get_json(silent=True) or {}).get("refresh_token")
    emisor_tokens().cerrar_sesion(get_jwt(), refresh_token)
    return responder(OkOut, {"ok": True})


@bp.get("/me")
@jwt_required()
def me():
    return responder(MeOut, {"perfil": usuario_actual().claims()})
