"""Gateway por DLL .NET con pythonnet (solo Windows con runtime .NET). Pendiente de confirmar el tipo de DLL.

Cumple el contrato (es sustituible) pero cada operación informa que aún no está implementada, en lugar de
fallar al construirse. Ver docs/01-backend-flask.md §7.3 y docs/00 §8 #1.
"""
from __future__ import annotations

from ...core.errors import GatewayError
from .base import AltaComandaReq, EliminarComandaReq, EstadoCuentaReq, ReimprimirComandaReq, ResultadoGateway


class DllGateway:
    def __init__(self, dll_path: str = ""):
        self._dll_path = dll_path

    def _no_implementado(self) -> ResultadoGateway:
        raise GatewayError("DllGateway aún no está implementado: confirme el tipo de DLL.")

    def alta_comanda(self, req: AltaComandaReq) -> ResultadoGateway:
        return self._no_implementado()

    def eliminar_comanda(self, req: EliminarComandaReq) -> ResultadoGateway:
        return self._no_implementado()

    def reimprimir_comanda(self, req: ReimprimirComandaReq) -> ResultadoGateway:
        return self._no_implementado()

    def estado_cuenta(self, req: EstadoCuentaReq) -> ResultadoGateway:
        return self._no_implementado()
