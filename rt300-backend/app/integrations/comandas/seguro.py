"""Llamada defensiva al gateway: cualquier fallo inesperado se traduce a GatewayError (502)."""
from __future__ import annotations

import logging
from collections.abc import Callable
from typing import TypeVar

from ...core.errors import GatewayError
from .base import ResultadoGateway

log = logging.getLogger(__name__)
R = TypeVar("R")


def invocar(fn: Callable[[R], ResultadoGateway], req: R) -> ResultadoGateway:
    try:
        return fn(req)
    except GatewayError:
        raise
    except Exception as exc:  # noqa: BLE001 - zeep/requests/pythonnet lanzan tipos muy variados
        log.exception("Fallo inesperado del gateway")
        raise GatewayError("El servicio de comandas no está disponible.") from exc
