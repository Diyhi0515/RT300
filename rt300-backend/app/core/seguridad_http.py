"""Cabeceras de seguridad y política de caché HTTP de la API.

La API solo entrega JSON (y alguna imagen): no necesita cargar nada de otros orígenes ni ser incrustada en una página.
Por defecto ninguna respuesta se guarda en cachés compartidas ni del navegador (`no-store`); los endpoints que sí
pueden cachearse (menú) lo piden explícitamente en `core/respuesta.py`.
"""
from __future__ import annotations

from flask import Flask, Response, request

CABECERAS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}

HSTS = "max-age=31536000; includeSubDomains"


def registrar_cabeceras(app: Flask) -> None:
    @app.after_request
    def _cabeceras(resp: Response) -> Response:
        for nombre, valor in CABECERAS.items():
            resp.headers.setdefault(nombre, valor)
        if request.is_secure:
            resp.headers.setdefault("Strict-Transport-Security", HSTS)
        resp.headers.setdefault("Cache-Control", "no-store")
        return resp
