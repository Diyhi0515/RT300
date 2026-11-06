"""Casos de uso del menú (solo lectura). Port optimizado de RT300c.php: mismas reglas, consultas por lote."""
from __future__ import annotations

from collections import defaultdict

from ...core.errors import DomainError, NotFound
from ...core.text import clean, to_int
from ...domain.usuario import Usuario
from .ports import MenuRepo, PlatoAlb

MONEDA_BS, MONEDA_USD = 1, 2
LISTAS_PRECIO = (1, 2, 3, 4)


class MenuService:
    def __init__(self, repo: MenuRepo):
        self._repo = repo

    # ───────────── Secciones y platos ─────────────
    def secciones(self, cloc: int) -> list[dict]:
        """Lista plana sección → sus subsecciones (cssm=0 es la sección en sí), como esperaba la pantalla antigua."""
        subs: dict[int, list[dict]] = defaultdict(list)
        for s in self._repo.subsecciones():
            subs[int(s["csme"])].append(s)
        out: list[dict] = []
        for s in self._repo.secciones(cloc):
            out.append({"csme": s["csme"], "cssm": 0, "descripcion": s["descripcion"], "stat": s["stat"]})
            out.extend(subs.get(int(s["csme"]), []))
        return out

    def platos(self, u: Usuario, csme: int, cssm: int) -> list[dict]:
        return self._repo.platos(u.cloc, csme, cssm)

    def extras(self, csme: int, cssm: int) -> list[dict]:
        return self._repo.extras(csme, cssm)

    # ───────────── Datos de un plato / extra ─────────────
    def datos_plato(self, u: Usuario, cart: str, entg: int, tent: int, lpre: int, cpxc: str) -> dict:
        precio = self._repo.precio(cart, tent, entg)
        if precio is None:
            raise NotFound(f"No existen precios de venta para el Articulo: {cart}", "SIN_PRECIO")
        pvta = self._convertir(precio.lista[lpre if lpre in LISTAS_PRECIO else 0], precio.moneda, u.cmon)
        return self._ficha(u, self._alb(cart), pvta, cpxc)

    def datos_extra(self, u: Usuario, cart: str, pvta: float, cmop: int, cpxc: str) -> dict:
        return self._ficha(u, self._alb(cart), self._convertir(pvta, cmop, u.cmon), cpxc)

    def alternativos(self, cins: str) -> dict:
        self._alb(cins)
        alts = self._repo.alternativos_de([cins])
        if not alts:
            return {"rtial": None, "rtcom": None}
        subs = self._repo.insumos_de([clean(a["rtialcina"]) for a in alts])
        con_insumos = {clean(s["rtinscart"]) for s in subs}
        for a in alts:
            a["swIns"] = clean(a["rtialcina"]) in con_insumos
        return {"rtial": alts, "rtcom": subs or None}

    # ───────────── Textos y centros ─────────────
    def textos(self, cart: str | None) -> dict:
        if cart:
            alb = self._alb(cart)
            return {"cart": alb.cart, "textos": self._repo.textos_plato(alb.csme)}
        return {"cart": "", "textos": self._repo.textos_comanda()}

    def subtextos(self, cart: str | None, pref: int) -> dict:
        if cart:
            alb = self._alb(cart)
            return {"cart": alb.cart, "textos": self._repo.subtextos_plato(alb.csme, pref)}
        return {"cart": "", "textos": self._repo.subtextos_comanda()}

    def centros_produccion(self, u: Usuario, cart: str, ccpd: str) -> list[dict]:
        return [{"ccpd": c["ccpd"], "nombre": f"{c['ccpd']} - {c['nomb']}", "seleccionado": str(c["ccpd"]) == str(ccpd)}
                for c in self._repo.centros_produccion(cart, u.cloc)]

    def nombre_imagen(self, cart: str) -> str | None:
        return self._repo.nombre_imagen(cart)

    # ───────────── Internos ─────────────
    def _alb(self, cart: str) -> PlatoAlb:
        alb = self._repo.alb(cart)
        if alb is None:
            raise NotFound(f"El articulo: {cart} no existe en alimentos y bebidas.", "PLATO_NO_EXISTE")
        return alb

    def _convertir(self, pvta: float, moneda_origen: int, cmon: int) -> float:
        if moneda_origen == MONEDA_BS and cmon == MONEDA_USD:
            tcof = self._repo.tipo_cambio_oficial()
            if tcof is None:
                raise DomainError("No ha definido parametros iniciales.", "SIN_PARAMETROS")
            return pvta / tcof if tcof else pvta
        if moneda_origen == MONEDA_USD and cmon == MONEDA_BS:
            tcve = self._repo.tipo_cambio_venta()
            if tcve is None:
                raise DomainError("No ha definido parametros de control en ventas.", "SIN_VTCTL")
            return pvta * tcve
        return pvta

    def _ficha(self, u: Usuario, alb: PlatoAlb, pvta: float, cpxc: str) -> dict:
        return {
            **self._estructura_insumos(alb),
            "ccpd": self._ccpd(alb, u.cloc, cpxc), "pvta": pvta, "csme": alb.csme, "cssm": alb.cssm,
            "mcom": "S" if alb.compuesto else "N", "cbas": alb.cbas,
        }

    def _ccpd(self, alb: PlatoAlb, cloc: int, cpxc: str) -> int:
        if alb.produce and cpxc == "S":
            ccpd = self._repo.centro_produccion_local(alb.cart, cloc)
            if ccpd is None:
                raise DomainError(f"Falta definir Centro de Produccion para el articulo: {alb.cart} para el local {cloc}",
                                  "SIN_CENTRO_PRODUCCION")
            return ccpd
        return 0

    def _estructura_insumos(self, alb: PlatoAlb) -> dict:
        """Insumos del plato, sus componentes (si el plato es compuesto) y alternativos. Equivale a Insumos() del PHP."""
        ins = self._repo.insumos_de([alb.cart])
        if not ins:
            return {"rtins": None, "rtcom": None, "rtial": None}

        alternos = self._repo.alternativos_de([clean(i["rtinscins"]) for i in ins])
        con_alternativo = {clean(a["rtialcins"]) for a in alternos}

        componentes: list[dict] = []
        con_componentes: set[str] = set()
        if alb.compuesto:
            compuestos = [clean(i["rtinscins"]) for i in ins if (to_int(i["inartmsto"], 0) or 0) > 1]
            cbas = self._repo.cbas_de(compuestos)
            faltante = next((c for c in compuestos if c not in cbas), None)
            if faltante:
                raise NotFound(f"El articulo: {faltante} no existe en alimentos y bebidas.", "INSUMO_NO_EXISTE")
            for sub in self._repo.insumos_de(compuestos):
                padre = clean(sub["rtinscart"])
                sub["rtalbcbas"] = cbas[padre]
                componentes.append(sub)
                con_componentes.add(padre)

        for i in ins:
            k = clean(i["rtinscins"])
            i["swIns"] = k in con_componentes
            i["swIal"] = k in con_alternativo
        return {"rtins": ins, "rtcom": componentes or None, "rtial": alternos or None}
