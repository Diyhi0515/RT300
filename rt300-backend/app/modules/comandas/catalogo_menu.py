"""Adaptador entre el módulo comandas y el módulo menu (capa anticorrupción).

`comandas` define qué necesita del catálogo (`CatalogoPlatos`, con dataclasses propias) y este adaptador lo obtiene del
`MenuService`, traduciendo sus diccionarios legacy. Así `comandas` no conoce ni importa el menú: solo lo conoce el composition root.
"""
from __future__ import annotations

from ...core.text import clean
from ...domain.usuario import Usuario
from .ports import ComponenteFicha, ContextoPrecios, FichaComanda, InsumoFicha


class CatalogoDesdeMenu:
    def __init__(self, menu):
        self._menu = menu

    def ficha(self, u: Usuario, cart: str, ctx: ContextoPrecios, cpxc: str) -> FichaComanda:
        d = self._menu.datos_plato(u, cart, entg=ctx.entg, tent=ctx.tent, lpre=ctx.lpre, cpxc=cpxc)
        insumos = [InsumoFicha(cins=clean(i["rtinscins"]), descripcion=clean(i.get("inartdesc")),
                               cantidad=float(i.get("rtinscant") or 0), merma_pct=float(i.get("rtinsmerm") or 0),
                               mdcg=i.get("rtinsmdcg"), oimp=i.get("rtinsoimp")) for i in (d.get("rtins") or [])]
        componentes = [ComponenteFicha(padre=clean(c["rtinscart"]), cins=clean(c["rtinscins"]),
                                       descripcion=clean(c.get("inartdesc")), cantidad=float(c.get("rtinscant") or 0),
                                       merma_pct=float(c.get("rtinsmerm") or 0), cbas=float(c.get("rtalbcbas") or 0),
                                       mdcg=c.get("rtinsmdcg"), oimp=c.get("rtinsoimp")) for c in (d.get("rtcom") or [])]
        return FichaComanda(cart=clean(cart), descripcion=clean(d.get("descripcion")), pvta=float(d["pvta"]),
                            ccpd=int(d.get("ccpd") or 0), cbas=float(d.get("cbas") or 0), insumos=insumos, componentes=componentes)
