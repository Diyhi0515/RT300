"""Normalización de texto proveniente de columnas CHAR legacy (espacios a la derecha y codificaciones mezcladas).

Mapa de codificaciones de la base, sacado de `scripts/auditar_codificacion.py` (recorre las columnas de texto y cuenta los
bytes que tiene cada una). Conviven tres formas de escribir la ñ:

- Windows-1252 (la correcta, la del sistema principal): Ñ = 0xD1, ñ = 0xF1.
- IBM850, que usaba el PHP antiguo al escribir: ñ = 0xA4, Ñ = 0xA5, é = 0x82, á = 0xA0, í = 0xA1, ó = 0xA2, ú = 0xA3.
- Un teclado o programa que guardó la ñ como "±" (0xB1): "PE±A", "NU±EZ".

Leídos como Windows-1252 salen símbolos dentro de las palabras (`A¤EZ`, `CABA¥A`, `JOS‚`, `PE±A`).
"""
import contextlib
import re

# Símbolos que, dentro de una palabra, delatan IBM850 (no existen en nombres legítimos).
_SENAL_IBM850 = frozenset("\u00a4\u00a5\u201a")
_ENIE_COMO_MAS_MENOS = re.compile("(?<=[A-Za-z])\u00b1(?=[A-Za-z])")     # PE±A -> PEÑA
_ACENTUADAS_EN_MINUSCULA = "\u00f1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc"
_TIENE_LETRA_ACENTUADA_CORRECTA = re.compile("[\u00c0-\u00ff]")


def _en_mayusculas_si_corresponde(texto: str, original: str) -> str:
    """Un nombre que estaba en mayúsculas no debe quedar con una ñ o vocal minúscula en medio (AñEZ -> AÑEZ)."""
    resto = [c for c in original if c.isalpha() and c not in "\u00a4\u00a5\u201a\u00b1"]
    if resto and all(c.isupper() for c in resto):
        return texto.upper()
    return texto


def reparar_codificacion(valor: str) -> str:
    """Devuelve el texto bien escrito; si ya estaba bien, no lo toca."""
    if _SENAL_IBM850.intersection(valor) and not _TIENE_LETRA_ACENTUADA_CORRECTA.search(valor):
        try:
            return _en_mayusculas_si_corresponde(valor.encode("cp1252").decode("cp850"), valor)
        except UnicodeError:
            return valor
    if "\u00b1" in valor:
        return _ENIE_COMO_MAS_MENOS.sub(lambda m: _ENIE_SEGUN_MAYUSCULAS(valor, m.start()), valor)
    return valor


def _ENIE_SEGUN_MAYUSCULAS(valor: str, posicion: int) -> str:
    vecinas = valor[posicion - 1] + valor[posicion + 1]
    return "\u00d1" if vecinas.isupper() else "\u00f1"


def variantes_de_busqueda(texto: str) -> list[str]:
    """Cómo puede estar guardado `texto` en la base, para buscar por nombre sin importar la codificación de cada fila."""
    variantes = [texto]
    for forma in (texto.upper(), texto.lower()):
        with contextlib.suppress(UnicodeError, ValueError):
            en_ibm850 = forma.encode("cp850").decode("cp1252")
            if en_ibm850 != forma:      # sin letras acentuadas no hay otra forma de guardarlo
                variantes.append(en_ibm850)
    if "Ñ" in texto.upper():
        variantes.append(texto.replace("Ñ", "±").replace("ñ", "±"))
    return list(dict.fromkeys(variantes))


def clean(value) -> str:
    return "" if value is None else str(value).strip()


def to_int(value, default: int | None = None) -> int | None:
    try:
        return int(float(clean(value)))  # tolera 2.0 de columnas numéricas
    except ValueError:
        return default
