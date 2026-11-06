from __future__ import annotations

from ...core.errors import DomainError, NotFound
from ...domain.usuario import Usuario
from ...integrations.comandas.base import EstadoCuentaGateway, EstadoCuentaReq
from ...integrations.comandas.seguro import invocar
from .ports import CuentasRepo


class CuentasService:
    def __init__(self, repo: CuentasRepo, printer: EstadoCuentaGateway):
        self._repo, self._printer = repo, printer

    def cuentas(self, nfol: int) -> list[dict]:
        return self._repo.cuentas_abiertas(nfol)

    def estado(self, u: Usuario, nfol: int, ncta: int, mesa: str, cmon: int | None) -> dict:
        moneda = self._repo.moneda(cmon or u.cmon)
        if moneda is None:
            raise DomainError("Falta definir parametros de control para restaurant.", "SIN_MONEDA")
        return {
            "moneda": moneda,
            "detalle": self._repo.consumo_detalle(nfol, ncta),
            "resumen": self._repo.resumen(nfol, mesa or None, ncta),
        }

    def imprimir(self, u: Usuario, nfol: int, ncta: int, mesa: str, cven: str, caco: str) -> dict:
        if not self._repo.folio_abierto(nfol):
            raise NotFound(f"NO EXISTE FOLIO: {nfol}", "FOLIO_NO_EXISTE")
        r = invocar(self._printer.estado_cuenta, EstadoCuentaReq(
            nfol=nfol, ncta=ncta, tped=1, mesa=mesa, cven=cven, caco=caco, calm=str(u.calm), cloc=str(u.cloc), usrn=u.usuario))
        if not r.ok:
            raise DomainError(f"No se pudo imprimir la cuenta: {r.mensaje}", "IMPRESION_FALLIDA")
        return {"mensaje": "Se envio a imprimir la cta."}
