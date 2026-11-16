"""Extensiones de Flask y almacén de tokens revocados (memoria o Redis)."""
from __future__ import annotations

import sqlite3
import time
from contextlib import closing
from pathlib import Path
from typing import Protocol

from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

jwt = JWTManager()
cors = CORS()
limiter = Limiter(key_func=get_remote_address, default_limits=[])


class AlmacenRevocados(Protocol):
    def revocar(self, jti: str, exp: float) -> None: ...

    def esta_revocado(self, jti: str) -> bool: ...


class RevocadosEnMemoria:
    """Válido para un solo proceso: un reinicio o una segunda instancia olvidan las revocaciones."""

    def __init__(self) -> None:
        self._revocados: dict[str, float] = {}

    def revocar(self, jti: str, exp: float) -> None:
        ahora = time.time()
        for clave in [k for k, e in self._revocados.items() if e < ahora]:
            del self._revocados[clave]
        self._revocados[jti] = exp

    def esta_revocado(self, jti: str) -> bool:
        return jti in self._revocados


class RevocadosEnSqlite:
    """Archivo local: sobrevive a reinicios y lo comparten los procesos de la misma máquina, sin servicios extra.
    No sirve entre varias máquinas (para eso, Redis)."""

    def __init__(self, ruta: str | Path) -> None:
        self._ruta = Path(ruta)
        self._ruta.parent.mkdir(parents=True, exist_ok=True)
        with self._conexion() as conexion:
            conexion.execute("PRAGMA journal_mode=WAL")
            conexion.execute("CREATE TABLE IF NOT EXISTS revocados (jti TEXT PRIMARY KEY, exp REAL NOT NULL)")

    def _conexion(self) -> sqlite3.Connection:
        return sqlite3.connect(self._ruta, timeout=5)

    def revocar(self, jti: str, exp: float) -> None:
        with closing(self._conexion()) as conexion, conexion:
            conexion.execute("DELETE FROM revocados WHERE exp < ?", (time.time(),))
            conexion.execute("INSERT OR REPLACE INTO revocados (jti, exp) VALUES (?, ?)", (jti, exp))

    def esta_revocado(self, jti: str) -> bool:
        with closing(self._conexion()) as conexion:
            fila = conexion.execute("SELECT 1 FROM revocados WHERE jti = ? AND exp >= ?", (jti, time.time())).fetchone()
        return fila is not None


class RevocadosEnRedis:
    """Compartido por todas las instancias y sobrevive a reinicios. Cada entrada expira sola con el token."""

    PREFIJO = "rt300:revocado:"

    def __init__(self, cliente) -> None:
        self._cliente = cliente

    def revocar(self, jti: str, exp: float) -> None:
        segundos = max(1, int(exp - time.time()) + 1)
        self._cliente.set(self.PREFIJO + jti, 1, ex=segundos)

    def esta_revocado(self, jti: str) -> bool:
        return bool(self._cliente.exists(self.PREFIJO + jti))


_almacen: AlmacenRevocados = RevocadosEnMemoria()


def configurar_revocados(almacen: AlmacenRevocados) -> None:
    global _almacen
    _almacen = almacen


def revocar(jti: str, exp: float) -> None:
    _almacen.revocar(jti, exp)


def esta_revocado(jti: str) -> bool:
    return _almacen.esta_revocado(jti)
