"""Engine SQLAlchemy + una conexión por request (el PHP compartía un solo enlace ODBC)."""
from __future__ import annotations

from flask import Flask, g
from sqlalchemy import URL, Connection, Engine, create_engine

from ..config import Config

_engine: Engine | None = None


def build_engine(cfg: Config) -> Engine:
    odbc = (
        f"DRIVER={{{cfg.db_driver}}};SERVER={cfg.db_host},{cfg.db_port};DATABASE={cfg.db_name};"
        f"UID={cfg.db_user};PWD={{{cfg.db_password}}};TrustServerCertificate={cfg.db_trust_cert};"
        "Encrypt=yes;Connection Timeout=15"
    )
    url = URL.create("mssql+pyodbc", query={"odbc_connect": odbc})
    return create_engine(url, pool_size=10, max_overflow=10, pool_pre_ping=True, pool_recycle=1800)


def init_db(app: Flask, cfg: Config) -> None:
    global _engine
    _engine = build_engine(cfg)
    app.extensions["db_engine"] = _engine

    @app.teardown_appcontext
    def _close(exc):
        conn: Connection | None = g.pop("db", None)
        if conn is not None:
            if exc is not None:
                conn.rollback()
            conn.close()


def get_db() -> Connection:
    """Conexión del request actual. Los casos de uso hacen commit explícito."""
    if "db" not in g:
        if _engine is None:
            raise RuntimeError("init_db no fue llamado")
        g.db = _engine.connect()
    return g.db


class SqlUnitOfWork:
    """`with uow:` → commit al salir bien, rollback ante cualquier excepción (que se vuelve a lanzar)."""

    def __init__(self, conn: Connection):
        self._conn = conn

    def __enter__(self) -> "SqlUnitOfWork":
        return self

    def __exit__(self, exc_type, exc, tb) -> bool:
        if exc_type is None:
            self._conn.commit()
        else:
            self._conn.rollback()
        return False
