"""Contrato con el servicio externo de comandas (SOAP / DLL / HTTP / Fake).

Convención heredada del servicio .NET (ver RT300a.js / RT300c.js del sistema anterior):
  - alta / eliminar / reimprimir: un entero > 0 significa éxito (nº de comanda); otro valor es un mensaje de error.
  - estado de cuenta: éxito = 100.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class AltaComandaReq:
    ntra: int
    nfol: int
    ncta: int
    cmon: int
    glos: str
    cloc: int
    usrn: str


@dataclass(frozen=True)
class EliminarComandaReq:
    ntra: int
    nfol: int
    mesa: str
    uaut: str
    cont: str
    mtvo: int
    usrn: str


@dataclass(frozen=True)
class ReimprimirComandaReq:
    ntra: int
    nfol: int
    mesa: str
    uaut: str
    mtvo: int
    usrn: str


@dataclass(frozen=True)
class EstadoCuentaReq:
    nfol: int
    ncta: int
    tped: int
    mesa: str
    cven: str
    caco: str
    calm: str
    cloc: str
    usrn: str


@dataclass
class ResultadoGateway:
    ok: bool
    codigo: str | int | None
    mensaje: str
    crudo: Any = None


# Interfaces pequeñas (ISP): cada caso de uso depende solo de lo que usa.
class AltaComandaGateway(Protocol):
    def alta_comanda(self, req: AltaComandaReq) -> ResultadoGateway: ...


class GestionComandaGateway(Protocol):
    def eliminar_comanda(self, req: EliminarComandaReq) -> ResultadoGateway: ...
    def reimprimir_comanda(self, req: ReimprimirComandaReq) -> ResultadoGateway: ...


class EstadoCuentaGateway(Protocol):
    def estado_cuenta(self, req: EstadoCuentaReq) -> ResultadoGateway: ...


class ComandasGateway(AltaComandaGateway, GestionComandaGateway, EstadoCuentaGateway, Protocol):
    """Contrato completo que implementan Fake/Soap/Http/Dll."""


def interpretar_positivo(crudo: Any) -> ResultadoGateway:
    """Resultado > 0 => ok (alta/eliminar/reimprimir)."""
    try:
        n = int(str(crudo).strip())
    except (TypeError, ValueError):
        return ResultadoGateway(False, None, str(crudo), crudo)
    return ResultadoGateway(n > 0, n, "OK" if n > 0 else f"El servicio respondió {n}", crudo)


def interpretar_100(crudo: Any) -> ResultadoGateway:
    """Estado de cuenta: 100 => ok."""
    ok = str(crudo).strip() == "100"
    return ResultadoGateway(ok, 100 if ok else None, "OK" if ok else str(crudo), crudo)
