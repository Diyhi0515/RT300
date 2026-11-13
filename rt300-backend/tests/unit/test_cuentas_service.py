import pytest

from app.core.errors import NotFound
from app.modules.cuentas.service import CuentasService
from tests.unit.fakes import GARZON, GatewayProgramable


class RepoCuentas:
    def __init__(self, abiertas=(1, 2), folio_abierto=True):
        self._abiertas, self._folio = abiertas, folio_abierto

    def local_de_folio(self, n): return 2
    def folio_abierto(self, n): return self._folio
    def cuentas_abiertas(self, n): return [{"ncta": c} for c in self._abiertas]


def imprimir(repo, ncta=1):
    gw = GatewayProgramable()
    r = CuentasService(repo, gw).imprimir(GARZON, 10, ncta, "M1", "12009", "1")
    return r, gw


def test_imprime_una_cuenta_abierta():
    r, gw = imprimir(RepoCuentas())
    assert "imprimir" in r["mensaje"] and gw.recibido[0].ncta == 1


def test_no_imprime_una_cuenta_liquidada_o_inexistente():
    gw = GatewayProgramable()
    with pytest.raises(NotFound) as e:
        CuentasService(RepoCuentas(abiertas=(1,)), gw).imprimir(GARZON, 10, 2, "M1", "12009", "1")
    assert e.value.code == "CUENTA_NO_ABIERTA" and gw.recibido == []


def test_no_imprime_si_el_folio_no_esta_abierto():
    with pytest.raises(NotFound) as e:
        CuentasService(RepoCuentas(folio_abierto=False), GatewayProgramable()).imprimir(GARZON, 10, 1, "M1", "12009", "1")
    assert e.value.code == "FOLIO_NO_EXISTE"
