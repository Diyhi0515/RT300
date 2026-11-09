from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from ...composition import auth_service
from ...extensions import limiter, revocar
from .schemas import LoginIn

bp = Blueprint("auth", __name__)

@bp.get("/usuarios")
@limiter.limit("30/minute")
def usuarios():
    return jsonify({"usuarios": auth_service().listar_usuarios()})


@bp.post("/login")
@limiter.limit("10/minute")
def login():
    body = LoginIn.model_validate(request.get_json(silent=True) or {})
    resultado = auth_service().login(body.usuario, body.clave)
    ses, claims = resultado.usuario, resultado.usuario.claims()
    return jsonify({
        "access_token": create_access_token(ses.usuario, additional_claims=claims),
        "refresh_token": create_refresh_token(ses.usuario, additional_claims=claims),
        "perfil": {**claims, "local": resultado.local},
    })


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    claims = {k: v for k, v in get_jwt().items() if k in ("usuario", "nombre", "cloc", "calm", "cmon", "nreg", "rol")}
    return jsonify({"access_token": create_access_token(get_jwt_identity(), additional_claims=claims)})


@bp.post("/logout")
@jwt_required(verify_type=False)
def logout():
    """Revoca el token presentado y, si se envía en el cuerpo, también el refresh_token."""
    revocar(get_jwt()["jti"], get_jwt()["exp"])
    rt = (request.get_json(silent=True) or {}).get("refresh_token")
    if rt:
        try:
            d = decode_token(rt)
            if d.get("sub") == get_jwt_identity():
                revocar(d["jti"], d["exp"])
        except Exception:  # noqa: BLE001 - un refresh inválido no impide cerrar sesión
            pass
    return jsonify({"ok": True})


@bp.get("/me")
@jwt_required()
def me():
    return jsonify({"perfil": {k: get_jwt().get(k) for k in ("usuario", "nombre", "cloc", "calm", "cmon", "nreg", "rol")}})
