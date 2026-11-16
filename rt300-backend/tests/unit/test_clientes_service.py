import pytest

from app.core.errors import Conflict, NotFound
from app.domain.mesa import Mesa
from app.modules.clientes.service import ClientesService
from tests.unit.fakes import GARZON, FakeUow


class RepoClientes:
    def __init__(self, mesa, filas=1, varios=1):
        self._mesa, self._filas, self._varios = mesa, filas, varios
        self.llamadas = []

    local = 2   # mismo local que GARZON

    def local_de_folio(self, n): return self.local
    def mesa(self, c): return self._mesa
    def actualizar_cuenta(self, *a): return self._filas
    def upsert_rtcfr(self, nruc, nombre): self.llamadas.append(("rtcfr", nruc))
    def cliente_varios(self): return self._varios
    def cliente_por_codigo(self, cage): return {"codigo": cage} if cage != 404 else None
    def actualizar_nit_agenda(self, cage, nruc): self.llamadas.append(("agenda", cage))


OCUPADA = Mesa("M1", 3, 10, False, False)


def test_actualiza_cuenta_y_registra_nit():
    repo, uow = RepoClientes(OCUPADA), FakeUow()
    msg = ClientesService(repo, uow).actualizar_cuenta(GARZON, 10, 1, "M1", cage=55, nruc="123", nomb="JUAN")
    assert msg == "Cuenta: 1 modificada." and ("rtcfr", "123") in repo.llamadas and ("agenda", 55) in repo.llamadas
    assert uow.commits == 1


def test_cliente_varios_no_se_modifica_en_la_agenda():
    repo = RepoClientes(OCUPADA, varios=55)
    ClientesService(repo, FakeUow()).actualizar_cuenta(GARZON, 10, 1, "M1", cage=55, nruc="123", nomb="JUAN")
    assert ("agenda", 55) not in repo.llamadas


@pytest.mark.parametrize("mesa", [Mesa("M1", 1, 0, False, False), Mesa("M1", 3, 99, False, False)])
def test_mesa_libre_o_de_otro_folio(mesa):
    with pytest.raises(Conflict) as e:
        ClientesService(RepoClientes(mesa), FakeUow()).actualizar_cuenta(GARZON, 10, 1, "M1", 0, "", "X")
    assert e.value.code == "MESA_NO_OCUPADA"


def test_cuenta_inexistente_hace_rollback():
    uow = FakeUow()
    with pytest.raises(NotFound):
        ClientesService(RepoClientes(OCUPADA, filas=0), uow).actualizar_cuenta(GARZON, 10, 9, "M1", 0, "", "X")
    assert uow.rollbacks == 1


def test_no_se_asigna_un_cliente_que_no_existe_en_la_agenda():
    repo, uow = RepoClientes(OCUPADA), FakeUow()
    with pytest.raises(NotFound) as e:
        ClientesService(repo, uow).actualizar_cuenta(GARZON, 10, 1, "M1", cage=404, nruc="1", nomb="X")
    assert e.value.code == "CLIENTE_NO_EXISTE" and repo.llamadas == [] and uow.rollbacks == 1
