from __future__ import annotations

from flask import Blueprint, request

from ...composition import cuentas_service
from ...core.respuesta import responder
from ...core.salidas_comunes import MensajeOut
from ...core.security import autenticado, usuario_actual
from .schemas import CuentasAbiertasOut, EstadoCuentaOut, ImprimirIn

bp = Blueprint("cuentas", __name__)


@bp.get("/folios/<int:nfol>/cuentas-abiertas")
@autenticado
def cuentas(nfol: int):
    return responder(CuentasAbiertasOut, {"cuentas": cuentas_service().cuentas(usuario_actual(), nfol)})


@bp.get("/folios/<int:nfol>/cuentas/<int:ncta>/estado")
@autenticado
def estado(nfol: int, ncta: int):
    datos = cuentas_service().estado(usuario_actual(), nfol, ncta, request.args.get("mesa", ""), request.args.get("cmon", type=int))
    return responder(EstadoCuentaOut, datos)


@bp.post("/folios/<int:nfol>/cuentas/<int:ncta>/imprimir")
@autenticado
def imprimir(nfol: int, ncta: int):
    b = ImprimirIn.model_validate(request.get_json(silent=True) or {})
    return responder(MensajeOut, cuentas_service().imprimir(usuario_actual(), nfol, ncta, b.mesa, b.cven, b.caco))
