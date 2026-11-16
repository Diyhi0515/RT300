from __future__ import annotations

from ...core.acceso import exigir_local
from ...core.errors import Conflict, NotFound, ValidationFailed
from ...core.sql import blank_to_none
from ...domain.mesa import ESTC_LIQUIDADA
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

    def buscar_por_documento(self, documento: str) -> list[dict]:
        """NIT o CI exacto, solo dígitos (3 a 15): es lo que escribe el garzón en la pantalla de la cuenta."""
        limpio = documento.strip()
        if not (limpio.isascii() and limpio.isdigit() and 3 <= len(limpio) <= 15):
            raise ValidationFailed("El NIT o CI debe tener entre 3 y 15 dígitos.", "DOCUMENTO_INVALIDO")
        return self._repo.buscar_por_documento(limpio)

    def actualizar_cuenta(self, u: Usuario, nfol: int, ncta: int, mesa: str, cage: int, nruc: str, nomb: str) -> str:
        exigir_local(u, self._repo.local_de_folio(nfol))
        with self._uow:
            self._exigir_mesa_ocupada(mesa, nfol)

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

    def eliminar_cuentas(self, u: Usuario, nfol: int, mesa: str, cuentas: list[int]) -> dict:
        """Elimina cuentas concretas del folio, todas o ninguna. Cada una debe existir, no estar liquidada, no tener notas
        de venta ni comandas (vigentes o anuladas) y al folio le debe quedar al menos una cuenta."""
        pedidas = sorted(set(cuentas))
        if len(pedidas) != len(cuentas) or pedidas[0] < 1:
            raise ValidationFailed("La lista de cuentas tiene números repetidos o inválidos.", "CUENTAS_INVALIDAS")
        exigir_local(u, self._repo.local_de_folio(nfol))
        with self._uow:
            self._exigir_mesa_ocupada(mesa, nfol)
            existentes = {int(c["ncta"]): c for c in self._repo.estado_de_cuentas(nfol)}
            con_comandas = self._repo.cuentas_con_comandas(nfol)
            for n in pedidas:
                self._exigir_eliminable(n, existentes.get(n), n in con_comandas)
            if len(existentes) - len(pedidas) < 1:
                raise Conflict("Debe quedar al menos una cuenta en el folio.", "DEBE_QUEDAR_UNA_CUENTA")
            self._repo.borrar_cuentas(nfol, pedidas)
        return {"eliminadas": pedidas, "quedan": len(existentes) - len(pedidas)}

    # ───────────── Reglas compartidas ─────────────
    def _exigir_mesa_ocupada(self, mesa: str, nfol: int) -> None:
        m = self._repo.mesa(mesa)
        if m is None:
            raise NotFound("NO EXISTE MESA", "MESA_NO_EXISTE")
        if m.eliminada:
            raise Conflict(f"La Mesa '{mesa}' fue eliminada.", "MESA_ELIMINADA")
        if m.deshabilitada:
            raise Conflict(f"La Mesa '{mesa}' esta deshabilitada.", "MESA_DESHABILITADA")
        if m.estado != 3 or m.folio != nfol:
            raise Conflict(f"La Mesa '{mesa}' esta en estado libre o pertenece a otro folio.", "MESA_NO_OCUPADA")

    @staticmethod
    def _exigir_eliminable(ncta: int, cuenta: dict | None, tiene_comandas: bool) -> None:
        detalle = {"ncta": ncta}
        if cuenta is None:
            raise NotFound(f"No existe la cuenta {ncta} en el folio.", "CUENTA_NO_EXISTE", detalle)
        if int(cuenta["estc"] or 0) == ESTC_LIQUIDADA:
            raise Conflict(f"No se puede eliminar la cuenta {ncta}: está liquidada.", "CUENTA_LIQUIDADA", detalle)
        if int(cuenta["nvta"] or 0) > 0:
            raise Conflict(f"No se puede eliminar la cuenta {ncta}: tiene notas de venta asociadas.", "CUENTA_CON_NOTA", detalle)
        if tiene_comandas:
            raise Conflict(f"No se puede eliminar la cuenta {ncta}: tiene comandas.", "CUENTA_CON_COMANDAS", detalle)
