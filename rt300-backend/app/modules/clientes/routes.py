from __future__ import annotations

from flask import Blueprint, request

from ...composition import clientes_service
from ...core.respuesta import responder
from ...core.salidas_comunes import MensajeOut
from ...core.security import autenticado, usuario_actual
from .schemas import ActualizarCuentaIn, ClientesDetalleOut, ClientesOut, CuentasClienteOut

bp = Blueprint("clientes", __name__)


@bp.get("/folios/<int:nfol>/cuentas")
@autenticado
def cuentas(nfol: int):
    return responder(CuentasClienteOut, {"cuentas": clientes_service().cuentas_del_folio(usuario_actual(), nfol)})


@bp.put("/folios/<int:nfol>/cuentas/<int:ncta>")
@autenticado
def actualizar(nfol: int, ncta: int):
    b = ActualizarCuentaIn.model_validate(request.get_json(silent=True) or {})
    mensaje = clientes_service().actualizar_cuenta(usuario_actual(), nfol, ncta, b.mesa, b.cage, b.nruc, b.nomb)
    return responder(MensajeOut, {"mensaje": mensaje})


@bp.get("/clientes")
@autenticado
def buscar():
    codigo = request.args.get("codigo", type=int)
    nombre = request.args.get("nombre")
    svc = clientes_service()
    if codigo and not nombre:
        return responder(ClientesDetalleOut, {"clientes": [svc.obtener_cliente(codigo)]})
    return responder(ClientesOut, {"clientes": svc.buscar(nombre, codigo)})
