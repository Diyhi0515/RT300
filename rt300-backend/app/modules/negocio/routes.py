from __future__ import annotations

from flask import Blueprint, request

from ...composition import negocio_service
from ...core.respuesta import responder
from ...core.security import autenticado, usuario_actual
from .schemas import AjusteNombreOut, NegocioOut, NombreNegocioIn

bp = Blueprint("negocio", __name__)


@bp.get("/negocio")
def negocio():
    """Pública a propósito: la pantalla de ingreso muestra el nombre antes de iniciar sesión. Solo entrega el nombre."""
    return responder(NegocioOut, {"nombre": negocio_service().nombre()})


@bp.get("/negocio/ajustes")
@autenticado
def ajustes():
    return responder(AjusteNombreOut, negocio_service().detalle(usuario_actual()))


@bp.put("/negocio/ajustes")
@autenticado
def cambiar_nombre():
    b = NombreNegocioIn.model_validate(request.get_json(silent=True) or {})
    return responder(AjusteNombreOut, negocio_service().cambiar_nombre(usuario_actual(), b.nombre))
