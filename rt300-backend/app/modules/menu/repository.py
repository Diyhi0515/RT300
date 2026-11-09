"""SQL del menú. Tablas legacy: rtsme/rtssm, rtalb, rtacp, inart, inpva, gbcon, rtins, rtial, rtext/rtrem, rttxt/rttsm, rtcpd/rtaac."""
from __future__ import annotations

from ...core.sql import SqlRepository
from ...core.text import clean, to_int
from .ports import PlatoAlb, Precio

_INS_SQL = """SELECT i.rtinscart, i.rtinscins, a.inartdesc, i.rtinscant, i.rtinsmdcg, i.rtinsmerm, i.rtinsoimp, a.inartmsto
                FROM rtins i JOIN inart a ON i.rtinscins = a.inartcart
               WHERE i.rtinscart IN :cs ORDER BY i.rtinscart, i.rtinscins"""


class SqlMenuRepository(SqlRepository):
    # ───────────── Secciones ─────────────
    def secciones(self, cloc: int) -> list[dict]:
        """Secciones con al menos un plato vendible en el local (rtacp del local, o platos sin restricción de local)."""
        return self._rows("""
            SELECT s.rtsmecsme AS csme, s.rtsmedesc AS descripcion, s.rtsmestat AS stat
              FROM rtsme s
             WHERE s.rtsmestat = 1
               AND EXISTS (SELECT 1 FROM rtalb b
                            WHERE b.rtalbcsme = s.rtsmecsme AND b.rtalbstat = 1
                              AND (EXISTS (SELECT 1 FROM rtacp p WHERE p.rtacpcart = b.rtalbcart AND p.rtacpcloc = :cloc)
                                   OR NOT EXISTS (SELECT 1 FROM rtacp p2 WHERE p2.rtacpcart = b.rtalbcart)))
             ORDER BY s.rtsmecsme""", cloc=cloc)

    def subsecciones(self) -> list[dict]:
        return self._rows("SELECT rtssmcsme AS csme, rtssmcssm AS cssm, rtssmdesc AS descripcion, rtssmstat AS stat "
                          "FROM rtssm WHERE rtssmstat = 1 ORDER BY rtssmcsme, rtssmcssm")

    # ───────────── Platos ─────────────
    def platos(self, cloc: int, csme: int, cssm: int) -> list[dict]:
        """Platos con precio y moneda. El PHP lanzaba una consulta de precio por plato."""
        return self._rows("""
            SELECT a.inartdesc AS descripcion, b.rtalbcart AS cart, b.rtalbcsme AS csme, b.rtalbcssm AS cssm,
                   b.rtalbnimg AS imagen, a.inartmfra AS mfra,
                   COALESCE(p.inpvapvta, 0) AS pvta, COALESCE(p.gbconabre, 'Bs.') AS moneda
              FROM rtalb b
              JOIN inart a ON a.inartcart = b.rtalbcart
              OUTER APPLY (SELECT TOP 1 v.inpvapvta, c.gbconabre
                             FROM inpva v JOIN gbcon c ON c.gbconcorr = v.inpvamven AND c.gbconpfij = 10
                            WHERE v.inpvacart = b.rtalbcart) p
             WHERE a.inartmrcb = 0 AND b.rtalbstat = 1 AND b.rtalbcsme = :csme
               AND (:cssm = 0 OR b.rtalbcssm = :cssm)
               AND (EXISTS (SELECT 1 FROM rtacp x WHERE x.rtacpcart = b.rtalbcart AND x.rtacpcloc = :cloc)
                    OR b.rtalbmprd = 'N')
             ORDER BY a.inartdesc""", cloc=cloc, csme=csme, cssm=cssm)

    def alb(self, cart: str) -> PlatoAlb | None:
        r = self._one("SELECT rtalbcart, rtalbcsme, rtalbcssm, rtalbmcom, rtalbmprd, rtalbcbas FROM rtalb WHERE rtalbcart = :c", c=cart)
        if r is None:
            return None
        return PlatoAlb(cart=clean(r["rtalbcart"]), csme=to_int(r["rtalbcsme"], 0) or 0, cssm=to_int(r["rtalbcssm"], 0) or 0,
                        compuesto=clean(r["rtalbmcom"]) == "S", produce=clean(r["rtalbmprd"]) == "S",
                        cbas=float(r["rtalbcbas"] or 0))

    def cbas_de(self, carts: list[str]) -> dict[str, float]:
        filas = self._rows_in("SELECT rtalbcart, rtalbcbas FROM rtalb WHERE rtalbcart IN :cs", "cs", carts)
        return {clean(f["rtalbcart"]): float(f["rtalbcbas"] or 0) for f in filas}

    def precio(self, cart: str, tent: int, entg: int) -> Precio | None:
        r = self._one("SELECT inpvapvta, inpvapvt1, inpvapvt2, inpvapvt3, inpvapvt4, inpvamven FROM inpva "
                      "WHERE inpvatent = :t AND inpvaentg = :e AND inpvacart = :c", t=tent, e=entg, c=cart)
        if r is None:
            return None
        lista = {0: float(r["inpvapvta"] or 0)}
        for i in (1, 2, 3, 4):
            lista[i] = float(r[f"inpvapvt{i}"] or 0)
        return Precio(lista=lista, moneda=to_int(r["inpvamven"], 0) or 0)

    def tipo_cambio_venta(self) -> float | None:
        r = self._one("SELECT TOP 1 vtctltcve FROM vtctl")
        return None if r is None else float(r["vtctltcve"] or 0)

    def tipo_cambio_oficial(self) -> float | None:
        r = self._one("SELECT TOP 1 gbpmttcof FROM gbpmt")
        return None if r is None else float(r["gbpmttcof"] or 0)

    def centro_produccion_local(self, cart: str, cloc: int) -> int | None:
        r = self._one("SELECT rtacpccpd FROM rtacp WHERE rtacpcart = :c AND rtacpcloc = :l", c=cart, l=cloc)
        return None if r is None else to_int(r["rtacpccpd"], 0)

    # ───────────── Insumos / alternativos (por lote) ─────────────
    def insumos_de(self, carts: list[str]) -> list[dict]:
        return self._rows_in(_INS_SQL, "cs", carts)

    def alternativos_de(self, cins: list[str]) -> list[dict]:
        return self._rows_in("""SELECT r.*, a.inartdesc FROM rtial r JOIN inart a ON r.rtialcina = a.inartcart
                                 WHERE r.rtialcins IN :cs ORDER BY r.rtialcins, r.rtialitem""", "cs", cins)

    # ───────────── Extras / textos / centros ─────────────
    def extras(self, csme: int, cssm: int) -> list[dict]:
        return self._rows("""
            SELECT DISTINCT e.rtextcart AS cart, e.rtextcant AS cant, e.rtextimpt AS impt, e.rtextcmon AS cmon,
                   a.inartdesc AS descripcion, c.gbconabre AS moneda, b.rtalbnimg AS imagen
              FROM rtrem r
              JOIN rtext e ON r.rtremcart = e.rtextcart
              JOIN inart a ON a.inartcart = e.rtextcart
              JOIN rtalb b ON b.rtalbcart = e.rtextcart
              JOIN gbcon c ON c.gbconcorr = e.rtextcmon AND c.gbconpfij = 10
             WHERE r.rtremcsme = :csme AND (r.rtremcssm = :cssm OR r.rtremcssm = 0 OR r.rtremcssm IS NULL)""",
                          csme=csme, cssm=cssm)

    def textos_plato(self, csme: int) -> list[dict]:
        return self._rows("""SELECT t.rttxtpref AS pref, t.rttxtcorr AS corr, t.rttxtcapl AS capl, t.rttxttext AS text
                               FROM rttxt t
                              WHERE t.rttxtcapl IN (2, 3) AND t.rttxtcorr = 0
                                AND EXISTS (SELECT 1 FROM rttsm m WHERE m.rttsmcsme = :csme AND m.rttsmpref = t.rttxtpref)""",
                          csme=csme)

    def textos_comanda(self) -> list[dict]:
        return self._rows("SELECT rttxtpref AS pref, rttxtcorr AS corr, rttxtcapl AS capl, rttxttext AS text "
                          "FROM rttxt WHERE rttxtcapl = 1 AND rttxtcorr = 0")

    def subtextos_plato(self, csme: int, pref: int) -> list[dict]:
        return self._rows("""SELECT t.rttxtpref AS pref, t.rttxtcorr AS corr, t.rttxtcapl AS capl, t.rttxttext AS text
                               FROM rttsm m JOIN rttxt t ON t.rttxtpref = m.rttsmpref AND t.rttxtcorr = m.rttsmcorr
                              WHERE t.rttxtpref = :pref AND m.rttsmcsme = :csme""", pref=pref, csme=csme)

    def subtextos_comanda(self) -> list[dict]:
        return self._rows("SELECT rttxtpref AS pref, rttxtcorr AS corr, rttxtcapl AS capl, rttxttext AS text "
                          "FROM rttxt WHERE rttxtcapl = 1 AND rttxtcorr > 0")

    def centros_produccion(self, cart: str, cloc: int) -> list[dict]:
        return self._rows("""
            SELECT d.rtcpdccpd AS ccpd, d.rtcpddesc AS nomb
              FROM rtacp p JOIN rtcpd d ON d.rtcpdccpd = p.rtacpccpd
             WHERE p.rtacpcart = :cart AND p.rtacpcloc = :cloc
            UNION
            SELECT d.rtcpdccpd, d.rtcpddesc
              FROM rtaac a
              JOIN rtaco o ON o.rtacocaco = a.rtaaccaco
              JOIN rtcpd d ON d.rtcpdccpd = a.rtaacccpd
             WHERE a.rtaaccart = :cart AND o.rtacocloc = :cloc""", cart=cart, cloc=cloc)

    def nombre_imagen(self, cart: str) -> str | None:
        r = self._one("SELECT rtalbnimg FROM rtalb WHERE rtalbcart = :c", c=cart)
        return (r or {}).get("rtalbnimg") or None
