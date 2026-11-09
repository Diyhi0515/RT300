"""Casos de uso del panel ADMIN: listar, eliminar y reimprimir comandas (con autorización de un supervisor)."""
from __future__ import annotations

from ...core.acceso import exigir_local
from ...core.errors import DomainError, Forbidden, NotFound
from ...core.legacy_password import verificar
from ...domain.uow import UnitOfWork
from ...domain.usuario import Usuario
from ...integrations.comandas.base import (
    EliminarComandaReq,
    GestionComandaGateway,
    ReimprimirComandaReq,
    ResultadoGateway,
)
from ...integrations.comandas.seguro import invocar
from .ports import ComandasRepo
from .schemas import EliminarComandaIn, ItemComandaRef, ReimprimirComandaIn

TIPO_ELIMINAR = 90
TIPO_REIMPRIMIR = 91


class AdministrarComandasService:
    def __init__(self, repo: ComandasRepo, uow: UnitOfWork, gateway: GestionComandaGateway):
        self._repo, self._uow, self._gw = repo, uow, gateway

    # ───────────── Consulta ─────────────
    def listar(self, u: Usuario, nfol: int, mesa: str) -> dict:
        exigir_local(u, self._repo.local_de_folio(nfol))
        mesa_folio = self._repo.mesa_del_folio_abierto(nfol)
        if mesa_folio is None:
            raise NotFound(f"NO EXISTE FOLIO: {nfol}", "FOLIO_NO_EXISTE")
        if mesa_folio != mesa.strip():
            raise NotFound(f"NO EXISTE COMANDAS EN LA MESA: {mesa}", "SIN_COMANDAS")

        detalle = self._repo.detalle_vigente(nfol)
        con_detalle = {int(d["ncom"]) for d in detalle}
        cabeceras = [c for c in self._repo.comandas_vigentes(nfol) if int(c["ncom"]) in con_detalle]
        if not cabeceras:
            raise NotFound(f"NO EXISTE COMANDAS EN LA MESA: {mesa}", "SIN_COMANDAS")
        return {"comandas": cabeceras, "detalle": detalle, "motivos": self._repo.motivos_eliminacion()}

    def motivos(self) -> list[dict]:
        return self._repo.motivos_eliminacion()

    # ───────────── Acciones ─────────────
    def eliminar(self, u: Usuario, b: EliminarComandaIn) -> dict:
        exigir_local(u, self._repo.local_de_folio(b.nfol))
        self._validar_autorizador(b.uaut, b.cont)
        ntmp = self._registrar(TIPO_ELIMINAR, b.items)
        r = invocar(self._gw.eliminar_comanda, EliminarComandaReq(ntra=ntmp, nfol=b.nfol, mesa=b.mesa, uaut=b.uaut,
                                                                  cont=b.cont, mtvo=b.mtvo, usrn=u.usuario))
        return self._resultado(r, ntmp, "eliminar la comanda")

    def reimprimir(self, u: Usuario, b: ReimprimirComandaIn) -> dict:
        exigir_local(u, self._repo.local_de_folio(b.nfol))
        self._validar_autorizador(b.uaut, None)
        ntmp = self._registrar(TIPO_REIMPRIMIR, b.items)
        r = invocar(self._gw.reimprimir_comanda, ReimprimirComandaReq(ntra=ntmp, nfol=b.nfol, mesa=b.mesa, uaut=b.uaut,
                                                                      mtvo=b.mtvo, usrn=u.usuario))
        return self._resultado(r, ntmp, "reimprimir la comanda")

    # ───────────── Internos ─────────────
    def _validar_autorizador(self, uaut: str, clave: str | None) -> None:
        a = self._repo.autorizador(uaut.strip().upper())
        if a is None or a.deshabilitado:
            raise Forbidden("Usuario autorizador no válido.", "AUTORIZADOR_INVALIDO")
        if clave is not None and not verificar(clave, a.clave_guardada):
            raise Forbidden("Clave del autorizador incorrecta.", "AUTORIZADOR_INVALIDO")

    def _registrar(self, tipo: int, items: list[ItemComandaRef]) -> int:
        with self._uow:
            ntmp = self._repo.siguiente_transaccion()
            self._repo.insertar_rttmp(ntmp, tipo, [[i.ncom, i.item] for i in items])
        return ntmp

    @staticmethod
    def _resultado(r: ResultadoGateway, ntmp: int, accion: str) -> dict:
        if not r.ok:
            raise DomainError(f"El servicio no pudo {accion}: {r.mensaje} (transacción {ntmp}).", "SERVICIO_RECHAZO")
        return {"ntmp": ntmp, "resultado": r.codigo}
