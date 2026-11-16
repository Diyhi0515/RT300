"""Mapa previo de codificaciones: recorre las columnas de texto que usa la API y cuenta, por cada una, qué bytes no ASCII
tiene la base y cómo se leen (Windows-1252 o IBM850), para ver qué filas se reparan solas y cuáles quedan dudosas.

Solo LEE. Ejecutar contra la base de Docker o de pruebas:

    docker compose exec -T -e PYTHONPATH=/app -e PYTHONIOENCODING=utf-8 backend python scripts/auditar_codificacion.py
"""
from collections import Counter

from sqlalchemy import text

from app import create_app
from app.core.db import get_db
from app.core.text import reparar_codificacion

COLUMNAS = [
    ("gbage", "gbagenomb"), ("vtloc", "vtlocdesc"), ("inart", "inartdesc"), ("adusr", "adusrnomb"), ("rtmsa", "rtmsadesc"),
    ("rtsme", "rtsmedesc"), ("rtssm", "rtssmdesc"), ("rtaco", "rtacodesc"), ("rttxt", "rttxttext"), ("rtcpd", "rtcpddesc"),
    ("rtmtr", "rtmtrdesc"), ("rtfoc", "rtfocnomb"), ("rtcfr", "rtcfrnomb"),
]
SOLO_ASCII = "NOT LIKE '%[^ -~]%' COLLATE Latin1_General_BIN"


def main() -> None:
    app = create_app()
    with app.app_context():
        db = get_db()
        for tabla, columna in COLUMNAS:
            try:
                filas = [r[0] for r in db.execute(text(
                    f"SELECT DISTINCT {columna} FROM {tabla} WHERE {columna} LIKE '%[^ -~]%' COLLATE Latin1_General_BIN"))]  # noqa: S608
            except Exception as error:  # noqa: BLE001 - tabla o columna que no existe en esta copia
                print(f"{tabla}.{columna}: no se pudo leer ({str(error)[:50]})")
                continue
            bytes_ = Counter()
            reparadas, dudosas = [], []
            for valor in filas:
                texto = (valor or "").strip()
                for letra in texto:
                    if ord(letra) > 127:
                        bytes_[hex(ord(letra))] += 1
                arreglado = reparar_codificacion(texto)
                if arreglado != texto:
                    reparadas.append((texto, arreglado))
                elif any(ord(x) > 127 and x not in "ÁÉÍÓÚÜÑáéíóúüñ" for x in texto):
                    dudosas.append(texto)
            print(f"{tabla}.{columna}: {len(filas)} valores con acentos | reparados {len(reparadas)} | dudosos {len(dudosas)}")
            print("   caracteres:", dict(bytes_.most_common(12)))
            for antes, despues in reparadas[:3]:
                print("   reparado:", antes[:40], "->", despues[:40])
            for texto in dudosas[:5]:
                print("   DUDOSO:", texto[:60])


if __name__ == "__main__":
    main()
