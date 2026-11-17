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

# El frontend compilado se sirve desde el mismo origen que la API en la
# instalación de Windows. No permite recursos externos, salvo imágenes data/blob
# y estilos inline que React/Tailwind necesitan en tiempo de ejecución.
CSP_FRONTEND = (
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; "
    "worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'"
)

HSTS = "max-age=31536000; includeSubDomains"


def registrar_cabeceras(app: Flask) -> None:
    @app.after_request
    def _cabeceras(resp: Response) -> Response:
        for nombre, valor in CABECERAS.items():
            resp.headers.setdefault(nombre, valor)
        if not request.path.startswith("/api/"):
            resp.headers["Content-Security-Policy"] = CSP_FRONTEND
        if request.is_secure:
            resp.headers.setdefault("Strict-Transport-Security", HSTS)
        if request.path.startswith("/assets/"):
            resp.headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
        else:
            resp.headers.setdefault("Cache-Control", "no-store")
        return resp
