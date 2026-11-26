"""Guarda en disco las imágenes que sube el administrador: valida que sean imágenes de verdad y las recodifica.

Nunca se conserva el archivo recibido ni su nombre: se decodifica con Pillow (si no es una imagen, falla), se reduce y se
vuelve a escribir, lo que descarta metadatos y cualquier contenido ajeno a la imagen. El nombre lo decide el servidor.
"""
from __future__ import annotations

import io
import os
import re
import tempfile
from pathlib import Path

from PIL import Image, UnidentifiedImageError

FORMATOS_ACEPTADOS = {"JPEG", "PNG", "WEBP", "GIF", "BMP"}
_FORMATO_POR_EXTENSION = {".jpg": "JPEG", ".jpeg": "JPEG", ".png": "PNG", ".webp": "WEBP", ".gif": "GIF", ".bmp": "BMP"}
MAXIMO_BYTES = 5 * 1024 * 1024
MAXIMO_LADO = 1600
MAXIMO_PIXELES = 40_000_000


class ImagenInvalida(Exception):
    def __init__(self, motivo: str, codigo: str):
        super().__init__(motivo)
        self.motivo, self.codigo = motivo, codigo


def nombre_para(cart: str) -> str:
    """Nombre de archivo derivado del código del producto, sin caracteres que molesten en un sistema de archivos."""
    base = re.sub(r"[^A-Za-z0-9._-]", "_", cart.strip()).strip("._") or "producto"
    return f"{base[:60]}.jpg"


class AlmacenImagenes:
    def __init__(self, carpeta: str | Path):
        self._carpeta = Path(carpeta)

    def existe(self, nombre: str) -> bool:
        return (self._carpeta / Path(nombre.replace("\\", "/")).name).is_file()

    def guardar(self, contenido: bytes, nombre: str) -> None:
        """Valida y escribe. Lanza ImagenInvalida si no sirve y OSError si la carpeta no se puede escribir."""
        imagen = self._decodificar(contenido)
        destino = self._carpeta / Path(nombre.replace("\\", "/")).name
        self._carpeta.mkdir(parents=True, exist_ok=True)
        formato = _FORMATO_POR_EXTENSION.get(destino.suffix.lower(), "JPEG")
        if formato == "JPEG":
            imagen = imagen.convert("RGB")
        descriptor, temporal = tempfile.mkstemp(dir=self._carpeta, suffix=".tmp")
        try:
            with os.fdopen(descriptor, "wb") as salida:
                imagen.save(salida, formato, **({"quality": 85, "optimize": True} if formato == "JPEG" else {}))
            os.replace(temporal, destino)
        finally:
            if os.path.exists(temporal):
                os.unlink(temporal)

    @staticmethod
    def _decodificar(contenido: bytes) -> Image.Image:
        if not contenido:
            raise ImagenInvalida("El archivo está vacío.", "IMAGEN_VACIA")
        if len(contenido) > MAXIMO_BYTES:
            raise ImagenInvalida(f"La imagen supera {MAXIMO_BYTES // (1024 * 1024)} MB.", "IMAGEN_MUY_GRANDE")
        try:
            with Image.open(io.BytesIO(contenido)) as origen:
                if origen.format not in FORMATOS_ACEPTADOS:
                    raise ImagenInvalida("Formato no admitido. Usa JPG, PNG, WEBP, GIF o BMP.", "IMAGEN_FORMATO")
                ancho, alto = origen.size
                if ancho * alto > MAXIMO_PIXELES:
                    raise ImagenInvalida("Las dimensiones de la imagen son demasiado grandes.", "IMAGEN_MUY_GRANDE")
                origen.load()
                imagen = origen.copy()
        except ImagenInvalida:
            raise
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as error:
            raise ImagenInvalida("El archivo no es una imagen válida.", "IMAGEN_INVALIDA") from error
        imagen.thumbnail((MAXIMO_LADO, MAXIMO_LADO))
        return imagen
