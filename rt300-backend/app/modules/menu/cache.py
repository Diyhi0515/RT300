"""Decorador del repositorio del menú: guarda en memoria las lecturas casi estáticas (secciones, platos, extras, textos).

Implementa el mismo contrato que `SqlMenuRepository` (patrón decorador), así que `MenuService` no sabe que existe.
Lo que cambia con cada venta (precio de una ficha, insumos, tipo de cambio) NO se guarda: pasa directo al repositorio.
El menú se refresca solo al vencer el TTL (`MENU_CACHE_SECONDS`, 0 = sin caché).
"""
from __future__ import annotations

from ...core.cache import CacheTTL
from .ports import MenuRepo


class MenuRepoConCache:
    def __init__(self, interno: MenuRepo, cache: CacheTTL):
        self._interno, self._cache = interno, cache

    def _guardado(self, nombre: str, *argumentos):
        return self._cache.obtener((nombre, *argumentos), lambda: getattr(self._interno, nombre)(*argumentos))

    def secciones(self, cloc: int) -> list[dict]:
        return self._guardado("secciones", cloc)

    def subsecciones(self) -> list[dict]:
        return self._guardado("subsecciones")

    def platos(self, cloc: int, csme: int, cssm: int) -> list[dict]:
        return self._guardado("platos", cloc, csme, cssm)

    def extras(self, csme: int, cssm: int) -> list[dict]:
        return self._guardado("extras", csme, cssm)

    def textos_plato(self, csme: int) -> list[dict]:
        return self._guardado("textos_plato", csme)

    def textos_comanda(self) -> list[dict]:
        return self._guardado("textos_comanda")

    def subtextos_plato(self, csme: int, pref: int) -> list[dict]:
        return self._guardado("subtextos_plato", csme, pref)

    def subtextos_comanda(self) -> list[dict]:
        return self._guardado("subtextos_comanda")

    def centros_produccion(self, cart: str, cloc: int) -> list[dict]:
        return self._guardado("centros_produccion", cart, cloc)

    def __getattr__(self, nombre: str):
        """Todo lo demás (ficha, precio, insumos, tipo de cambio...) va directo al repositorio."""
        return getattr(self._interno, nombre)
