from __future__ import annotations

from flask import Blueprint, request

from ...composition import salon_service
from ...core.respuesta import responder
from ...core.security import autenticado, usuario_actual
from .schemas import (
    CuentasFolioOut,
    DetalleMesaOut,
    HabilitarOut,
    MesasOut,
    ModificacionOut,
    ModificarMesaIn,
    OcuparMesaIn,
    OcuparOut,
    ParametrosOut,
    ResumenOut,
)

bp = Blueprint("salon", __name__)


@bp.get("/parametros")
@autenticado
def parametros():
    return responder(ParametrosOut, salon_service().parametros_iniciales(usuario_actual()))


@bp.get("/areas/<int:caco>/mesas")
@autenticado
def mesas(caco: int):
    return responder(MesasOut, {"mesas": salon_service().mesas_de_area(usuario_actual(), caco)})


@bp.get("/mesas/<path:mesa>")
@autenticado
def detalle(mesa: str):
    return responder(DetalleMesaOut, salon_service().detalle_mesa(usuario_actual(), mesa))


@bp.post("/mesas/<path:mesa>/ocupar")
@autenticado
def ocupar(mesa: str):
    b = OcuparMesaIn.model_validate(request.get_json(silent=True) or {})
    return responder(OcuparOut, salon_service().ocupar_mesa(usuario_actual(), mesa, b.cven, b.caco, b.ccom, b.ncta), 201)


@bp.post("/mesas/<path:mesa>/habilitar")
@autenticado
def habilitar(mesa: str):
    return responder(HabilitarOut, salon_service().habilitar_mesa(usuario_actual(), mesa))


@bp.get("/folios/<int:nfol>/modificacion")
@autenticado
def datos_modificacion(nfol: int):
    return responder(ModificacionOut, salon_service().datos_modificacion(usuario_actual(), nfol))


@bp.patch("/folios/<int:nfol>")
@autenticado
def modificar(nfol: int):
    b = ModificarMesaIn.model_validate(request.get_json(silent=True) or {})
    cuentas = salon_service().modificar_mesa(usuario_actual(), nfol, b.cven, b.ccom, b.ncta)
    return responder(CuentasFolioOut, {"cuentas": cuentas})


@bp.get("/folios/<int:nfol>/resumen")
@autenticado
def resumen(nfol: int):
    return responder(ResumenOut, {"resumen": salon_service().resumen_folio(usuario_actual(), nfol)})


@bp.get("/folios/<int:nfol>/cuentas")
@autenticado
def cuentas(nfol: int):
    return responder(CuentasFolioOut, {"cuentas": salon_service().cuentas_folio(usuario_actual(), nfol)})
