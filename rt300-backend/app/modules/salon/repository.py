"""SQL del salón. Tablas legacy: rtmsa, rtaco, rtfol, rtfoc, rtcoh/rtcda, gbven/gbage, gbpmt/gbrne/inctl/rtctl/gbcon/vtloc."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from ...core.repos_compartidos import MesaQueries
from ...core.sql import blank_to_none
from ...core.text import clean, to_int
from .ports import Cliente, FolioConMesero, Parametros


class SqlSalonRepository(MesaQueries):
    # ───────────── Lectura ─────────────
    def parametros(self) -> Parametros:
        gbpmt = self._one("SELECT TOP 1 * FROM gbpmt")
        gbrne = self._one("SELECT TOP 1 * FROM gbrne")
        inctl = self._one("SELECT TOP 1 * FROM inctl")
        rtctl = self._one("SELECT TOP 1 * FROM rtctl")
        return Parametros(
            gbpmt=gbpmt, gbrne=gbrne, inctl=inctl, rtctl=rtctl,
            fdia=datetime.fromisoformat(str(gbpmt["gbpmtfdia"])) if gbpmt and gbpmt.get("gbpmtfdia") else None,
            cliente_varios=to_int((gbrne or {}).get("gbrneccli")),
            decimales_definidos=bool(inctl and clean(inctl.get("inctlndec"))),
        )

    def moneda(self, cmon: int) -> dict | None:
        return self._one("SELECT * FROM gbcon WHERE gbconpfij = 10 AND gbconcorr = :c", c=cmon)

    def local(self, cloc: int) -> dict | None:
        return self._one("SELECT * FROM vtloc WHERE vtloccloc = :c", c=cloc)

    def area_asignada(self, usuario: str) -> int | None:
        r = self._one("SELECT rturtcaco FROM rturt WHERE rturtuser = :u", u=usuario)
        return None if r is None else (to_int(r["rturtcaco"], 0) or 0)

    def areas(self, calm: int, cloc: int) -> list[dict]:
        return self._rows("SELECT rtacocaco AS codigo, rtacodesc AS descripcion FROM rtaco "
                          "WHERE rtacocalm = :a AND rtacocloc = :l ORDER BY rtacocaco", a=calm, l=cloc)

    def meseros(self) -> list[dict]:
        return self._rows("""SELECT v.gbvencage AS codigo, g.gbagenomb AS nombre, v.gbvenpcom, v.gbvencmov,
                                    v.gbvenfpag, v.gbvencmon, v.gbvenfulq
                               FROM gbven v JOIN gbage g ON v.gbvencage = g.gbagecage ORDER BY v.gbvencage""")

    def mesas_por_area(self, caco: int) -> list[dict]:
        return self._rows("""SELECT rtmsamesa AS mesa, rtmsadesc AS descripcion, rtmsaccom AS comensales,
                                    rtmsacaco AS area, rtmsaestm AS estado, rtmsanfol AS folio, rtmsastat AS stat
                               FROM rtmsa WHERE rtmsacaco = :c AND rtmsastat = 1 AND rtmsamrcb = 0
                              ORDER BY rtmsamesa""", c=caco)

    def mesa_detalle(self, codigo: str) -> dict | None:
        return self._one("SELECT * FROM rtmsa WHERE LTRIM(RTRIM(rtmsamesa)) = :m AND rtmsastat = 1 AND rtmsamrcb = 0",
                         m=codigo.strip())

    def folio_con_mesero(self, nfol: int) -> FolioConMesero | None:
        r = self._one("""SELECT f.rtfolnfol, f.rtfolhora, f.rtfolcven, g.gbagenomb AS mesero_nombre
                           FROM rtfol f LEFT JOIN gbage g ON g.gbagecage = f.rtfolcven WHERE f.rtfolnfol = :n""", n=nfol)
        if r is None:
            return None
        return FolioConMesero(nfol=to_int(r["rtfolnfol"], 0) or 0, hora_apertura=clean(r["rtfolhora"]),
                              cven=clean(r["rtfolcven"]), mesero_nombre=clean(r["mesero_nombre"]))

    def hora_ultima_comanda(self, nfol: int) -> str | None:
        r = self._one("""SELECT TOP 1 rtcohhora AS hora FROM rtcoh
                          WHERE rtcohnfol = :n AND rtcohmrcb = 0 AND rtcohesco = 1 ORDER BY rtcohncom DESC""", n=nfol)
        return r["hora"] if r else None

    def folio_abierto_tipo1(self, nfol: int) -> dict | None:
        return self._one("SELECT rtfolccom, rtfolcven FROM rtfol WHERE rtfolnfol = :n AND rtfoltped = 1 "
                         "AND rtfolestf = 1 AND rtfolmrcb = 0", n=nfol)

    def resumen(self, nfol: int, mesa: str | None = None, ncta: int | None = None) -> list[dict]:
        return self._rows("""
            SELECT d.rtcdancom AS ncom, d.rtcdacart AS cart, a.inartdesc AS descripcion, d.rtcdapvta AS pvta,
                   ROUND(SUM(d.rtcdacant), 5) AS cant, SUM(d.rtcdaimpt) AS impt
              FROM rtcda d
              JOIN inart a ON a.inartcart = d.rtcdacart
              JOIN rtcoh h ON h.rtcohncom = d.rtcdancom
             WHERE h.rtcohesco = 1 AND h.rtcohmrcb = 0 AND d.rtcdamrcb = 0
               AND h.rtcohnfol = :nfol
               AND (:mesa IS NULL OR h.rtcohmesa = :mesa)
               AND (:ncta IS NULL OR h.rtcohncta = :ncta)
             GROUP BY d.rtcdancom, d.rtcdacart, a.inartdesc, d.rtcdapvta
             ORDER BY d.rtcdancom, d.rtcdacart""", nfol=nfol, mesa=blank_to_none(mesa), ncta=ncta)

    def cuentas_folio(self, nfol: int) -> list[dict]:
        return self._rows("""SELECT rtfocncta AS ncta, rtfocestc AS estc, rtfocmrcb AS mrcb, rtfocnomb AS nomb,
                                    rtfocimpt AS impt FROM rtfoc WHERE rtfocnfol = :n AND rtfocmrcb = 0
                              ORDER BY rtfocncta""", n=nfol)

    def contar_cuentas(self, nfol: int) -> int:
        return int(self._one("SELECT COUNT(*) AS total FROM rtfoc WHERE rtfocnfol = :n", n=nfol)["total"])

    def contar_comandas(self, nfol: int, solo_vigentes: bool = True) -> int:
        extra = " AND rtcohmrcb = 0" if solo_vigentes else ""
        return int(self._one(f"SELECT COUNT(rtcohncom) AS t FROM rtcoh WHERE rtcohnfol = :n AND rtcohesco <> 9{extra}",  # noqa: S608
                             n=nfol)["t"])

    def maxima_cuenta_con_nota(self, nfol: int) -> int:
        r = self._one("SELECT MAX(rtfocncta) AS ncta FROM rtfoc WHERE rtfocnfol = :n AND rtfocnvta > 0", n=nfol)
        return int((r or {}).get("ncta") or 0)

    def estados_de_cuentas(self, nfol: int) -> list[int]:
        filas = self._rows("SELECT rtfocestc AS estc FROM rtfoc WHERE rtfocnfol = :n", n=nfol)
        return [to_int(r["estc"], 0) or 0 for r in filas]

    def cliente(self, codigo: Any) -> Cliente | None:
        if not clean(codigo):
            return None
        r = self._one("SELECT gbagecage, gbagenomb, gbagenruc, gbagendid FROM gbage WHERE gbagecage = :c", c=codigo)
        if r is None:
            return None
        return Cliente(codigo=to_int(r["gbagecage"], 0) or 0, nombre=clean(r["gbagenomb"]), nruc=clean(r["gbagenruc"]),
                       ndid=clean(r["gbagendid"]))

    # ───────────── Escritura ─────────────
    def siguiente_folio(self) -> int:
        return self._serial("rtsrl", "rtsrlnfol")

    def tomar_mesa(self, codigo: str) -> bool:
        """Libre(1) → ocupada(3) de forma atómica. False si otro garzón la tomó antes."""
        return self._exec("UPDATE rtmsa SET rtmsaestm = 3 WHERE LTRIM(RTRIM(rtmsamesa)) = :m "
                          "AND rtmsaestm = 1 AND rtmsanfol = 0", m=codigo.strip()) == 1

    def asignar_folio_a_mesa(self, codigo: str, nfol: int) -> None:
        self._exec("UPDATE rtmsa SET rtmsaestm = 3, rtmsanfol = :f WHERE LTRIM(RTRIM(rtmsamesa)) = :m", f=nfol, m=codigo.strip())

    def liberar_mesa(self, codigo: str) -> None:
        self._exec("UPDATE rtmsa SET rtmsaestm = 1, rtmsanfol = 0 WHERE LTRIM(RTRIM(rtmsamesa)) = :m", m=codigo.strip())

    def insertar_folio(self, **p: Any) -> None:
        self._exec("""INSERT INTO rtfol (rtfolnfol, rtfolffol, rtfoltped, rtfolcaco, rtfolmesa, rtfolccom, rtfoltelf,
                                         rtfoldent, rtfolcalm, rtfolcloc, rtfolnreg, rtfolcven, rtfolzond, rtfolglos,
                                         rtfolestf, rtfolfesf, rtfolmrcb, rtfolfmrc, rtfoluser, rtfolhora, rtfolfpro)
                      VALUES (:nfol, :fdia, 1, :caco, :mesa, :ccom, NULL, NULL, :calm, :cloc, :nreg, :cven, 0, '',
                              1, :fdia, 0, :fdia, :usrn, :hora, :fdia)""", **p)

    def insertar_cuentas(self, cuentas) -> None:
        self._exec_many("""INSERT INTO rtfoc (rtfocnfol, rtfocncta, rtfocnomb, rtfocnruc, rtfocndid, rtfoccage,
                                              rtfocffol, rtfocfent, rtfochent, rtfocimpt, rtfocpcom, rtfocicom,
                                              rtfocpdsc, rtfocidsc, rtfocneto, rtfoctcam, rtfoccmon, rtfocestc,
                                              rtfocnvta, rtfocmrcb, rtfocfmrc)
                           VALUES (:nfol, :ncta, :nomb, :nruc, :ndid, :ccli, :fdia, :fdia, :hent, 0, -1, 0, 0, 0, 0,
                                   0, :cmon, 1, 0, 0, :fdia)""",
                        [{"nfol": c.nfol, "ncta": c.ncta, "nomb": c.cliente.nombre or None, "nruc": c.cliente.nruc or None,
                          "ndid": c.cliente.ndid or None, "ccli": c.cliente.codigo, "fdia": c.fdia, "hent": c.hent,
                          "cmon": c.cmon} for c in cuentas])

    def anular_folio(self, nfol: int, usrn: str, fdia: str, hora: str) -> None:
        self._exec("UPDATE rtfol SET rtfolmrcb = 9, rtfolfmrc = :f, rtfoluser = :u, rtfolhora = :h, rtfolfpro = :f "
                   "WHERE rtfolnfol = :n", f=fdia, u=usrn, h=hora, n=nfol)
        self._exec("UPDATE rtfoc SET rtfocmrcb = 9, rtfocfmrc = :f WHERE rtfocnfol = :n", f=fdia, n=nfol)

    def cerrar_folio_liquidado(self, nfol: int, usrn: str, fdia: str) -> None:
        self._exec("UPDATE rtfol SET rtfolestf = 2, rtfolfesf = :f, rtfoluser = :u WHERE rtfolnfol = :n", f=fdia, u=usrn, n=nfol)
        self._exec("UPDATE rtfoc SET rtfocmrcb = 9, rtfocfmrc = :f WHERE rtfocnfol = :n AND rtfocestc = 1", f=fdia, n=nfol)

    def actualizar_folio(self, nfol: int, ccom: int, cven: int, usrn: str, hora: str, fdia: str) -> None:
        self._exec("UPDATE rtfol SET rtfolccom = :c, rtfolcven = :v, rtfoluser = :u, rtfolhora = :h, rtfolfpro = :f "
                   "WHERE rtfolnfol = :n", c=ccom, v=cven, u=usrn, h=hora, f=fdia, n=nfol)

    def borrar_cuentas_sobrantes(self, nfol: int, desde_exclusivo: int) -> None:
        self._exec("DELETE FROM rtfoc WHERE rtfocnfol = :n AND rtfocncta > :d", n=nfol, d=desde_exclusivo)
