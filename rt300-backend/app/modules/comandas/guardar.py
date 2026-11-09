"""Caso de uso: guardar una comanda.

Flujo (docs/00 §6): contador ntmp → INSERT rttmp en lote → COMMIT → gateway.
Mejora sobre el PHP: si el gateway falla, rttmp ya está guardada y el error trae `ntmp` para reintentar sin reinsertar.
"""
from __future__ import annotations

from ...core.acceso import exigir_local
from ...core.errors import DomainError, GatewayError, NotFound
from ...domain.uow import UnitOfWork
from ...domain.usuario import Usuario
from ...integrations.comandas.base import AltaComandaGateway, AltaComandaReq
from ...integrations.comandas.seguro import invocar
from .ports import ComandasRepo
from .schemas import GuardarComandaIn


def filas_rttmp(b: GuardarComandaIn) -> dict[int, list[list]]:
    """Comanda → filas de rttmp por tipo (mismo layout gl01..gl19 que el PHP)."""
    return {
        1: [[d.cart, d.desc, d.cant, d.pvta, d.item, d.impt, d.tcam, d.glos, d.cmon, d.ccpd, d.iteo, d.tipo] for d in b.rtcda],
        2: [[x.rttacitem, x.rttaccart, x.rttacpref, x.rttaccorr, x.rttactext] for x in b.rttac],
        3: [[x.rttcopref, x.rttcocorr] for x in b.rttco],
        4: [[x.rtciancom, x.rtciaitem, x.rtciacart, x.rtciacins, x.rtciacant, x.rtciamdcg, x.rtciaccpd, x.rtciadesc,
             x.cinsorigen, x.descorigen, x.quitado, x.rtciacost, x.rtciacanp, x.rtciacanm, x.rtciaoimp] for x in b.rtcia],
        5: [[x.rtcicncom, x.rtcicitem, x.rtciccart, x.rtciccins, x.rtciccinc, x.rtciccant, x.rtcicmdcg, x.rtcicoimp,
             x.rtcicdesc, x.cincorigen, x.descorigen, x.quitado, x.rtciccost, x.rtciccanp, x.rtciccanm] for x in b.rtcic],
    }


class GuardarComandaService:
    def __init__(self, repo: ComandasRepo, uow: UnitOfWork, gateway: AltaComandaGateway):
        self._repo, self._uow, self._gw = repo, uow, gateway

    def guardar(self, u: Usuario, b: GuardarComandaIn) -> dict:
        exigir_local(u, self._repo.local_de_folio(b.nfol))
        if not self._repo.cuenta_abierta(b.nfol, b.ncta):
            raise NotFound(f"No se encontro la Cta.: {b.ncta} abierta en el Folio: {b.nfol}", "CUENTA_NO_ABIERTA")
        with self._uow:
            ntmp = self._repo.siguiente_transaccion()
            for tipo, filas in filas_rttmp(b).items():
                self._repo.insertar_rttmp(ntmp, tipo, filas)
        return self._enviar(u, ntmp, b.nfol, b.ncta, b.glos)

    def reintentar(self, u: Usuario, ntmp: int, nfol: int, ncta: int, glos: str) -> dict:
        """Reinvoca al servicio con el mismo ntmp (rttmp ya existe)."""
        exigir_local(u, self._repo.local_de_folio(nfol))
        return self._enviar(u, ntmp, nfol, ncta, glos)

    def _enviar(self, u: Usuario, ntmp: int, nfol: int, ncta: int, glos: str) -> dict:
        req = AltaComandaReq(ntra=ntmp, nfol=nfol, ncta=ncta, cmon=u.cmon, glos=glos, cloc=u.cloc, usrn=u.usuario)
        try:
            r = invocar(self._gw.alta_comanda, req)
        except GatewayError as e:
            e.message = f"{e.message} La transacción {ntmp} quedó registrada; puede reintentar."
            e.ntmp = ntmp  # type: ignore[attr-defined]
            raise
        if not r.ok:
            raise DomainError(f"El servicio rechazó la comanda: {r.mensaje} (transacción {ntmp}).", "COMANDA_RECHAZADA")
        return {"ntmp": ntmp, "comanda": r.codigo}
