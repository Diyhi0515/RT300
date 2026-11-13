"""SQL de comandas. Tablas legacy: rttmp (paso hacia el servicio), rtcoh/rtcda, rtmtr, rtfol/rtfoc, adusr."""
from __future__ import annotations

from typing import Any

from ...core.errors import DomainError
from ...core.repos_compartidos import LocalQueries, PreciosQueries
from ...core.text import clean, to_int
from .ports import Autorizador, ContextoPrecios, ParametrosComanda

_GL = [f"rttmpgl{i:02d}" for i in range(1, 20)]
_PARAMETROS = ", ".join(f":g{i}" for i in range(1, 20))
# Nombres de columna y parámetros constantes (ningún dato del usuario entra en el texto del SQL)
_INSERT_TMP = f"INSERT INTO rttmp (rttmpntra, rttmptipo, {', '.join(_GL)}) VALUES (:ntra, :tipo, {_PARAMETROS})"  # noqa: S608


class SqlComandasRepository(LocalQueries, PreciosQueries):
    def contexto_precios(self, nfol: int, ncta: int, cloc: int) -> ContextoPrecios:
        """Port de la regla de RT300c.php: tipo/entidad de precio y lista del cliente de la cuenta."""
        tent, entg = self.entidad_de_precio(cloc)
        gbrne = self._one("SELECT TOP 1 gbrnelpre FROM gbrne") or {}
        cuenta = self._one("SELECT g.gbagelpre AS lpre FROM rtfoc c LEFT JOIN gbage g ON g.gbagecage = c.rtfoccage "
                           "WHERE c.rtfocnfol = :f AND c.rtfocncta = :n", f=nfol, n=ncta) or {}
        lpre = clean(cuenta.get("lpre")) or clean(gbrne.get("gbrnelpre"))
        return ContextoPrecios(tent=tent, entg=entg, lpre=to_int(lpre, 0) or 0)

    def parametros_comanda(self) -> ParametrosComanda:
        inctl = self._one("SELECT TOP 1 inctlndec FROM inctl")
        rtctl = self._one("SELECT TOP 1 rtctlcpxc FROM rtctl")
        gbpmt = self._one("SELECT TOP 1 gbpmttcof FROM gbpmt")
        if inctl is None or rtctl is None or gbpmt is None:
            raise DomainError("Faltan parámetros del restaurante (inventario, control o generales).", "SIN_PARAMETROS")
        return ParametrosComanda(cpxc=clean(rtctl.get("rtctlcpxc")), decimales=to_int(inctl.get("inctlndec"), 2) or 0,
                                 tcam=float(gbpmt.get("gbpmttcof") or 0))

    def siguiente_transaccion(self) -> int:
        return self._serial("rtsrl", "rtsrlntmp")

    def insertar_rttmp(self, ntra: int, tipo: int, filas: list[list[Any]]) -> None:
        """N filas de rttmp en un solo viaje. Cada fila = hasta 19 valores (gl01..gl19); vacío => NULL."""
        params = []
        for f in filas:
            p: dict[str, Any] = {"ntra": ntra, "tipo": tipo}
            for i in range(1, 20):
                v = f[i - 1] if i - 1 < len(f) else None
                p[f"g{i}"] = None if v is None or str(v).strip() == "" or str(v).upper() == "NULL" else str(v).strip()
            params.append(p)
        self._exec_many(_INSERT_TMP, params)

    def cuenta_abierta(self, nfol: int, ncta: int) -> bool:
        return self._one("""SELECT 1 AS x FROM rtfol f JOIN rtfoc c ON c.rtfocnfol = f.rtfolnfol
                             WHERE f.rtfolnfol = :f AND f.rtfolestf = 1 AND f.rtfolmrcb = 0
                               AND c.rtfocncta = :c AND c.rtfocestc = 1 AND c.rtfocmrcb = 0""", f=nfol, c=ncta) is not None

    def mesa_del_folio_abierto(self, nfol: int) -> str | None:
        r = self._one("SELECT rtfolmesa FROM rtfol WHERE rtfolnfol = :n AND rtfolestf = 1 AND rtfolmrcb = 0", n=nfol)
        return None if r is None else clean(r["rtfolmesa"])

    def motivos_eliminacion(self) -> list[dict]:
        return self._rows("SELECT rtmtrcodm AS codigo, rtmtrdesc AS descripcion FROM rtmtr")

    def comandas_vigentes(self, nfol: int) -> list[dict]:
        return self._rows("""SELECT h.rtcohncom AS ncom, h.rtcohncta AS ncta, h.rtcohcven AS cven, g.gbagenomb AS nomb,
                                    h.rtcohimpt AS impt
                               FROM rtcoh h JOIN gbven v ON h.rtcohcven = v.gbvencage JOIN gbage g ON v.gbvencage = g.gbagecage
                              WHERE h.rtcohmrcb = 0 AND h.rtcohesco = 1 AND h.rtcohnfol = :n
                              ORDER BY h.rtcohnfol, h.rtcohncom""", n=nfol)

    def detalle_vigente(self, nfol: int) -> list[dict]:
        """Detalle de TODAS las comandas del folio en una consulta (el PHP lanzaba una por comanda)."""
        return self._rows("""SELECT d.rtcdancom AS ncom, d.rtcdaitem AS item, h.rtcohncta AS ncta, d.rtcdacart AS cart,
                                    a.inartdesc AS descripcion, d.rtcdacant AS cant, d.rtcdapvta AS pvta
                               FROM rtcoh h
                               JOIN rtcda d ON h.rtcohncom = d.rtcdancom
                               JOIN inart a ON d.rtcdacart = a.inartcart
                              WHERE h.rtcohesco = 1 AND h.rtcohmrcb = 0 AND d.rtcdamrcb = 0 AND h.rtcohnfol = :n
                              ORDER BY d.rtcdancom, d.rtcdaitem""", n=nfol)

    def autorizador(self, usuario: str) -> Autorizador | None:
        r = self._one("SELECT adusrusrn, adusrclav, adusrmrcb FROM adusr WHERE adusrusrn = :u", u=usuario)
        if r is None:
            return None
        return Autorizador(usuario=clean(r["adusrusrn"]), clave_guardada=clean(r["adusrclav"]),
                           deshabilitado=to_int(r["adusrmrcb"]) == 1)
