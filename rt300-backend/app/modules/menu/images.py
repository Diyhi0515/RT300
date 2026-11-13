"""Imágenes de platos: lee el nombre de rtalb.rtalbnimg, convierte BMP/JPG a WebP redimensionado y lo cachea."""
from __future__ import annotations

import hashlib
import io
import logging
from pathlib import Path

from flask import Response, send_file

log = logging.getLogger(__name__)

_ANCHOS = (160, 240, 320, 480, 640, 960)
_PLACEHOLDER = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">'
    '<rect width="480" height="360" fill="#e5e7eb"/><circle cx="240" cy="170" r="52" fill="#cbd5e1"/>'
    '<rect x="150" y="240" width="180" height="14" rx="7" fill="#cbd5e1"/></svg>'
)


def placeholder() -> Response:
    r = Response(_PLACEHOLDER, mimetype="image/svg+xml")
    r.headers["Cache-Control"] = "public, max-age=300"
    r.headers["X-Placeholder"] = "1"
    return r


def _seguro(base: Path, nombre: str) -> Path | None:
    """Evita path traversal: solo el nombre de archivo, y que quede dentro de `base`."""
    candidato = (base / Path(nombre.replace("\\", "/")).name).resolve()
    try:
        candidato.relative_to(base.resolve())
    except ValueError:
        return None
    return candidato if candidato.is_file() else None


def _webp(datos: bytes) -> Response:
    resp = Response(datos, mimetype="image/webp")
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


def servir(nombre: str | None, ancho: int, imagenes_dir: str, cache_dir: str) -> Response:
    if not nombre:
        return placeholder()
    origen = _seguro(Path(imagenes_dir), nombre)
    if origen is None:
        return placeholder()

    # Solo anchos de una lista fija: evita que un anónimo llene el disco de caché con miles de variantes.
    ancho = min(_ANCHOS, key=lambda a: abs(a - ancho))
    clave = hashlib.sha1(f"{origen.name}|{origen.stat().st_mtime_ns}|{ancho}".encode(), usedforsecurity=False).hexdigest()
    destino = Path(cache_dir) / f"{clave}.webp"
    if destino.exists():
        return send_file(destino, mimetype="image/webp", max_age=86400, conditional=True)
    try:
        from PIL import Image

        with Image.open(origen) as im:
            im = im.convert("RGB")
            im.thumbnail((ancho, ancho * 3))
            buffer = io.BytesIO()
            im.save(buffer, "WEBP", quality=80, method=4)
    except Exception:  # noqa: BLE001 - archivo corrupto o formato no soportado => placeholder
        log.warning("No se pudo convertir la imagen %s", origen.name)
        return placeholder()
    try:
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(buffer.getvalue())
    except OSError:
        log.warning("Sin permiso de escritura en la caché de imágenes (%s); se sirve sin guardar", cache_dir)
    return _webp(buffer.getvalue())
