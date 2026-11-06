"""Mesa del salón (núcleo compartido por salon y clientes). Códigos legacy traducidos a reglas con nombre."""
from __future__ import annotations

from dataclasses import dataclass

ESTM_LIBRE = 1
ESTM_OCUPADA = 3
ESTM_EN_UNION = 100
MRCB_ELIMINADA = 9
STAT_DESHABILITADA = 2
ESTC_ABIERTA = 1
ESTC_LIQUIDADA = 9


@dataclass(frozen=True)
class Mesa:
    codigo: str
    estado: int       # rtmsaestm
    folio: int        # rtmsanfol (0 = sin folio)
    eliminada: bool   # rtmsamrcb = 9
    deshabilitada: bool  # rtmsastat = 2

    @property
    def libre(self) -> bool:
        return self.estado == ESTM_LIBRE and self.folio == 0

    @property
    def en_union(self) -> bool:
        return self.estado == ESTM_EN_UNION
