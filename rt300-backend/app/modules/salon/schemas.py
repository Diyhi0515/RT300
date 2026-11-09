from typing import Any

from pydantic import BaseModel, Field

from ...core.respuesta import Salida
from ...core.salidas_comunes import ConsumoOut


class OcuparMesaIn(BaseModel):
    cven: int = Field(description="Código del mesero (gbage)")
    caco: int = Field(description="Área de consumo")
    ccom: int = Field(ge=0, le=999, description="Cantidad de comensales")
    ncta: int = Field(ge=1, le=50, description="Cantidad de cuentas")


class ModificarMesaIn(BaseModel):
    cven: int
    ccom: int = Field(ge=0, le=999)
    ncta: int = Field(ge=1, le=50)


# ───────────── Salida ─────────────
class AreaOut(Salida):
    codigo: int
    descripcion: str | None = None


class MesaOut(Salida):
    mesa: str
    descripcion: str | None = None
    comensales: int | None = None
    area: int | None = None
    estado: int | None = None
    folio: int | None = None
    stat: int | None = None


class MeseroOut(Salida):
    codigo: int
    nombre: str | None = None
    gbvenpcom: Any = None
    gbvencmov: Any = None
    gbvenfpag: Any = None
    gbvencmon: Any = None
    gbvenfulq: Any = None


class ConfigOut(Salida):
    gbpmt: dict[str, Any] | None = None
    gbrne: dict[str, Any] | None = None
    inctl: dict[str, Any] | None = None
    rtctl: dict[str, Any] | None = None


class ParametrosOut(Salida):
    caco: int | None = None
    areas: list[AreaOut]
    mesas: list[MesaOut]
    meseros: list[MeseroOut]
    local: dict[str, Any]
    moneda: dict[str, Any]
    config: ConfigOut


class MesasOut(Salida):
    mesas: list[MesaOut]


class CuentaFolioOut(Salida):
    ncta: int
    estc: int | None = None
    mrcb: int | None = None
    nomb: str | None = None
    impt: float | None = None


class DetalleMesaOut(Salida):
    mesa: dict[str, Any]
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


class ModificacionOut(Salida):
    folio: dict[str, Any]
    cuentas: int


class CuentasFolioOut(Salida):
    cuentas: list[CuentaFolioOut]


class ResumenOut(Salida):
    resumen: list[ConsumoOut]
