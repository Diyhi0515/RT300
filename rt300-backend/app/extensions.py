from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

jwt = JWTManager()

# Tokens revocados (jti -> exp). En memoria: válido para 1 proceso; con varias instancias mover a Redis/tabla propia.
_REVOCADOS: dict[str, float] = {}


def revocar(jti: str, exp: float) -> None:
    import time

    ahora = time.time()
    for k in [k for k, e in _REVOCADOS.items() if e < ahora]:  # poda de los ya vencidos
        del _REVOCADOS[k]
    _REVOCADOS[jti] = exp


def esta_revocado(jti: str) -> bool:
    return jti in _REVOCADOS
cors = CORS()
limiter = Limiter(key_func=get_remote_address, default_limits=[], storage_uri="memory://")
