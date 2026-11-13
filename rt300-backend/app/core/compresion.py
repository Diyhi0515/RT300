"""Compresión gzip de las respuestas JSON grandes (el menú de una sección pesa ~46 KB y baja a ~8 KB).

Se excluye `/auth/`: las respuestas con tokens no se comprimen, para no exponerlas a ataques de tipo BREACH.
"""
from __future__ import annotations

import gzip

from flask import Flask, Response, request

MINIMO_BYTES = 1024
NIVEL = 5
PREFIJOS_EXCLUIDOS = ("/api/v1/auth/",)


def _comprimible(resp: Response) -> bool:
    return (
        200 <= resp.status_code < 300
        and not resp.direct_passthrough
        and "Content-Encoding" not in resp.headers
        and resp.mimetype == "application/json"
        and "gzip" in request.headers.get("Accept-Encoding", "").lower()
        and not request.path.startswith(PREFIJOS_EXCLUIDOS)
    )


def registrar_compresion(app: Flask) -> None:
    @app.after_request
    def _gzip(resp: Response) -> Response:
        if not _comprimible(resp):
            return resp
        datos = resp.get_data()
        if len(datos) < MINIMO_BYTES:
            return resp
        resp.set_data(gzip.compress(datos, compresslevel=NIVEL))
        resp.headers["Content-Encoding"] = "gzip"
        resp.headers["Content-Length"] = str(len(resp.get_data()))
        resp.headers.add("Vary", "Accept-Encoding")
        return resp
