from __future__ import annotations

from ...core.acceso import exigir_local
from ...core.errors import Conflict, NotFound
from ...core.sql import blank_to_none
from ...domain.uow import UnitOfWork
from ...domain.usuario import Usuario
from .ports import ClientesRepo


class ClientesService:
    def __init__(self, repo: ClientesRepo, uow: UnitOfWork):
        self._repo, self._uow = repo, uow

    def cuentas_del_folio(self, u: Usuario, nfol: int) -> list[dict]:
        exigir_local(u, self._repo.local_de_folio(nfol))
        return self._repo.cuentas_abiertas(nfol)

    def obtener_cliente(self, cage: int) -> dict:
        c = self._repo.cliente_por_codigo(cage)
        if c is None:
            raise NotFound(f"No existe cliente {cage} en la agenda.", "CLIENTE_NO_EXISTE")
        return c

    def buscar(self, nombre: str | None, cage: int | None) -> list[dict]:
        return self._repo.buscar_clientes((nombre or "").strip().upper() or None, cage or None)

    def actualizar_cuenta(self, u: Usuario, nfol: int, ncta: int, mesa: str, cage: int, nruc: str, nomb: str) -> str:
        exigir_local(u, self._repo.local_de_folio(nfol))
        with self._uow:
            m = self._repo.mesa(mesa)
            if m is None:
                raise NotFound("NO EXISTE MESA", "MESA_NO_EXISTE")
            if m.eliminada:
                raise Conflict(f"La Mesa '{mesa}' fue eliminada.", "MESA_ELIMINADA")
            if m.deshabilitada:
                raise Conflict(f"La Mesa '{mesa}' esta deshabilitada.", "MESA_DESHABILITADA")
            if m.estado != 3 or m.folio != nfol:
                raise Conflict(f"La Mesa '{mesa}' esta en estado libre o pertenece a otro folio.", "MESA_NO_OCUPADA")

            if cage and self._repo.cliente_por_codigo(cage) is None:
                raise NotFound(f"No existe cliente {cage} en la agenda.", "CLIENTE_NO_EXISTE")
            nruc_v, nomb_v = blank_to_none(nruc), blank_to_none(nomb)
            if self._repo.actualizar_cuenta(nfol, ncta, nomb_v, nruc_v, cage) == 0:
                raise NotFound(f"No existe la cuenta {ncta} en el folio {nfol}.", "CUENTA_NO_EXISTE")
            if nruc_v:
                self._repo.upsert_rtcfr(nruc_v, nomb_v)
            # El cliente "varios" nunca se modifica en la agenda.
            if cage and self._repo.cliente_varios() != cage:
                self._repo.actualizar_nit_agenda(cage, nruc_v)
        return f"Cuenta: {ncta} modificada."
