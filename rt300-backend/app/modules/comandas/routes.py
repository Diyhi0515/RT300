from __future__ import annotations

from flask import Blueprint, jsonify, request

from ...composition import administrar_comandas_service, guardar_comanda_service
from ...core.security import autenticado, usuario_actual
from ...extensions import limiter
from .schemas import EliminarComandaIn, GuardarComandaIn, ReimprimirComandaIn, ReintentarIn

bp = Blueprint("comandas", __name__)


@bp.post("/comandas")
@autenticado
def guardar():
    b = GuardarComandaIn.model_validate(request.get_json(silent=True) or {})
    return jsonify(guardar_comanda_service().guardar(usuario_actual(), b)), 201


@bp.post("/comandas/<int:ntmp>/reintentar")
@autenticado
def reintentar(ntmp: int):
    b = ReintentarIn.model_validate(request.get_json(silent=True) or {})
    return jsonify(guardar_comanda_service().reintentar(usuario_actual(), ntmp, b.nfol, b.ncta, b.glos))


@bp.get("/folios/<int:nfol>/comandas")
@autenticado
def administrar(nfol: int):
    return jsonify(administrar_comandas_service().listar(nfol, request.args.get("mesa", "")))


@bp.get("/comandas/motivos-eliminacion")
@autenticado
def motivos():
    return jsonify({"motivos": administrar_comandas_service().motivos()})


@bp.post("/comandas/eliminar")
@autenticado
@limiter.limit("20/minute")
def eliminar():
    b = EliminarComandaIn.model_validate(request.get_json(silent=True) or {})
    return jsonify(administrar_comandas_service().eliminar(usuario_actual(), b))


@bp.post("/comandas/reimprimir")
@autenticado
def reimprimir():
    b = ReimprimirComandaIn.model_validate(request.get_json(silent=True) or {})
    return jsonify(administrar_comandas_service().reimprimir(usuario_actual(), b))
