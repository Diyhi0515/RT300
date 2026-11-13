from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

from ...domain.usuario import Usuario


@dataclass(frozen=True)
class Autorizador:
    usuario: str
    clave_guardada: str
    deshabilitado: bool


@dataclass(frozen=True)
class ContextoPrecios:
    """Con qué lista se cobra una cuenta (regla del negocio gbrne.gbrnedpre + lista del cliente)."""

    tent: int
    entg: int
    lpre: int


@dataclass(frozen=True)
class ParametrosComanda:
    cpxc: str          # rtctl.rtctlcpxc: 'S' = resolver el centro de producción por artículo
    decimales: int     # inctl.inctlndec
    tcam: float        # gbpmt.gbpmttcof (tipo de cambio oficial)


@dataclass(frozen=True)
class InsumoFicha:
    cins: str
    descripcion: str
    cantidad: float
    merma_pct: float
    mdcg: Any = None
    oimp: Any = None


@dataclass(frozen=True)
class ComponenteFicha:
    padre: str          # insumo compuesto al que pertenece
    cins: str
    descripcion: str
    cantidad: float
    merma_pct: float
    cbas: float
    mdcg: Any = None
    oimp: Any = None


@dataclass(frozen=True)
class FichaComanda:
    cart: str
    descripcion: str
    pvta: float
    ccpd: int
    cbas: float
    insumos: list[InsumoFicha] = field(default_factory=list)
    componentes: list[ComponenteFicha] = field(default_factory=list)


class CatalogoPlatos(Protocol):
    def ficha(self, u: Usuario, cart: str, ctx: ContextoPrecios, cpxc: str) -> FichaComanda: ...


class GuardarComanda(Protocol):
    def guardar(self, u: Usuario, b: Any) -> dict: ...


class ComandasRepo(Protocol):
    def contexto_precios(self, nfol: int, ncta: int, cloc: int) -> ContextoPrecios: ...
    def parametros_comanda(self) -> ParametrosComanda: ...
    def local_de_folio(self, nfol: int) -> int | None: ...
    def cuenta_abierta(self, nfol: int, ncta: int) -> bool: ...
    def mesa_del_folio_abierto(self, nfol: int) -> str | None: ...   # None = folio no abierto
    def motivos_eliminacion(self) -> list[dict]: ...
    def comandas_vigentes(self, nfol: int) -> list[dict]: ...
    def detalle_vigente(self, nfol: int) -> list[dict]: ...
    def autorizador(self, usuario: str) -> Autorizador | None: ...
    def siguiente_transaccion(self) -> int: ...
    def insertar_rttmp(self, ntra: int, tipo: int, filas: list[list[Any]]) -> None: ...
