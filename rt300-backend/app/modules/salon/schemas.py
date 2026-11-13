from typing import Any

from pydantic import BaseModel, Field

from ...core.respuesta import Salida
from ...core.salidas_comunes import ConsumoOut, LocalOut, MonedaOut


class OcuparMesaIn(BaseModel):
    cven: int | None = Field(default=None, description="Código del mesero (gbage). Si no se envía, el del usuario")
    caco: int = Field(description="Área de consumo")
    ccom: int = Field(ge=0, le=999, description="Cantidad de comensales")
    ncta: int = Field(ge=1, le=50, description="Cantidad de cuentas")


class ModificarMesaIn(BaseModel):
    cven: int | None = Field(default=None, description="Si no se envía, se conserva el mesero actual")
    ccom: int = Field(ge=0, le=999)
    ncta: int = Field(ge=1, le=50)


# ───────────── Salida ─────────────
class AreaOut(Salida):
    codigo: int
    descripcion: str | None = None


class MesaOut(Salida):
    mesa: str
    descripcion: str | None = None
    capacidad: int | None = None      # sillas de la mesa (rtmsaccom)
    area: int | None = None
    estado: int | None = None         # 1 = libre, 3 = ocupada
    folio: int | None = None
    stat: int | None = None
    posx: int | None = None
    posy: int | None = None
    comensales: int | None = None     # solo ocupada: los del folio
    cven: int | str | None = None
    mozo: str | None = None
    apertura: str | None = None       # ISO, solo ocupada
    cuentas: int | None = None
    consumo: float | None = None      # suma de las cuentas abiertas


class MeseroOut(Salida):
    codigo: int
    nombre: str | None = None
    gbvenpcom: Any = None
    gbvencmov: Any = None
    gbvenfpag: Any = None
    gbvencmon: Any = None
    gbvenfulq: Any = None


class ParametrosOut(Salida):
    caco: int | None = None
    areas: list[AreaOut]
    mesas: list[MesaOut]
    meseros: list[MeseroOut]
    local: LocalOut
    moneda: MonedaOut
    decimales: int


class MesasOut(Salida):
    mesas: list[MesaOut]


class CuentaFolioOut(Salida):
    ncta: int
    estc: int | None = None
    mrcb: int | None = None
    nomb: str | None = None
    impt: float | None = None


class DetalleMesaOut(Salida):
    mesa: MesaOut
    folio: int
    hora: str
    mesero: str
    resumen: list[ConsumoOut]
    cuentas: list[CuentaFolioOut]


class OcuparOut(Salida):
    folio: int
    cuentas: int


class HabilitarOut(Salida):
    mesa: str
    folio_anulado: int | None = None


class FolioModificacionOut(Salida):
    comensales: int | None = None
    cven: int | str | None = None


class ModificacionOut(Salida):
    folio: FolioModificacionOut
    cuentas: int


class CuentasFolioOut(Salida):
    cuentas: list[CuentaFolioOut]


class LineaCuentaOut(Salida):
    cart: str
    descripcion: str | None = None
    pvta: float | None = None
    cant: float | None = None
    impt: float | None = None


class CuentaDetalleOut(Salida):
    ncta: int
    nombre: str | None = None
    nruc: str | int | None = None
    ndid: str | int | None = None
    cage: int | str | None = None
    cliente: str
    estc: int | None = None           # 1 = abierta, 9 = liquidada (la liquida el módulo de caja)
    impt: float | None = None
    lineas: list[LineaCuentaOut]


class DetalleFolioOut(Salida):
    cuentas: list[CuentaDetalleOut]


class ResumenOut(Salida):
    resumen: list[ConsumoOut]
