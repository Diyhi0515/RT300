"""Helpers de acceso a datos para los repositories (único sitio donde se toca SQLAlchemy Core).

- Todo SQL va parametrizado (`:nombre`). Nunca se concatenan valores.
- Las columnas CHAR legacy llegan con espacios: `rows()` hace strip() de todo str.
- `siguiente_serial()` reemplaza a `NroSerial()` del PHP, que hacía SELECT y luego UPDATE
  (condición de carrera: dos garzones podían obtener el mismo folio/transacción).
"""
from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Connection, bindparam, text

from .errors import DomainError

_IDENT = re.compile(r"^[a-z][a-z0-9_]{1,30}$")

# Contadores permitidos (tabla, campo). Lista blanca porque los identificadores no se pueden parametrizar.
_SERIALES = {("rtsrl", "rtsrlnfol"), ("rtsrl", "rtsrlntmp")}


def _clean(v: Any) -> Any:
    if isinstance(v, str):
        return v.strip()
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    return v


def rows(conn: Connection, sql: str, **params: Any) -> list[dict[str, Any]]:
    result = conn.execute(text(sql), params)
    return [{k: _clean(v) for k, v in r._mapping.items()} for r in result]


def rows_in(conn: Connection, sql: str, in_name: str, values: list[Any], **params: Any) -> list[dict[str, Any]]:
    """Como rows() pero con una lista parametrizada: usar `IN :in_name` en el SQL. Lista vacía => []."""
    if not values:
        return []
    stmt = text(sql).bindparams(bindparam(in_name, expanding=True))
    return [{k: _clean(v) for k, v in r._mapping.items()} for r in conn.execute(stmt, {in_name: values, **params})]


def one(conn: Connection, sql: str, **params: Any) -> dict[str, Any] | None:
    r = conn.execute(text(sql), params).first()
    return None if r is None else {k: _clean(v) for k, v in r._mapping.items()}


def execute(conn: Connection, sql: str, **params: Any) -> int:
    return conn.execute(text(sql), params).rowcount


def execute_many(conn: Connection, sql: str, params: list[dict[str, Any]]) -> None:
    """Un solo viaje a la BD para N filas (el PHP hacía un INSERT por fila)."""
    if params:
        conn.execute(text(sql), params)


def blank_to_none(v: Any) -> Any:
    """Equivale a ut000_strField(): cadena vacía o 'NULL' => NULL."""
    if v is None:
        return None
    s = str(v).strip()
    return None if s == "" or s.upper() == "NULL" else s


def siguiente_serial(conn: Connection, tabla: str, campo: str) -> int:
    """Devuelve el valor actual del contador y lo incrementa de forma atómica."""
    if (tabla, campo) not in _SERIALES or not _IDENT.match(campo):
        raise DomainError("Contador no permitido.", "SERIAL_INVALIDO")
    row = conn.execute(
        text(f"UPDATE {tabla} SET {campo} = {campo} + 1 OUTPUT deleted.{campo} AS serial")  # noqa: S608 (lista blanca)
    ).first()
    if row is None:
        raise DomainError("No existe la tabla de contadores o el campo.", "SERIAL_NO_EXISTE")
    return int(row.serial)


class SqlRepository:
    """Base de los repositories SQL: guarda la conexión y expone los helpers con ella ya aplicada."""

    def __init__(self, conn: Connection):
        self.conn = conn

    def _rows(self, sql: str, **p: Any) -> list[dict[str, Any]]:
        return rows(self.conn, sql, **p)

    def _rows_in(self, sql: str, in_name: str, values: list[Any], **p: Any) -> list[dict[str, Any]]:
        return rows_in(self.conn, sql, in_name, values, **p)

    def _one(self, sql: str, **p: Any) -> dict[str, Any] | None:
        return one(self.conn, sql, **p)

    def _exec(self, sql: str, **p: Any) -> int:
        return execute(self.conn, sql, **p)

    def _exec_many(self, sql: str, params: list[dict[str, Any]]) -> None:
        execute_many(self.conn, sql, params)

    def _serial(self, tabla: str, campo: str) -> int:
        return siguiente_serial(self.conn, tabla, campo)
