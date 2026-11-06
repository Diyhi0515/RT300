from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from ...composition import menu_service
from ...core.security import autenticado, usuario_actual
from . import images

bp = Blueprint("menu", __name__)


@bp.get("/secciones")
@autenticado
def secciones():
    return jsonify({"secciones": menu_service().secciones(usuario_actual().cloc)})


@bp.get("/secciones/<int:csme>/<int:cssm>/platos")
@autenticado
def platos(csme: int, cssm: int):
    return jsonify({"platos": menu_service().platos(usuario_actual(), csme, cssm)})


@bp.get("/secciones/<int:csme>/<int:cssm>/extras")
@autenticado
def extras(csme: int, cssm: int):
    return jsonify({"extras": menu_service().extras(csme, cssm)})


@bp.get("/platos/<cart>")
@autenticado
def plato(cart: str):
    a = request.args
    return jsonify(menu_service().datos_plato(
        usuario_actual(), cart, entg=a.get("entg", 0, int), tent=a.get("tent", 0, int),
        lpre=a.get("lpre", 0, int), cpxc=a.get("cpxc", "N")))


@bp.get("/extras/<cart>")
@autenticado
def extra(cart: str):
    a = request.args
    return jsonify(menu_service().datos_extra(
        usuario_actual(), cart, pvta=a.get("pvta", 0, float), cmop=a.get("cmop", 0, int), cpxc=a.get("cpxc", "N")))


@bp.get("/insumos/<cins>/alternativos")
@autenticado
def alternativos(cins: str):
    return jsonify(menu_service().alternativos(cins))


@bp.get("/textos")
@autenticado
def textos():
    return jsonify(menu_service().textos(request.args.get("cart") or None))


@bp.get("/subtextos")
@autenticado
def subtextos():
    return jsonify(menu_service().subtextos(request.args.get("cart") or None, request.args.get("pref", 0, int)))


@bp.get("/platos/<cart>/centros-produccion")
@autenticado
def centros(cart: str):
    return jsonify({"centros": menu_service().centros_produccion(usuario_actual(), cart, request.args.get("ccpd", ""))})


@bp.get("/platos/<cart>/imagen")
def imagen(cart: str):
    """Pública a propósito: la consume <img src>, que no puede enviar el JWT. Solo sirve archivos de IMAGENES_DIR."""
    cfg = current_app.config["APP_CONFIG"]
    return images.servir(menu_service().nombre_imagen(cart), request.args.get("w", 480, int), cfg.imagenes_dir,
                         cfg.imagenes_cache_dir)
