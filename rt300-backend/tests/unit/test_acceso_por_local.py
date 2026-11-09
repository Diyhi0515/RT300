"""Un usuario solo opera mesas, folios y comandas de su propio local."""
import pytest

from app.core.acceso import exigir_local
from app.core.errors import Forbidden
from app.domain.mesa import Mesa
from app.modules.clientes.service import ClientesService
from app.modules.comandas.administrar import AdministrarComandasService
from app.modules.comandas.guardar import GuardarComandaService
from app.modules.comandas.schemas import EliminarComandaIn
from app.modules.salon.service import SalonService
from tests.unit.fakes import GARZON, FakeUow, GatewayProgramable
from tests.unit.test_clientes_service import OCUPADA, RepoClientes
from tests.unit.test_comandas_service import RepoComandas, comanda
from tests.unit.test_salon_service import RepoSalon

OTRO_LOCAL = 9


def test_guardia_basica():
    exigir_local(GARZON, GARZON.cloc)       # mismo local: pasa
    exigir_local(GARZON, None)              # recurso inexistente: no interviene
    with pytest.raises(Forbidden) as e:
        exigir_local(GARZON, OTRO_LOCAL)
    assert e.value.code == "OTRO_LOCAL"


def test_no_se_puede_ocupar_ni_habilitar_una_mesa_de_otro_local():
    repo = RepoSalon()
    repo.local = OTRO_LOCAL
    uow = FakeUow()
    s = SalonService(repo, uow)
    with pytest.raises(Forbidden):
        s.ocupar_mesa(GARZON, "M1", 1, 1, 1, 1)
    with pytest.raises(Forbidden):
        s.habilitar_mesa(GARZON, "M1")
    assert repo.cuentas_insertadas == [] and uow.commits == 0 and not repo.llamadas


def test_no_se_puede_ver_el_detalle_ni_las_mesas_de_otro_local():
    repo = RepoSalon()
    repo.local = OTRO_LOCAL
    s = SalonService(repo, FakeUow())
    for accion in (lambda: s.detalle_mesa(GARZON, "M1"), lambda: s.mesas_de_area(GARZON, 1),
                   lambda: s.resumen_folio(GARZON, 5), lambda: s.cuentas_folio(GARZON, 5),
                   lambda: s.modificar_mesa(GARZON, 5, 1, 1, 2)):
        with pytest.raises(Forbidden):
            accion()


def test_no_se_puede_guardar_comanda_en_folio_de_otro_local():
    repo, gw = RepoComandas(), GatewayProgramable()
    repo.local = OTRO_LOCAL
    with pytest.raises(Forbidden):
        GuardarComandaService(repo, FakeUow(), gw).guardar(GARZON, comanda())
    assert repo.tmp == [] and gw.recibido == []


def test_no_se_puede_eliminar_comanda_de_folio_de_otro_local():
    repo, gw = RepoComandas(), GatewayProgramable()
    repo.local = OTRO_LOCAL
    b = EliminarComandaIn.model_validate({"nfol": 1, "mesa": "M1", "uaut": "sup", "cont": "x", "mtvo": 1,
                                           "items": [{"ncom": 1, "item": 1}]})
    with pytest.raises(Forbidden):
        AdministrarComandasService(repo, FakeUow(), gw).eliminar(GARZON, b)
    assert repo.tmp == [] and gw.recibido == []


def test_no_se_puede_editar_cuenta_de_folio_de_otro_local():
    repo = RepoClientes(OCUPADA)
    repo.local = OTRO_LOCAL
    uow = FakeUow()
    with pytest.raises(Forbidden):
        ClientesService(repo, uow).actualizar_cuenta(GARZON, 10, 1, "M1", 0, "", "X")
    assert repo.llamadas == [] and uow.commits == 0
