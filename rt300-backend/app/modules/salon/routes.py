from __future__ import annotations

from flask import Blueprint, jsonify, request

from ...composition import salon_service
from ...core.security import autenticado, usuario_actual
from .schemas import ModificarMesaIn, OcuparMesaIn

bp = Blueprint("salon", __name__)


@bp.get("/parametros")
@autenticado
def parametros():
    return jsonify(salon_service().parametros_iniciales(usuario_actual()))


@bp.get("/areas/<int:caco>/mesas")
@autenticado
def mesas(caco: int):
    return jsonify({"mesas": salon_service().mesas_de_area(caco)})


@bp.get("/mesas/<path:mesa>")
@autenticado
def detalle(mesa: str):
    return jsonify(salon_service().detalle_mesa(mesa))


@bp.post("/mesas/<path:mesa>/ocupar")
@autenticado
def ocupar(mesa: str):
    b = OcuparMesaIn.model_validate(request.get_json(silent=True) or {})
    return jsonify(salon_service().ocupar_mesa(usuario_actual(), mesa, b.cven, b.caco, b.ccom, b.ncta)), 201


@bp.post("/mesas/<path:mesa>/habilitar")
@autenticado
def habilitar(mesa: str):
    return jsonify(salon_service().habilitar_mesa(usuario_actual(), mesa))


@bp.get("/folios/<int:nfol>/modificacion")
@autenticado
def datos_modificacion(nfol: int):
    return jsonify(salon_service().datos_modificacion(nfol))


@bp.patch("/folios/<int:nfol>")
@autenticado
def modificar(nfol: int):
    b = ModificarMesaIn.model_validate(request.get_json(silent=True) or {})
    return jsonify({"cuentas": salon_service().modificar_mesa(usuario_actual(), nfol, b.cven, b.ccom, b.ncta)})


@bp.get("/folios/<int:nfol>/resumen")
@autenticado
def resumen(nfol: int):
    return jsonify({"resumen": salon_service().resumen_folio(nfol)})


@bp.get("/folios/<int:nfol>/cuentas")
@autenticado
def cuentas(nfol: int):
    return jsonify({"cuentas": salon_service().cuentas_folio(nfol)})
