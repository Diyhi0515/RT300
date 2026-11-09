from __future__ import annotations

from flask import Blueprint, jsonify, request
from pydantic import BaseModel, Field

from ...composition import cuentas_service
from ...core.security import autenticado, usuario_actual

bp = Blueprint("cuentas", __name__)


class ImprimirIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)
    cven: str = Field(min_length=1, max_length=20)
    caco: str = Field(min_length=1, max_length=20)


@bp.get("/folios/<int:nfol>/cuentas-abiertas")
@autenticado
def cuentas(nfol: int):
    return jsonify({"cuentas": cuentas_service().cuentas(usuario_actual(), nfol)})


@bp.get("/folios/<int:nfol>/cuentas/<int:ncta>/estado")
@autenticado
def estado(nfol: int, ncta: int):
    return jsonify(cuentas_service().estado(usuario_actual(), nfol, ncta, request.args.get("mesa", ""),
                                            request.args.get("cmon", type=int)))


@bp.post("/folios/<int:nfol>/cuentas/<int:ncta>/imprimir")
@autenticado
def imprimir(nfol: int, ncta: int):
    b = ImprimirIn.model_validate(request.get_json(silent=True) or {})
    return jsonify(cuentas_service().imprimir(usuario_actual(), nfol, ncta, b.mesa, b.cven, b.caco))
