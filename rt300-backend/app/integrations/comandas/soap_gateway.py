"""Gateway SOAP (zeep) contra el .asmx de comandas, igual que el SoapClient del PHP.

Credenciales hacia el servicio: el PHP enviaba usrn + pass del garzón. Con JWT la clave no se guarda,
así que `pass` sale de una credencial técnica (GATEWAY_PASSWORD) — decisión pendiente (docs/00 §8 #2).
"""
from __future__ import annotations

import logging
from functools import cached_property

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


class SoapGateway:
    def __init__(self, wsdl_url: str, timeout: int, service_password: str = ""):
        if not wsdl_url:
            raise GatewayError("GATEWAY_WSDL_URL no está configurado.")
        self._wsdl, self._timeout, self._pass = wsdl_url, timeout, service_password

    @cached_property
    def _client(self):
        from requests import Session
        from zeep import Client
        from zeep.transports import Transport

        return Client(self._wsdl, transport=Transport(session=Session(), timeout=self._timeout, operation_timeout=self._timeout))

    def _call(self, op: str, **params):
        try:
            return self._invoke(op, params)
        except Exception as exc:  # noqa: BLE001 - zeep/requests lanzan muchos tipos
            log.exception("SOAP %s falló", op)
            raise GatewayError("El servicio de comandas no está disponible.") from exc

    def _invoke(self, op: str, params: dict):
        # El parámetro del WSDL se llama `pass` (palabra reservada en Python): se envía por diccionario.
        return getattr(self._client.service, op)(**{**params, "pass": self._pass})

    def alta_comanda(self, req: AltaComandaReq) -> ResultadoGateway:
        return interpretar_positivo(self._call("alta_comanda_rt300", ntra=req.ntra, nfol=req.nfol, ncta=req.ncta,
                                               cmon=req.cmon, glos=req.glos, cloc=req.cloc, usrn=req.usrn))

    def eliminar_comanda(self, req: EliminarComandaReq) -> ResultadoGateway:
        return interpretar_positivo(self._call("eliminar_comanda_rt300", ntra=req.ntra, nfol=req.nfol, mesa=req.mesa,
                                               uaut=req.uaut, cont=req.cont, mtvo=req.mtvo, usrn=req.usrn))

    def reimprimir_comanda(self, req: ReimprimirComandaReq) -> ResultadoGateway:
        return interpretar_positivo(self._call("Reimprimir_comanda_rt300", ntra=req.ntra, nfol=req.nfol, mesa=req.mesa,
                                               uaut=req.uaut, mtvo=req.mtvo, usrn=req.usrn))

    def estado_cuenta(self, req: EstadoCuentaReq) -> ResultadoGateway:
        return interpretar_100(self._call("stdo_cuenta_rt303", nfol=req.nfol, ncta=req.ncta, tped=req.tped, mesa=req.mesa,
                                          cven=req.cven, caco=req.caco, calm=req.calm, cloc=req.cloc, usrn=req.usrn))
