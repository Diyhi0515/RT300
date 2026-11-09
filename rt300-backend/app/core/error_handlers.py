import logging

from flask import Flask, g, jsonify
from pydantic import ValidationError
from werkzeug.exceptions import HTTPException

from .errors import DomainError

log = logging.getLogger(__name__)

_MENSAJES_HTTP = {
    400: ("SOLICITUD_INVALIDA", "La solicitud no es válida."),
    404: ("NO_ENCONTRADO", "No se encontró lo que buscas."),
    405: ("METODO_NO_PERMITIDO", "Método no permitido."),
    413: ("CUERPO_DEMASIADO_GRANDE", "El envío es demasiado grande."),
    429: ("DEMASIADOS_INTENTOS", "Demasiados intentos. Espera un momento e intenta de nuevo."),
}


def _body(code: str, message: str, extra: dict | None = None) -> dict:
    err = {"code": code, "message": message, "request_id": getattr(g, "request_id", None)}
    if extra:
        err.update(extra)
    return {"error": err}


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(DomainError)
    def _domain(e: DomainError):
        return jsonify(_body(e.code, e.message)), e.status

    @app.errorhandler(ValidationError)
    def _pydantic(e: ValidationError):
        detalle = [{"campo": ".".join(str(p) for p in d["loc"]), "mensaje": d["msg"]} for d in e.errors()]
        return jsonify(_body("VALIDACION", "Datos inválidos.", {"detalle": detalle})), 422

    @app.errorhandler(HTTPException)
    def _http(e: HTTPException):
        code, msg = _MENSAJES_HTTP.get(e.code or 0, (e.name.upper().replace(" ", "_"), e.description or e.name))
        return jsonify(_body(code, msg)), e.code

    @app.errorhandler(Exception)
    def _unexpected(e: Exception):
        # Detalle solo en el log; al cliente, mensaje genérico + request_id.
        log.exception("Error no controlado")
        return jsonify(_body("ERROR_INTERNO", "Ocurrió un error interno.")), 500
