"""Adaptador entre el módulo comandas y el módulo menu (capa anticorrupción).

`comandas` define qué necesita del catálogo (`CatalogoPlatos`, con dataclasses propias) y este adaptador lo obtiene del
`MenuService`, traduciendo sus diccionarios legacy. Así `comandas` no conoce ni importa el menú: solo lo conoce el composition root.
"""
from __future__ import annotations

from ...core.text import clean
from ...domain.usuario import Usuario
from .ports import AlternativoFicha, ComponenteFicha, ContextoPrecios, ExtraFicha, FichaComanda, InsumoFicha


class CatalogoDesdeMenu:
    def __init__(self, menu):
        self._menu = menu

    def ficha(self, u: Usuario, cart: str, ctx: ContextoPrecios, cpxc: str) -> FichaComanda:
        return self._a_ficha(cart, self._menu.datos_plato(u, cart, entg=ctx.entg, tent=ctx.tent, lpre=ctx.lpre, cpxc=cpxc))

    def extras_del_plato(self, csme: int, cssm: int) -> dict[str, ExtraFicha]:
        return {clean(e["cart"]): ExtraFicha(cart=clean(e["cart"]), descripcion=clean(e.get("descripcion")),
                                             impt=float(e.get("impt") or 0), cmon=int(e.get("cmon") or 0))
                for e in self._menu.extras(csme, cssm)}

    def ficha_extra(self, u: Usuario, extra: ExtraFicha, cpxc: str) -> FichaComanda:
        return self._a_ficha(extra.cart, self._menu.datos_extra(u, extra.cart, extra.impt, extra.cmon, cpxc),
                             descripcion=extra.descripcion)

    def alternativos(self, cins: str) -> list[AlternativoFicha]:
        d = self._menu.alternativos(cins)
        componentes = [self._componente(c) for c in (d.get("rtcom") or [])]
        return [AlternativoFicha(cins=clean(cins), cina=clean(a["rtialcina"]), descripcion=clean(a.get("inartdesc")),
                                 componentes=[c for c in componentes if c.padre == clean(a["rtialcina"])])
                for a in (d.get("rtial") or [])]

    def textos_del_plato(self, cart: str) -> dict[tuple[int, int], str]:
        textos: dict[tuple[int, int], str] = {}
        for pref in {int(t["pref"]) for t in self._menu.textos(cart)["textos"]}:
            for t in self._menu.subtextos(cart, pref)["textos"]:
                textos[(int(t["pref"]), int(t["corr"]))] = clean(t.get("text"))
        return textos

    def textos_de_comanda(self) -> dict[tuple[int, int], str]:
        return {(int(t["pref"]), int(t["corr"])): clean(t.get("text")) for t in self._menu.subtextos(None, 0)["textos"]}

    def centros_de_produccion(self, u: Usuario, cart: str) -> set[int]:
        return {int(c["ccpd"]) for c in self._menu.centros_produccion(u, cart, "")}

    @staticmethod
    def _componente(c: dict) -> ComponenteFicha:
        return ComponenteFicha(padre=clean(c["rtinscart"]), cins=clean(c["rtinscins"]), descripcion=clean(c.get("inartdesc")),
                               cantidad=float(c.get("rtinscant") or 0), merma_pct=float(c.get("rtinsmerm") or 0),
                               cbas=float(c.get("rtalbcbas") or 0), mdcg=c.get("rtinsmdcg"), oimp=c.get("rtinsoimp"))

    def _a_ficha(self, cart: str, d: dict, descripcion: str | None = None) -> FichaComanda:
        insumos = [InsumoFicha(cins=clean(i["rtinscins"]), descripcion=clean(i.get("inartdesc")),
                               cantidad=float(i.get("rtinscant") or 0), merma_pct=float(i.get("rtinsmerm") or 0),
                               mdcg=i.get("rtinsmdcg"), oimp=i.get("rtinsoimp")) for i in (d.get("rtins") or [])]
        return FichaComanda(cart=clean(cart), descripcion=descripcion or clean(d.get("descripcion")), pvta=float(d["pvta"]),
                            ccpd=int(d.get("ccpd") or 0), cbas=float(d.get("cbas") or 0), csme=int(d.get("csme") or 0),
                            cssm=int(d.get("cssm") or 0), insumos=insumos,
                            componentes=[self._componente(c) for c in (d.get("rtcom") or [])])
