"""SQL de autenticación. Tablas legacy: adusr, rturt, gbage, gbrne, rtctl."""
from __future__ import annotations

from ...core.sql import SqlRepository
from ...core.text import clean, to_int
from .ports import AccesoPedidos, Credencial


class SqlAuthRepository(SqlRepository):
    def usuarios_de_pedidos(self) -> list[dict]:
        """Lista del acceso rápido. Mismo filtro que el index.php antiguo: habilitado, con clave y marcado en rturt.rturtmtab = 1."""
        return self._rows(
            """SELECT a.adusrusrn AS usuario, a.adusrnomb AS nombre
                 FROM adusr a
                WHERE a.adusrmrcb = 0
                  AND a.adusrclav IS NOT NULL
                  AND EXISTS (SELECT 1 FROM rturt r WHERE r.rturtuser = a.adusrusrn AND r.rturtmtab = 1)
                ORDER BY a.adusrnomb""")

    def credencial(self, usuario: str) -> Credencial | None:
        r = self._one("SELECT adusrusrn, adusrnomb, adusrclav, adusrmrcb, adusrcloc, adusrcalm, adusrcven "
                      "FROM adusr WHERE adusrusrn = :u", u=usuario)
        if r is None:
            return None
        return Credencial(usuario=clean(r["adusrusrn"]), nombre=clean(r["adusrnomb"]), clave_guardada=clean(r["adusrclav"]),
                          deshabilitado=to_int(r["adusrmrcb"]) == 1, cloc=to_int(r["adusrcloc"]),
                          calm=to_int(r["adusrcalm"]), cven=clean(r["adusrcven"]))

    def acceso_pedidos(self, usuario: str) -> AccesoPedidos | None:
        r = self._one("SELECT rturttpin, rturtnreg FROM rturt WHERE rturtuser = :u", u=usuario)
        if r is None:
            return None
        return AccesoPedidos(tipo_pedido_inicial=clean(r["rturttpin"]), nreg=to_int(r["rturtnreg"], 0) or 0)

    def moneda_de_venta(self) -> int | None:
        r = self._one("SELECT TOP 1 gbrnemvta FROM gbrne")
        return None if r is None else (to_int(r["gbrnemvta"], 0) or 0)

    def mesero_deshabilitado(self, cven: str) -> bool | None:
        r = self._one("SELECT gbagestat FROM gbage WHERE gbagecage = :c", c=cven)
        return None if r is None else to_int(r["gbagestat"]) == 2

    def nombre_local(self, cloc: int) -> str:
        r = self._one("SELECT vtlocdesc FROM vtloc WHERE vtloccloc = :c", c=cloc)
        return clean((r or {}).get("vtlocdesc"))

    def hay_parametros_restaurant(self) -> bool:
        return self._one("SELECT TOP 1 1 AS x FROM rtctl") is not None
