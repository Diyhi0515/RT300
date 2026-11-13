"""Caché en memoria con vencimiento (TTL), segura para varios hilos y con tamaño acotado.

Es por proceso: con varias instancias cada una tiene la suya (vale para datos casi estáticos como el menú).
Los valores guardados se comparten entre peticiones: quien los lea no debe modificarlos.
"""
from __future__ import annotations

import threading
import time
from collections import OrderedDict
from collections.abc import Callable, Hashable
from typing import Any


class CacheTTL:
    def __init__(self, ttl_segundos: float, max_entradas: int = 512, reloj: Callable[[], float] = time.monotonic):
        self._ttl, self._max, self._reloj = ttl_segundos, max_entradas, reloj
        self._datos: OrderedDict[Hashable, tuple[float, Any]] = OrderedDict()
        self._cerrojo = threading.Lock()

    @property
    def activa(self) -> bool:
        return self._ttl > 0

    def obtener(self, clave: Hashable, fabrica: Callable[[], Any]) -> Any:
        """Devuelve el valor vigente o lo calcula con `fabrica` y lo guarda."""
        if not self.activa:
            return fabrica()
        ahora = self._reloj()
        with self._cerrojo:
            hit = self._datos.get(clave)
            if hit is not None and hit[0] > ahora:
                self._datos.move_to_end(clave)
                return hit[1]
        valor = fabrica()
        with self._cerrojo:
            self._datos[clave] = (ahora + self._ttl, valor)
            self._datos.move_to_end(clave)
            while len(self._datos) > self._max:
                self._datos.popitem(last=False)
        return valor

    def limpiar(self) -> None:
        with self._cerrojo:
            self._datos.clear()

    def __len__(self) -> int:
        return len(self._datos)
