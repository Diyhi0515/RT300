"""Consultas que comparten varios módulos (evita que un módulo importe el repository de otro)."""
from __future__ import annotations

from ..domain.mesa import MRCB_ELIMINADA, STAT_DESHABILITADA, Mesa
from .sql import SqlRepository
from .text import clean, to_int


class LocalQueries(SqlRepository):
    """A qué local pertenece cada recurso (para el control de acceso por local)."""

    def local_de_folio(self, nfol: int) -> int | None:
        r = self._one("SELECT rtfolcloc FROM rtfol WHERE rtfolnfol = :n", n=nfol)
        return None if r is None else to_int(r["rtfolcloc"])

    def local_de_mesa(self, codigo: str) -> int | None:
        r = self._one("SELECT o.rtacocloc FROM rtmsa m JOIN rtaco o ON o.rtacocaco = m.rtmsacaco "
                      "WHERE LTRIM(RTRIM(m.rtmsamesa)) = :m", m=codigo.strip())
        return None if r is None else to_int(r["rtacocloc"])

    def local_de_area(self, caco: int) -> int | None:
        r = self._one("SELECT TOP 1 rtacocloc FROM rtaco WHERE rtacocaco = :c", c=caco)
        return None if r is None else to_int(r["rtacocloc"])


class MesaQueries(LocalQueries):
    def mesa(self, codigo: str) -> Mesa | None:
        r = self._one("SELECT rtmsamesa, rtmsaestm, rtmsanfol, rtmsamrcb, rtmsastat FROM rtmsa "
                      "WHERE LTRIM(RTRIM(rtmsamesa)) = :m", m=codigo.strip())
        if r is None:
            return None
        return Mesa(codigo=clean(r["rtmsamesa"]), estado=to_int(r["rtmsaestm"], 0) or 0, folio=to_int(r["rtmsanfol"], 0) or 0,
                    eliminada=to_int(r["rtmsamrcb"]) == MRCB_ELIMINADA, deshabilitada=to_int(r["rtmsastat"]) == STAT_DESHABILITADA)
