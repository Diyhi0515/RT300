import pytest

from app.core.errors import DomainError, Forbidden, GatewayError, NotFound
from app.integrations.comandas.base import ResultadoGateway
from app.modules.comandas.administrar import AdministrarComandasService
from app.modules.comandas.guardar import GuardarComandaService
from app.modules.comandas.ports import Autorizador
from app.modules.comandas.schemas import EliminarComandaIn, GuardarComandaIn
from tests.unit.fakes import GARZON, FakeUow, GatewayProgramable


class RepoComandas:
    def __init__(self, cuenta_abierta=True, autorizador=None):
        self._abierta, self._aut = cuenta_abierta, autorizador
        self.tmp: list[tuple[int, int, list]] = []

    def cuenta_abierta(self, f, c): return self._abierta
    def siguiente_transaccion(self): return 9001
    def insertar_rttmp(self, ntra, tipo, filas): self.tmp.append((ntra, tipo, filas))
    def autorizador(self, u): return self._aut


def comanda():
    return GuardarComandaIn.model_validate({
        "nfol": 10, "ncta": 1, "glos": "x",
        "rtcda": [{"cart": "A1", "desc": "AGUA", "cant": 2, "pvta": 8, "item": 1, "impt": 16, "cmon": 1}],
        "rttac": [{"rttacitem": 1, "rttaccart": "A1", "rttacpref": 1, "rttaccorr": 0, "rttactext": "SIN HIELO"}],
    })


def test_guardar_inserta_rttmp_confirma_y_llama_al_gateway():
    repo, uow, gw = RepoComandas(), FakeUow(), GatewayProgramable()
    r = GuardarComandaService(repo, uow, gw).guardar(GARZON, comanda())
    assert r == {"ntmp": 9001, "comanda": 77}
    assert [t[1] for t in repo.tmp] == [1, 2, 3, 4, 5] and uow.commits == 1
    assert gw.recibido[0].ntra == 9001 and gw.recibido[0].usrn == "GP1"


def test_guardar_cuenta_cerrada():
    with pytest.raises(NotFound) as e:
        GuardarComandaService(RepoComandas(cuenta_abierta=False), FakeUow(), GatewayProgramable()).guardar(GARZON, comanda())
    assert e.value.code == "CUENTA_NO_ABIERTA"


def test_si_el_gateway_cae_rttmp_queda_guardada_y_el_error_trae_ntmp():
    repo, uow = RepoComandas(), FakeUow()
    with pytest.raises(GatewayError) as e:
        GuardarComandaService(repo, uow, GatewayProgramable(falla=True)).guardar(GARZON, comanda())
    assert e.value.ntmp == 9001 and "reintentar" in e.value.message
    assert uow.commits == 1 and repo.tmp  # no se perdió lo ya confirmado


def test_gateway_que_rechaza():
    gw = GatewayProgramable(ResultadoGateway(False, None, "impresora apagada"))
    with pytest.raises(DomainError) as e:
        GuardarComandaService(RepoComandas(), FakeUow(), gw).guardar(GARZON, comanda())
    assert e.value.code == "COMANDA_RECHAZADA"


def test_reintentar_no_reinserta_rttmp():
    repo, gw = RepoComandas(), GatewayProgramable()
    GuardarComandaService(repo, FakeUow(), gw).reintentar(GARZON, 9001, 10, 1, "")
    assert repo.tmp == [] and gw.recibido[0].ntra == 9001


def eliminar_in(clave="123456"):
    return EliminarComandaIn.model_validate({"nfol": 1, "mesa": "M1", "uaut": "sup", "cont": clave, "mtvo": 1,
                                              "items": [{"ncom": 5, "item": 1}]})


def test_eliminar_con_clave_de_autorizador_incorrecta_no_toca_nada():
    repo, gw = RepoComandas(autorizador=Autorizador("SUP", "314580", False)), GatewayProgramable()
    with pytest.raises(Forbidden):
        AdministrarComandasService(repo, FakeUow(), gw).eliminar(GARZON, eliminar_in("mala"))
    assert repo.tmp == [] and gw.recibido == []


def test_eliminar_autorizador_deshabilitado():
    repo = RepoComandas(autorizador=Autorizador("SUP", "314580", True))
    with pytest.raises(Forbidden):
        AdministrarComandasService(repo, FakeUow(), GatewayProgramable()).eliminar(GARZON, eliminar_in())


def test_eliminar_ok_registra_tipo_90():
    repo, gw = RepoComandas(autorizador=Autorizador("SUP", "314580", False)), GatewayProgramable()
    r = AdministrarComandasService(repo, FakeUow(), gw).eliminar(GARZON, eliminar_in())
    assert r["ntmp"] == 9001 and repo.tmp[0][1] == 90 and repo.tmp[0][2] == [[5, 1]]
