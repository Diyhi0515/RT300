"""Consultas que comparten varios módulos (evita que un módulo importe el repository de otro)."""
from __future__ import annotations

from ..domain.mesa import MRCB_ELIMINADA, STAT_DESHABILITADA, Mesa
from .sql import SqlRepository
from .text import clean, to_int


class MesaQueries(SqlRepository):
    def mesa(self, codigo: str) -> Mesa | None:
        r = self._one("SELECT rtmsamesa, rtmsaestm, rtmsanfol, rtmsamrcb, rtmsastat FROM rtmsa "
                      "WHERE LTRIM(RTRIM(rtmsamesa)) = :m", m=codigo.strip())
        if r is None:
            return None
        return Mesa(codigo=clean(r["rtmsamesa"]), estado=to_int(r["rtmsaestm"], 0) or 0, folio=to_int(r["rtmsanfol"], 0) or 0,
                    eliminada=to_int(r["rtmsamrcb"]) == MRCB_ELIMINADA, deshabilitada=to_int(r["rtmsastat"]) == STAT_DESHABILITADA)
