"""SQL de estado de cuenta. Tablas legacy: rtfol/rtfoc, rtcoh/rtcda, inart, gbcon."""
from __future__ import annotations

from ...core.sql import SqlRepository, blank_to_none


class SqlCuentasRepository(SqlRepository):
    def folio_abierto(self, nfol: int) -> bool:
        return self._one("SELECT 1 AS x FROM rtfol WHERE rtfolnfol = :n AND rtfolestf = 1 AND rtfolmrcb = 0", n=nfol) is not None

    def moneda(self, cmon: int) -> dict | None:
        return self._one("SELECT * FROM gbcon WHERE gbconpfij = 10 AND gbconcorr = :c", c=cmon)

    def cuentas_abiertas(self, nfol: int) -> list[dict]:
        return self._rows("""
            SELECT c.rtfocnfol AS nfol, c.rtfocncta AS ncta, c.rtfocnomb AS nombre, c.rtfocnruc AS nruc,
                   c.rtfocndid AS ndid, c.rtfoccage AS cage, COALESCE(g.gbagenomb, '') AS cliente, c.rtfoccmon AS cmon
              FROM rtfol f
              JOIN rtfoc c ON c.rtfocnfol = f.rtfolnfol
              LEFT JOIN gbage g ON g.gbagecage = c.rtfoccage AND c.rtfoccage <> 0
             WHERE f.rtfolnfol = :n AND f.rtfolestf = 1 AND f.rtfolmrcb = 0 AND c.rtfocestc = 1 AND c.rtfocmrcb = 0
             ORDER BY c.rtfocncta""", n=nfol)

    def consumo_detalle(self, nfol: int, ncta: int) -> list[dict]:
        """rtcoh+rtcda+inart en una sola consulta (el PHP lanzaba un SELECT inart por línea)."""
        return self._rows("""
            SELECT h.rtcohncom AS ncom, d.rtcdacart AS cart, d.rtcdaimpt AS impt, h.rtcohcven AS cven,
                   d.rtcdacant AS cant, d.rtcdapvta AS pvta,
                   a.inartdesc AS descripcion, a.inarttart AS tart, a.inartmsto AS msto, a.inartcgru AS cgru,
                   a.inartcsub AS csub, a.inartccla AS ccla, a.inartcscl AS cscl, a.inartmexe AS mexe,
                   CASE WHEN a.inartmexe = 'N' THEN 0 ELSE 1 END AS faex
              FROM rtcoh h
              JOIN rtcda d ON h.rtcohncom = d.rtcdancom
              LEFT JOIN inart a ON a.inartcart = d.rtcdacart
             WHERE h.rtcohnfol = :f AND h.rtcohncta = :c AND d.rtcdamrcb = 0 AND h.rtcohmrcb = 0 AND h.rtcohesco = 1
             ORDER BY h.rtcohncom""", f=nfol, c=ncta)

    def resumen(self, nfol: int, mesa: str | None, ncta: int) -> list[dict]:
        return self._rows("""
            SELECT d.rtcdancom AS ncom, d.rtcdacart AS cart, a.inartdesc AS descripcion, d.rtcdapvta AS pvta,
                   ROUND(SUM(d.rtcdacant), 5) AS cant, SUM(d.rtcdaimpt) AS impt
              FROM rtcda d
              JOIN inart a ON a.inartcart = d.rtcdacart
              JOIN rtcoh h ON h.rtcohncom = d.rtcdancom
             WHERE h.rtcohesco = 1 AND h.rtcohmrcb = 0 AND d.rtcdamrcb = 0
               AND h.rtcohnfol = :nfol AND (:mesa IS NULL OR h.rtcohmesa = :mesa) AND h.rtcohncta = :ncta
             GROUP BY d.rtcdancom, d.rtcdacart, a.inartdesc, d.rtcdapvta
             ORDER BY d.rtcdancom, d.rtcdacart""", nfol=nfol, mesa=blank_to_none(mesa), ncta=ncta)
