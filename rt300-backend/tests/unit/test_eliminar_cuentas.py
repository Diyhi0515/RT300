"""Eliminar cuentas de un folio (una o varias): todo o nada, con las mismas reglas que quitar cuentas al modificar la mesa."""
import pytest

from app.core.errors import Conflict, Forbidden, NotFound, ValidationFailed
from app.domain.mesa import Mesa
from app.modules.clientes.service import ClientesService
from tests.unit.fakes import GARZON, FakeUow

OCUPADA = Mesa("M1", 3, 10, False, False)


class RepoCuentas:
    local = 2

    def __init__(self, mesa=OCUPADA, cuentas=None, con_comandas=(), borradas=None):
        self._mesa = mesa
        self.cuentas = cuentas if cuentas is not None else [{"ncta": n, "estc": 1, "nvta": 0} for n in (1, 2, 3, 4)]
        self.comandas = set(con_comandas)
        self.borradas: list[int] = []

    def local_de_folio(self, n): return self.local
    def mesa(self, c): return self._mesa
    def estado_de_cuentas(self, n): return self.cuentas
    def cuentas_con_comandas(self, n): return self.comandas
    def borrar_cuentas(self, nfol, cuentas): self.borradas += cuentas


def eliminar(repo, cuentas, uow=None):
    uow = uow or FakeUow()
    return ClientesService(repo, uow).eliminar_cuentas(GARZON, 10, "M1", cuentas), uow


def test_elimina_una_cuenta_vacia_que_no_es_la_ultima():
    repo = RepoCuentas()
    r, uow = eliminar(repo, [2])
    assert r == {"eliminadas": [2], "quedan": 3} and repo.borradas == [2] and uow.commits == 1


def test_elimina_varias_a_la_vez_y_las_devuelve_ordenadas():
    repo = RepoCuentas()
    r, _ = eliminar(repo, [3, 1])
    assert r == {"eliminadas": [1, 3], "quedan": 2} and repo.borradas == [1, 3]


def test_si_una_no_se_puede_no_se_elimina_ninguna_y_dice_cual():
    repo = RepoCuentas(con_comandas={3})
    uow = FakeUow()
    with pytest.raises(Conflict) as e:
        eliminar(repo, [1, 3], uow)
    assert e.value.code == "CUENTA_CON_COMANDAS" and e.value.detalle == {"ncta": 3}
    assert repo.borradas == [] and uow.commits == 0 and uow.rollbacks == 1


def test_no_elimina_una_cuenta_con_comandas_aunque_esten_anuladas():
    with pytest.raises(Conflict) as e:
        eliminar(RepoCuentas(con_comandas={2}), [2])
    assert e.value.code == "CUENTA_CON_COMANDAS"


def test_no_elimina_una_cuenta_con_notas_de_venta():
    cuentas = [{"ncta": 1, "estc": 1, "nvta": 0}, {"ncta": 2, "estc": 1, "nvta": 5}, {"ncta": 3, "estc": 1, "nvta": 0}]
    with pytest.raises(Conflict) as e:
        eliminar(RepoCuentas(cuentas=cuentas), [2])
    assert e.value.code == "CUENTA_CON_NOTA" and e.value.detalle == {"ncta": 2}


def test_no_elimina_una_cuenta_liquidada():
    cuentas = [{"ncta": 1, "estc": 9, "nvta": 0}, {"ncta": 2, "estc": 1, "nvta": 0}]
    with pytest.raises(Conflict) as e:
        eliminar(RepoCuentas(cuentas=cuentas), [1])
    assert e.value.code == "CUENTA_LIQUIDADA"


def test_siempre_debe_quedar_una_cuenta():
    repo = RepoCuentas()
    with pytest.raises(Conflict) as e:
        eliminar(repo, [1, 2, 3, 4])
    assert e.value.code == "DEBE_QUEDAR_UNA_CUENTA" and repo.borradas == []
    with pytest.raises(Conflict):
        eliminar(RepoCuentas(cuentas=[{"ncta": 1, "estc": 1, "nvta": 0}]), [1])


def test_una_cuenta_inexistente_se_rechaza_con_su_numero():
    with pytest.raises(NotFound) as e:
        eliminar(RepoCuentas(), [2, 9])
    assert e.value.code == "CUENTA_NO_EXISTE" and e.value.detalle == {"ncta": 9}


@pytest.mark.parametrize("cuentas", [[2, 2], [0], [-1, 2]])
def test_la_lista_no_puede_tener_repetidos_ni_numeros_invalidos(cuentas):
    with pytest.raises(ValidationFailed) as e:
        eliminar(RepoCuentas(), cuentas)
    assert e.value.code == "CUENTAS_INVALIDAS"


@pytest.mark.parametrize(
    ("mesa", "codigo"),
    [
        (Mesa("M1", 1, 0, False, False), "MESA_NO_OCUPADA"),
        (Mesa("M1", 3, 99, False, False), "MESA_NO_OCUPADA"),
        (Mesa("M1", 3, 10, True, False), "MESA_ELIMINADA"),
        (Mesa("M1", 3, 10, False, True), "MESA_DESHABILITADA"),
    ],
)
def test_la_mesa_debe_estar_ocupada_habilitada_y_ser_la_del_folio(mesa, codigo):
    with pytest.raises(Conflict) as e:
        eliminar(RepoCuentas(mesa=mesa), [2])
    assert e.value.code == codigo


def test_una_mesa_inexistente_se_rechaza():
    with pytest.raises(NotFound) as e:
        eliminar(RepoCuentas(mesa=None), [2])
    assert e.value.code == "MESA_NO_EXISTE"


def test_no_se_puede_eliminar_cuentas_de_un_folio_de_otro_local():
    repo = RepoCuentas()
    repo.local = 99
    with pytest.raises(Forbidden):
        eliminar(repo, [2])
    assert repo.borradas == []
