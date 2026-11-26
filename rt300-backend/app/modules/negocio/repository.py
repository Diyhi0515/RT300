"""Datos generales de la empresa. Tabla legacy: gbpmt (una sola fila, compartida con el resto del sistema)."""
from __future__ import annotations

from ...core.sql import SqlRepository


class SqlNegocioRepository(SqlRepository):
    def nombre(self) -> str | None:
        fila = self._one("SELECT TOP 1 gbpmtnomb AS nombre FROM gbpmt")
        return (fila or {}).get("nombre") or None
