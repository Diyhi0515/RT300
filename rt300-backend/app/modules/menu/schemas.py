"""Esquemas de salida del menú (el menú es solo lectura: no hay entradas con cuerpo)."""
from __future__ import annotations

from typing import Any

from ...core.respuesta import Salida


class SeccionOut(Salida):
    csme: int
    cssm: int
    descripcion: str | None = None
    stat: int | None = None


class SeccionesOut(Salida):
    secciones: list[SeccionOut]


class PlatoOut(Salida):
    cart: str
    csme: int
    cssm: int
    descripcion: str | None = None
    imagen: str | None = None
    mfra: str | None = None
    pvta: float
    moneda: str


class PlatosOut(Salida):
    platos: list[PlatoOut]


class ExtraOut(Salida):
    cart: str
    cant: float | None = None
    impt: float | None = None
    cmon: int | None = None
    descripcion: str | None = None
    moneda: str | None = None
    imagen: str | None = None


class ExtrasOut(Salida):
    extras: list[ExtraOut]


class InsumoOut(Salida):
    rtinscart: str
    rtinscins: str
    inartdesc: str | None = None
    rtinscant: float | None = None
    rtinsmdcg: Any = None
    rtinsmerm: Any = None
    rtinsoimp: Any = None
    inartmsto: int | None = None
    swIns: bool | None = None
    swIal: bool | None = None


class ComponenteOut(InsumoOut):
    rtalbcbas: float | None = None


class AlternativoOut(Salida):
    rtialcins: str
    rtialcina: str
    rtialitem: Any = None
    rtialcant: Any = None
    rtialmerm: Any = None
    inartdesc: str | None = None
    swIns: bool | None = None


class FichaPlatoOut(Salida):
    rtins: list[InsumoOut] | None = None
    rtcom: list[ComponenteOut] | None = None
    rtial: list[AlternativoOut] | None = None
    ccpd: int | str
    pvta: float
    csme: int
    cssm: int
    mcom: str
    cbas: float


class AlternativosOut(Salida):
    rtial: list[AlternativoOut] | None = None
    rtcom: list[InsumoOut] | None = None


class TextoOut(Salida):
    pref: int
    corr: int
    capl: int | None = None
    text: str | None = None


class TextosOut(Salida):
    cart: str
    textos: list[TextoOut]


class CentroOut(Salida):
    ccpd: int | str
    nombre: str
    seleccionado: bool


class CentrosOut(Salida):
    centros: list[CentroOut]
