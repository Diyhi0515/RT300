"""Regla de renumeración de las cuentas de un folio (sin tocar la base: función pura)."""
from __future__ import annotations

from dataclasses import dataclass
from itertools import count


@dataclass(frozen=True)
class CuentaFolio:
    ncta: int
    movible: bool    # solo se puede cambiar el número a una cuenta vacía: sin comandas, sin notas de venta y no liquidada


def plan_compactacion(cuentas: list[CuentaFolio]) -> list[tuple[int, int]]:
    """Pares (número actual, número nuevo) para que las cuentas queden consecutivas desde 1.

    Las cuentas que no se pueden mover conservan su número; las vacías ocupan los números libres más bajos, en su mismo orden.
    Si hay cuentas fijas con huecos entre ellas, los huecos que no se pueden llenar se quedan. Los pares vienen en el orden
    en que se pueden aplicar uno por uno sin chocar (de menor a mayor): cada número nuevo está libre o ya fue desocupado.
    """
    fijas = {c.ncta for c in cuentas if not c.movible}
    libres = (n for n in count(1) if n not in fijas)
    cambios: list[tuple[int, int]] = []
    for cuenta in sorted((c for c in cuentas if c.movible), key=lambda c: c.ncta):
        nuevo = next(libres)
        if nuevo != cuenta.ncta:
            cambios.append((cuenta.ncta, nuevo))
    return cambios
