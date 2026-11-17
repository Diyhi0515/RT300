"""Punto de entrada del ejecutable de RT300 para Windows Server."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv


def _program_data() -> Path:
    return Path(os.getenv("PROGRAMDATA", Path.home())) / "RT300"


def _cargar_configuracion(ruta: str | None) -> Path:
    archivo = Path(ruta or os.getenv("RT300_CONFIG_FILE", _program_data() / "config.env"))
    if archivo.is_file():
        load_dotenv(archivo, override=False)
    elif os.getenv("FLASK_ENV", "production") != "development":
        raise SystemExit(f"No se encontró la configuración: {archivo}")
    os.environ.setdefault("REVOCADOS_DB", str(_program_data() / "data" / "revocados.sqlite"))
    os.environ.setdefault("IMAGENES_CACHE_DIR", str(_program_data() / "cache"))
    return archivo


def _comprobar() -> int:
    from sqlalchemy import text

    from app.config import Config
    from app.core.db import build_engine

    cfg = Config()
    cfg.validate()
    with build_engine(cfg).connect() as conexion:
        conexion.execute(text("SELECT 1"))
    print("OK: conexión con SQL Server")

    if cfg.gateway_mode.lower() == "soap":
        import requests

        from app.integrations.comandas.soap_gateway import SoapGateway

        url = SoapGateway.normalizar_url(cfg.gateway_wsdl_url)
        respuesta = requests.get(url, timeout=cfg.gateway_timeout_seconds)
        respuesta.raise_for_status()
        print(f"OK: servicio SOAP disponible ({url})")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Servidor RT300")
    parser.add_argument("--config", help="Ruta de config.env")
    parser.add_argument("--check", action="store_true", help="Valida configuración, SQL Server y SOAP")
    parser.add_argument("--host", default=None)
    parser.add_argument("--port", type=int, default=None)
    args = parser.parse_args()
    _cargar_configuracion(args.config)

    if args.check:
        return _comprobar()

    for carpeta in (os.getenv("REVOCADOS_DB"), os.getenv("IMAGENES_CACHE_DIR")):
        if carpeta:
            ruta = Path(carpeta)
            (ruta.parent if ruta.suffix else ruta).mkdir(parents=True, exist_ok=True)

    from waitress import serve

    from app import create_app

    host = args.host or os.getenv("RT300_HOST", "0.0.0.0")
    port = args.port or int(os.getenv("RT300_PORT", "8080"))
    serve(create_app(), host=host, port=port, threads=int(os.getenv("RT300_THREADS", "8")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
