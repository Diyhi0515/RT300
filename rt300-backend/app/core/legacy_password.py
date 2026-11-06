"""Port de `clave_calcular()` del PHP. SOLO para verificar claves existentes en adusr.adusrclav.

Esquema débil (determinista, sin sal): se mantiene únicamente por compatibilidad con la BD;
nunca debe usarse para claves nuevas. Migración prevista a hash fuerte en tabla propia.
"""
import hmac

_VALORES = {
    'A': 123,
    'B': 29,
    'C': 28,
    'D': 27,
    'E': 591,
    'F': 25,
    'G': 24,
    'H': 23,
    'I': 999,
    'J': 21,
    'K': 20,
    'L': 19,
    'M': 18,
    'N': 17,
    'O': 335,
    'P': 15,
    'Q': 14,
    'R': 13,
    'S': 12,
    'T': 11,
    'U': 113,
    'V': 9,
    'W': 8,
    'X': 7,
    'Y': 6,
    'Z': 5,
    'a': 12,
    'b': 291,
    'c': 82,
    'd': 72,
    'e': 195,
    'f': 52,
    'g': 42,
    'h': 32,
    'i': 111,
    'j': 12,
    'k': 2,
    'l': 91,
    'm': 81,
    'n': 71,
    'o': 533,
    'p': 51,
    'q': 41,
    'r': 31,
    's': 21,
    't': 99,
    'u': 311,
    'v': 90,
    'w': 10,
    'x': 30,
    'y': 40,
    'z': 50,
    '0': 1,
    '1': 10,
    '2': 21,
    '3': 32,
    '4': 43,
    '5': 54,
    '6': 65,
    '7': 76,
    '8': 87,
    '9': 98,
}
_DEFECTO = 4


def clave_calcular(clave: str) -> int:
    clave = clave.strip()
    return sum(_VALORES.get(ch, _DEFECTO) * ((i + 1) * 321) for i, ch in enumerate(clave))


def verificar(clave_ingresada: str, clave_guardada: str) -> bool:
    return hmac.compare_digest(str(clave_calcular(clave_ingresada)), (clave_guardada or "").strip())
