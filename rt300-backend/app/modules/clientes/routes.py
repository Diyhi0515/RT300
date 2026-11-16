from __future__ import annotations

from flask import Blueprint, request

from ...composition import clientes_service
from ...core.respuesta import responder
from ...core.salidas_comunes import MensajeOut
from ...core.security import autenticado, usuario_actual
from .schemas import (
    ActualizarCuentaIn,
    ClientesDetalleOut,
    ClientesOut,
    CompactarCuentasIn,
    CuentasClienteOut,
    CuentasEliminadasOut,
    EliminarCuentaIn,
    EliminarCuentasIn,
)

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


@bp.delete("/folios/<int:nfol>/cuentas/<int:ncta>")
@autenticado
def eliminar_una(nfol: int, ncta: int):
    """La mesa va en el cuerpo (como en el PUT) o, si el cliente no envía cuerpo en DELETE, en `?mesa=`."""
    datos = request.get_json(silent=True) or {}
    b = EliminarCuentaIn.model_validate({"mesa": datos.get("mesa") or request.args.get("mesa", "")})
    return responder(CuentasEliminadasOut, clientes_service().eliminar_cuentas(usuario_actual(), nfol, b.mesa, [ncta]))


@bp.post("/folios/<int:nfol>/cuentas/eliminar")
@autenticado
def eliminar_varias(nfol: int):
    b = EliminarCuentasIn.model_validate(request.get_json(silent=True) or {})
    return responder(CuentasEliminadasOut, clientes_service().eliminar_cuentas(usuario_actual(), nfol, b.mesa, b.cuentas))


@bp.post("/folios/<int:nfol>/cuentas/compactar")
@autenticado
def compactar(nfol: int):
    b = CompactarCuentasIn.model_validate(request.get_json(silent=True) or {})
    return responder(CuentasEliminadasOut, clientes_service().compactar_cuentas(usuario_actual(), nfol, b.mesa))


@bp.get("/clientes")
@autenticado
def buscar():
    codigo = request.args.get("codigo", type=int)
    nombre = request.args.get("nombre")
    documento = request.args.get("documento")
    svc = clientes_service()
    if documento:
        return responder(ClientesDetalleOut, {"clientes": svc.buscar_por_documento(documento)})
    if codigo and not nombre:
        return responder(ClientesDetalleOut, {"clientes": [svc.obtener_cliente(codigo)]})
    return responder(ClientesOut, {"clientes": svc.buscar(nombre, codigo)})
