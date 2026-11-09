"""Entradas de comandas. Los nombres de campo internos siguen a las columnas de las tablas temporales del
sistema anterior (rtcda, rttac, rttco, rtcia, rtcic) para que los dueños los reconozcan."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from ...core.respuesta import Salida

Escalar = str | int | float | None


class _Base(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


class DetalleComanda(_Base):  # rttmp tipo 1 (rtcda)
    cart: str = Field(min_length=1, max_length=30)
    desc: str = ""
    cant: float = Field(gt=0)
    pvta: float = Field(ge=0)
    item: int = Field(ge=1)
    impt: float = Field(ge=0)
    tcam: Escalar = None
    glos: Escalar = None
    cmon: int
    ccpd: Escalar = None
    iteo: Escalar = None
    tipo: Escalar = None


class TextoItem(_Base):  # tipo 2 (rttac)
    rttacitem: int
    rttaccart: str
    rttacpref: int
    rttaccorr: int
    rttactext: Escalar = None


class TextoComanda(_Base):  # tipo 3 (rttco)
    rttcopref: int
    rttcocorr: int


class InsumoItem(_Base):  # tipo 4 (rtcia)
    rtciancom: int = 0
    rtciaitem: int
    rtciacart: str
    rtciacins: str
    rtciacant: float
    rtciamdcg: Escalar = None
    rtciaccpd: Escalar = 0
    rtciadesc: Escalar = None
    cinsorigen: Escalar = None
    descorigen: Escalar = None
    quitado: Escalar = None
    rtciacost: float = 0
    rtciacanp: float = 0
    rtciacanm: float = 0
    rtciaoimp: Escalar = 0


class ComponenteInsumo(_Base):  # tipo 5 (rtcic)
    rtcicncom: int = 0
    rtcicitem: int
    rtciccart: str
    rtciccins: str
    rtciccinc: str
    rtciccant: float
    rtcicmdcg: Escalar = None
    rtcicoimp: Escalar = 0
    rtcicdesc: Escalar = None
    cincorigen: Escalar = None
    descorigen: Escalar = None
    quitado: Escalar = None
    rtciccost: float = 0
    rtciccanp: float = 0
    rtciccanm: float = 0


class GuardarComandaIn(_Base):
    nfol: int = Field(ge=1)
    ncta: int = Field(ge=1)
    glos: str = Field(default="", max_length=200)
    rtcda: list[DetalleComanda] = Field(min_length=1, max_length=300)
    rttac: list[TextoItem] = []
    rttco: list[TextoComanda] = []
    rtcia: list[InsumoItem] = []
    rtcic: list[ComponenteInsumo] = []


class ReintentarIn(_Base):
    nfol: int
    ncta: int
    glos: str = ""


class ItemComandaRef(_Base):
    ncom: int
    item: int


class EliminarComandaIn(_Base):
    nfol: int
    mesa: str
    uaut: str = Field(min_length=1, max_length=30)
    cont: str = Field(min_length=1, max_length=64)
    mtvo: int
    items: list[ItemComandaRef] = Field(min_length=1, max_length=300)


class ReimprimirComandaIn(_Base):
    nfol: int
    mesa: str
    uaut: str = Field(min_length=1, max_length=30)
    mtvo: int
    items: list[ItemComandaRef] = Field(min_length=1, max_length=300)


# ───────────── Salida ─────────────
class ComandaGuardadaOut(Salida):
    ntmp: int
    comanda: int | str | None = None


class ComandaCabeceraOut(Salida):
    ncom: int
    ncta: int | None = None
    cven: int | str | None = None
    nomb: str | None = None
    impt: float | None = None


class ComandaDetalleOut(Salida):
    ncom: int
    item: int
    ncta: int | None = None
    cart: str
    descripcion: str | None = None
    cant: float | None = None
    pvta: float | None = None


class MotivoOut(Salida):
    codigo: int
    descripcion: str | None = None


class MotivosOut(Salida):
    motivos: list[MotivoOut]


class AdministrarComandasOut(Salida):
    comandas: list[ComandaCabeceraOut]
    detalle: list[ComandaDetalleOut]
    motivos: list[MotivoOut]


class AccionComandaOut(Salida):
    ntmp: int
    resultado: int | str | None = None
