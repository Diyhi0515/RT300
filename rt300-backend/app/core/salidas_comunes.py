"""Modelos de salida compartidos por varios módulos (evita que un módulo importe los esquemas de otro)."""
from __future__ import annotations

from .respuesta import Salida


class ConsumoOut(Salida):
    """Línea de consumo agrupada por comanda y plato (resumen de mesa y de cuenta)."""

    ncom: int
    cart: str
    descripcion: str | None = None
    pvta: float | None = None
    cant: float | None = None
    impt: float | None = None


class LocalOut(Salida):
    codigo: int
    descripcion: str | None = None


class MonedaOut(Salida):
    codigo: int
    abreviatura: str | None = None
    descripcion: str | None = None


class MensajeOut(Salida):
    mensaje: str


class SaludOut(Salida):
    status: str
    db: bool
