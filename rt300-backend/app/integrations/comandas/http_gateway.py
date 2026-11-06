"""Gateway HTTP/JSON hacia un sidecar (p. ej. proceso .NET que carga la DLL de comandas).

Contrato esperado del sidecar: POST {base}/{operacion} con JSON y respuesta {"resultado": <valor>}.
"""
from __future__ import annotations

import logging
from dataclasses import asdict

import requests

from ...core.errors import GatewayError
from .base import (
    AltaComandaReq,
    EliminarComandaReq,
    EstadoCuentaReq,
    ReimprimirComandaReq,
    ResultadoGateway,
    interpretar_100,
    interpretar_positivo,
)

log = logging.getLogger(__name__)


class HttpGateway:
    def __init__(self, base_url: str, timeout: int):
        if not base_url:
            raise GatewayError("GATEWAY_HTTP_URL no está configurado.")
        self._base, self._timeout = base_url.rstrip("/"), timeout

    def _post(self, op: str, req) -> object:
        try:
            r = requests.post(f"{self._base}/{op}", json=asdict(req), timeout=self._timeout)
            r.raise_for_status()
            return r.json().get("resultado")
        except (requests.RequestException, ValueError) as exc:
            log.exception("HTTP gateway %s falló", op)
            raise GatewayError("El servicio de comandas no está disponible.") from exc

    def alta_comanda(self, req: AltaComandaReq) -> ResultadoGateway:
        return interpretar_positivo(self._post("alta_comanda", req))

    def eliminar_comanda(self, req: EliminarComandaReq) -> ResultadoGateway:
        return interpretar_positivo(self._post("eliminar_comanda", req))

    def reimprimir_comanda(self, req: ReimprimirComandaReq) -> ResultadoGateway:
        return interpretar_positivo(self._post("reimprimir_comanda", req))

    def estado_cuenta(self, req: EstadoCuentaReq) -> ResultadoGateway:
        return interpretar_100(self._post("estado_cuenta", req))
