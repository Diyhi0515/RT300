"""Registro de gateways por modo (GATEWAY_MODE). Agregar uno nuevo = registrar una función, sin tocar el resto."""
from __future__ import annotations

from collections.abc import Callable

from ...config import Config
from ...core.errors import GatewayError
from .base import ComandasGateway
from .fake_gateway import FakeGateway


def _soap(cfg: Config) -> ComandasGateway:
    from .soap_gateway import SoapGateway

    return SoapGateway(cfg.gateway_wsdl_url, cfg.gateway_timeout_seconds, cfg.gateway_password)


def _http(cfg: Config) -> ComandasGateway:
    from .http_gateway import HttpGateway

    return HttpGateway(cfg.gateway_http_url, cfg.gateway_timeout_seconds)


def _dll(cfg: Config) -> ComandasGateway:
    from .dll_gateway import DllGateway

    return DllGateway(cfg.gateway_dll_path)


REGISTRO: dict[str, Callable[[Config], ComandasGateway]] = {
    "fake": lambda cfg: FakeGateway(),
    "soap": _soap,
    "http": _http,
    "dll": _dll,
}


def build_gateway(cfg: Config) -> ComandasGateway:
    try:
        return REGISTRO[cfg.gateway_mode.lower()](cfg)
    except KeyError:
        raise GatewayError(f"GATEWAY_MODE desconocido: {cfg.gateway_mode}") from None
