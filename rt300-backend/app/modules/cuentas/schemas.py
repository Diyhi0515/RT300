from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from ...core.respuesta import Salida
from ...core.salidas_comunes import ConsumoOut, MonedaOut


class ImprimirIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)
    cven: str = Field(min_length=1, max_length=20)
    caco: str = Field(min_length=1, max_length=20)


# ───────────── Salida ─────────────
class CuentaAbiertaOut(Salida):
    nfol: int
    ncta: int
    nombre: str | None = None
    nruc: str | int | None = None
    ndid: str | int | None = None
    cage: int | str | None = None
    cliente: str
    cmon: int | None = None


class CuentasAbiertasOut(Salida):
    cuentas: list[CuentaAbiertaOut]


class LineaEstadoOut(Salida):
    ncom: int
    cart: str
    impt: float | None = None
    cven: int | str | None = None
    cant: float | None = None
    pvta: float | None = None
    descripcion: str | None = None
    tart: Any = None
    msto: Any = None
    cgru: Any = None
    csub: Any = None
    ccla: Any = None
    cscl: Any = None
    mexe: str | None = None
    faex: int | None = None


class EstadoCuentaOut(Salida):
    moneda: MonedaOut
    detalle: list[LineaEstadoOut]
    resumen: list[ConsumoOut]
