"""Regresión del problema del sistema antiguo: conexión ODBC compartida que se cerraba y dejaba los datos vacíos.

Aquí se comprueba que los helpers materializan los resultados (no devuelven cursores perezosos) y que dos
repositorios sobre la misma conexión no se pisan entre sí.
"""
import pytest
from sqlalchemy import create_engine, text

from app.core.sql import SqlRepository, one, rows


@pytest.fixture
def engine():
    e = create_engine("sqlite://")
    with e.begin() as c:
        c.execute(text("CREATE TABLE t (id INTEGER, nombre CHAR(10))"))
        c.execute(text("INSERT INTO t VALUES (1, 'uno       '), (2, 'dos       ')"))
    return e


def test_los_resultados_sobreviven_al_cierre_de_la_conexion(engine):
    c = engine.connect()
    todos, primero = rows(c, "SELECT * FROM t ORDER BY id"), one(c, "SELECT * FROM t WHERE id = :i", i=1)
    c.close()
    assert [r["nombre"] for r in todos] == ["uno", "dos"]     # strip() de CHAR legacy
    assert primero == {"id": 1, "nombre": "uno"}


def test_dos_repositorios_comparten_conexion_sin_vaciarse(engine):
    c = engine.connect()
    a, b = SqlRepository(c), SqlRepository(c)
    la = a._rows("SELECT id FROM t ORDER BY id")
    lb = b._rows("SELECT id FROM t ORDER BY id")
    assert la == lb == [{"id": 1}, {"id": 2}]
    assert a._one("SELECT id FROM t WHERE id = 2") == {"id": 2}   # sigue viva tras usar la otra


def test_cada_peticion_obtiene_su_propia_conexion(engine):
    c1, c2 = engine.connect(), engine.connect()
    assert c1 is not c2
    c1.close()
    assert rows(c2, "SELECT COUNT(*) AS n FROM t") == [{"n": 2}]   # cerrar una no afecta a la otra
