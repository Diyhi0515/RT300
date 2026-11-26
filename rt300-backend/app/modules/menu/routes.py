from __future__ import annotations

from flask import Blueprint, current_app, request

from ...composition import imagenes_platos_service, menu_service
from ...core.errors import ValidationFailed
from ...core.respuesta import responder
from ...core.security import autenticado, usuario_actual
from ...extensions import limiter
from . import images
from .almacen_imagenes import MAXIMO_BYTES
from .schemas import (
    AlternativosOut,
    CentrosOut,
    ExtrasOut,
    FichaPlatoOut,
    ImagenAsignadaOut,
    PlatosOut,
    SeccionesOut,
    TextosOut,
)

bp = Blueprint("menu", __name__)


def _cache() -> int:
    return current_app.config["APP_CONFIG"].menu_cache_seconds


@bp.get("/secciones")
@autenticado
def secciones():
    return responder(SeccionesOut, {"secciones": menu_service().secciones(usuario_actual().cloc)}, cache_seg=_cache())


@bp.get("/secciones/<int:csme>/<int:cssm>/platos")
@autenticado
def platos(csme: int, cssm: int):
    return responder(PlatosOut, {"platos": menu_service().platos(usuario_actual(), csme, cssm)}, cache_seg=_cache())


@bp.get("/secciones/<int:csme>/<int:cssm>/extras")
@autenticado
def extras(csme: int, cssm: int):
    return responder(ExtrasOut, {"extras": menu_service().extras(csme, cssm)}, cache_seg=_cache())


@bp.get("/platos/<cart>")
@autenticado
def plato(cart: str):
    a = request.args
    ficha = menu_service().datos_plato(
        usuario_actual(), cart, entg=a.get("entg", 0, int), tent=a.get("tent", 0, int),
        lpre=a.get("lpre", 0, int), cpxc=a.get("cpxc", "N"))
    return responder(FichaPlatoOut, ficha)


@bp.get("/extras/<cart>")
@autenticado
def extra(cart: str):
    a = request.args
    ficha = menu_service().datos_extra(
        usuario_actual(), cart, pvta=a.get("pvta", 0, float), cmop=a.get("cmop", 0, int), cpxc=a.get("cpxc", "N"))
    return responder(FichaPlatoOut, ficha)


@bp.get("/insumos/<cins>/alternativos")
@autenticado
def alternativos(cins: str):
    return responder(AlternativosOut, menu_service().alternativos(cins))


@bp.get("/textos")
@autenticado
def textos():
    return responder(TextosOut, menu_service().textos(request.args.get("cart") or None), cache_seg=_cache())


@bp.get("/subtextos")
@autenticado
def subtextos():
    return responder(TextosOut, menu_service().subtextos(request.args.get("cart") or None, request.args.get("pref", 0, int)))


@bp.get("/platos/<cart>/centros-produccion")
@autenticado
def centros(cart: str):
    return responder(CentrosOut, {"centros": menu_service().centros_produccion(usuario_actual(), cart, request.args.get("ccpd", ""))})


@bp.get("/platos/<cart>/imagen")
@limiter.limit(lambda: current_app.config["APP_CONFIG"].rate_limit_imagenes)
def imagen(cart: str):
    """Pública a propósito: la consume <img src>, que no puede enviar el JWT. Solo sirve imágenes de producto de las carpetas
    configuradas (nunca otro archivo) y con un límite por IP, porque convertir una imagen cuesta CPU."""
    cfg = current_app.config["APP_CONFIG"]
    return images.servir(menu_service().nombre_imagen(cart), request.args.get("w", 480, int),
                         [cfg.imagenes_subidas_dir, cfg.imagenes_dir], cfg.imagenes_cache_dir)


@bp.post("/platos/<cart>/imagen")
@autenticado
@limiter.limit("60/hour")
def subir_imagen(cart: str):
    """Solo administradores. Recibe `imagen` (multipart); la vincula al producto únicamente si no tiene una."""
    request.max_content_length = MAXIMO_BYTES + 64 * 1024     # el tope general de la API (1 MB) es muy chico para una foto
    archivo = request.files.get("imagen")
    if archivo is None:
        raise ValidationFailed("Falta el archivo en el campo 'imagen'.", "IMAGEN_FALTA")
    resultado = imagenes_platos_service().asignar(usuario_actual(), cart, archivo.read(MAXIMO_BYTES + 1))
    return responder(ImagenAsignadaOut, resultado, 201)
