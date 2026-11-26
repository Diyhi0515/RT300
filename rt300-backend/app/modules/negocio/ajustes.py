"""Ajustes propios de la app en un archivo SQLite (como los tokens revocados). La base heredada no se modifica."""
from __future__ import annotations

import logging
import sqlite3
from contextlib import closing
from pathlib import Path

_TABLA = "CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)"


class AjustesSqlite:
    def __init__(self, ruta: str | Path):
        self._ruta = Path(ruta)

    def leer(self, clave: str) -> str | None:
        if not self._ruta.is_file():
            return None
        try:
            with closing(sqlite3.connect(self._ruta, timeout=5)) as c:
                fila = c.execute("SELECT valor FROM ajustes WHERE clave = ?", (clave,)).fetchone()
        except sqlite3.Error:
            # leer no debe dejar sin nombre la pantalla de ingreso: se usa el valor de la base
            logging.getLogger(__name__).exception("No se pudieron leer los ajustes")
            return None
        return fila[0] if fila else None

    def guardar(self, clave: str, valor: str | None) -> None:
        """`None` borra el ajuste. Lanza OSError o sqlite3.Error si no se puede escribir."""
        self._ruta.parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(self._ruta, timeout=5)) as c, c:
            c.execute(_TABLA)
            if valor is None:
                c.execute("DELETE FROM ajustes WHERE clave = ?", (clave,))
            else:
                c.execute(
                    "INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor",
                    (clave, valor),
                )
