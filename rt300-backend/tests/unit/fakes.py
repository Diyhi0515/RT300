"""Dobles de prueba: unit of work y gateway en memoria."""
from __future__ import annotations

from app.core.errors import GatewayError
from app.domain.usuario import Usuario
from app.integrations.comandas.base import ResultadoGateway


class FakeUow:
    def __init__(self):
        self.commits = 0
        self.rollbacks = 0

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            self.commits += 1
        else:
            self.rollbacks += 1
        return False


class GatewayProgramable:
    """Responde lo que se le programe; guarda las peticiones recibidas."""

    def __init__(self, resultado: ResultadoGateway | None = None, falla: bool = False):
        self.resultado = resultado or ResultadoGateway(True, 77, "OK")
        self.falla = falla
        self.recibido: list = []

    def _resp(self, req):
        self.recibido.append(req)
        if self.falla:
            raise GatewayError("El servicio de comandas no está disponible.")
        return self.resultado

    alta_comanda = eliminar_comanda = reimprimir_comanda = estado_cuenta = _resp


GARZON = Usuario(usuario="GP1", nombre="GARZON 1", cloc=2, calm=2, cmon=1, nreg=0, rol="garzon")
