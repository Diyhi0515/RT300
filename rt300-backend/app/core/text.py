"""Normalización de texto proveniente de columnas CHAR legacy (espacios a la derecha)."""


def clean(value) -> str:
    return "" if value is None else str(value).strip()


def to_int(value, default: int | None = None) -> int | None:
    try:
        return int(float(clean(value)))  # tolera 2.0 de columnas numéricas
    except ValueError:
        return default
