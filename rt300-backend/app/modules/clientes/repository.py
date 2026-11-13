"""SQL de clientes/cuentas. Tablas legacy: gbage (agenda), rtfoc (cuentas del folio), rtcfr (NIT→nombre), gbrne."""
from __future__ import annotations

from ...core.repos_compartidos import MesaQueries
from ...core.text import to_int


class SqlClientesRepository(MesaQueries):
    def cuentas_abiertas(self, nfol: int) -> list[dict]:
        """Cuentas abiertas con el nombre del cliente en una consulta (el PHP hacía una por cuenta)."""
        return self._rows("""
            SELECT c.rtfocnfol AS nfol, c.rtfocncta AS ncta, c.rtfocnomb AS nombre, c.rtfocnruc AS nruc,
                   c.rtfocndid AS ndid, c.rtfoccage AS cage, COALESCE(g.gbagenomb, '') AS cliente
              FROM rtfoc c LEFT JOIN gbage g ON g.gbagecage = c.rtfoccage AND c.rtfoccage <> 0
             WHERE c.rtfocnfol = :n AND c.rtfocestc = 1 AND c.rtfocmrcb = 0
             ORDER BY c.rtfocncta""", n=nfol)

    def cliente_por_codigo(self, cage: int) -> dict | None:
        """Solo lo que usa la pantalla (antes devolvía la fila completa de gbage, con datos personales)."""
        return self._one("SELECT gbagecage AS codigo, gbagenomb AS nombre, gbagenruc AS nruc, gbagendid AS ndid, "
                         "gbagelpre AS lpre FROM gbage WHERE gbagecage = :c", c=cage)

    def buscar_clientes(self, nombre: str | None, cage: int | None, limite: int = 100) -> list[dict]:
        return self._rows("""
            SELECT TOP (:lim) gbagecage AS codigo, gbagenomb AS nombre, gbagenruc AS nruc
              FROM gbage
             WHERE (:nombre IS NULL OR gbagenomb LIKE :nombre)
               AND (:cage IS NULL OR gbagecage = :cage)
             ORDER BY gbagenomb""", lim=limite, nombre=f"%{nombre}%" if nombre else None, cage=cage)

    def cliente_varios(self) -> int | None:
        r = self._one("SELECT TOP 1 gbrneccli FROM gbrne")
        return None if r is None else to_int(r["gbrneccli"])

    def actualizar_cuenta(self, nfol: int, ncta: int, nombre: str | None, nruc: str | None, cage: int) -> int:
        return self._exec("UPDATE rtfoc SET rtfocnomb = :nomb, rtfocnruc = :nruc, rtfoccage = :cage "
                          "WHERE rtfocnfol = :nfol AND rtfocncta = :ncta", nomb=nombre, nruc=nruc, cage=cage, nfol=nfol, ncta=ncta)

    def upsert_rtcfr(self, nruc: str, nombre: str | None) -> None:
        """Registro NIT→nombre. El PHP preguntaba por la variable equivocada y por eso nunca insertaba."""
        if self._exec("UPDATE rtcfr SET rtcfrnomb = :nomb WHERE rtcfrnici = :nruc", nomb=nombre, nruc=nruc) == 0:
            self._exec("INSERT INTO rtcfr (rtcfrnici, rtcfrnomb) VALUES (:nruc, :nomb)", nruc=nruc, nomb=nombre)

    def actualizar_nit_agenda(self, cage: int, nruc: str | None) -> None:
        self._exec("UPDATE gbage SET gbagenruc = :nruc WHERE gbagecage = :cage", nruc=nruc, cage=cage)
