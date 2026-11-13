from __future__ import annotations

from flask import Blueprint, request

from ...composition import administrar_comandas_service, armar_comanda_service, guardar_comanda_service
from ...core.respuesta import responder
from ...core.security import autenticado, usuario_actual
from ...extensions import limiter
from .schemas import (
    AccionComandaOut,
    AdministrarComandasOut,
    ComandaGuardadaOut,
    EliminarComandaIn,
    EnviarComandaIn,
    GuardarComandaIn,
    MotivosOut,
    ReimprimirComandaIn,
    ReintentarIn,
)

bp = Blueprint("comandas", __name__)


@bp.post("/comandas")
@autenticado
def guardar():
    b = GuardarComandaIn.model_validate(request.get_json(silent=True) or {})
    return responder(ComandaGuardadaOut, guardar_comanda_service().guardar(usuario_actual(), b), 201)


@bp.post("/folios/<int:nfol>/cuentas/<int:ncta>/comandas")
@autenticado
def enviar(nfol: int, ncta: int):
    """Camino normal para el frontend: solo plato y cantidad; el servidor arma precios e insumos."""
    b = EnviarComandaIn.model_validate(request.get_json(silent=True) or {})
    return responder(ComandaGuardadaOut, armar_comanda_service().enviar(usuario_actual(), nfol, ncta, b), 201)


@bp.post("/comandas/<int:ntmp>/reintentar")
@autenticado
def reintentar(ntmp: int):
    b = ReintentarIn.model_validate(request.get_json(silent=True) or {})
    return responder(ComandaGuardadaOut, guardar_comanda_service().reintentar(usuario_actual(), ntmp, b.nfol, b.ncta, b.glos))


@bp.get("/folios/<int:nfol>/comandas")
@autenticado
def administrar(nfol: int):
    return responder(AdministrarComandasOut, administrar_comandas_service().listar(usuario_actual(), nfol, request.args.get("mesa", "")))


@bp.get("/comandas/motivos-eliminacion")
@autenticado
def motivos():
    return responder(MotivosOut, {"motivos": administrar_comandas_service().motivos()})


@bp.post("/comandas/eliminar")
@autenticado
@limiter.limit("20/minute")
def eliminar():
    b = EliminarComandaIn.model_validate(request.get_json(silent=True) or {})
    return responder(AccionComandaOut, administrar_comandas_service().eliminar(usuario_actual(), b))


@bp.post("/comandas/reimprimir")
@autenticado
def reimprimir():
    b = ReimprimirComandaIn.model_validate(request.get_json(silent=True) or {})
    return responder(AccionComandaOut, administrar_comandas_service().reimprimir(usuario_actual(), b))
