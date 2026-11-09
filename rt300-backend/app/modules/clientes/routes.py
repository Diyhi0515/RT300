from __future__ import annotations

from flask import Blueprint, jsonify, request

from ...composition import clientes_service
from ...core.security import autenticado, usuario_actual
from .schemas import ActualizarCuentaIn

bp = Blueprint("clientes", __name__)


@bp.get("/folios/<int:nfol>/cuentas")
@autenticado
def cuentas(nfol: int):
    return jsonify({"cuentas": clientes_service().cuentas_del_folio(usuario_actual(), nfol)})


@bp.put("/folios/<int:nfol>/cuentas/<int:ncta>")
@autenticado
def actualizar(nfol: int, ncta: int):
    b = ActualizarCuentaIn.model_validate(request.get_json(silent=True) or {})
    return jsonify({"mensaje": clientes_service().actualizar_cuenta(usuario_actual(), nfol, ncta, b.mesa, b.cage, b.nruc, b.nomb)})


@bp.get("/clientes")
@autenticado
def buscar():
    codigo = request.args.get("codigo", type=int)
    nombre = request.args.get("nombre")
    svc = clientes_service()
    if codigo and not nombre:
        return jsonify({"clientes": [svc.obtener_cliente(codigo)]})
    return jsonify({"clientes": svc.buscar(nombre, codigo)})
