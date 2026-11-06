"""Gateway de desarrollo/pruebas: no imprime nada, siempre responde éxito."""
from __future__ import annotations

import itertools
import logging

from .base import (
    AltaComandaReq,
    EliminarComandaReq,
    EstadoCuentaReq,
    ReimprimirComandaReq,
    ResultadoGateway,
)

log = logging.getLogger(__name__)
_comanda = itertools.count(900000)


class FakeGateway:
    def alta_comanda(self, req: AltaComandaReq) -> ResultadoGateway:
        n = next(_comanda)
        log.info("FakeGateway.alta_comanda %s -> comanda %s", req, n)
        return ResultadoGateway(True, n, "OK (fake)", n)

    def eliminar_comanda(self, req: EliminarComandaReq) -> ResultadoGateway:
        log.info("FakeGateway.eliminar_comanda ntra=%s", req.ntra)
        return ResultadoGateway(True, 1, "OK (fake)", 1)

    def reimprimir_comanda(self, req: ReimprimirComandaReq) -> ResultadoGateway:
        log.info("FakeGateway.reimprimir_comanda ntra=%s", req.ntra)
        return ResultadoGateway(True, 1, "OK (fake)", 1)

    def estado_cuenta(self, req: EstadoCuentaReq) -> ResultadoGateway:
        log.info("FakeGateway.estado_cuenta %s", req)
        return ResultadoGateway(True, 100, "OK (fake)", 100)
