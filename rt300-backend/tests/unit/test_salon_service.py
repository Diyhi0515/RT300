from datetime import datetime

import pytest

from app.core.errors import Conflict, NotFound
from app.domain.mesa import ESTC_LIQUIDADA, Mesa
from app.modules.salon.ports import Cliente, Parametros
from app.modules.salon.service import SalonService
from tests.unit.fakes import GARZON, FakeUow

VARIOS = Cliente(1, "CLIENTE VARIOS", "0", "0")


class RepoSalon:
    def __init__(self, mesa=None, toma=True, comandas=0, estados=()):
        self._mesa = mesa if mesa is not None else Mesa("M1", 1, 0, False, False)
        self.toma, self.n_comandas, self.estados = toma, comandas, list(estados)
        self.cuentas_insertadas, self.llamadas = [], []

    def parametros(self):
        return Parametros({}, {}, {}, {}, datetime(2026, 7, 24, 8, 30), 1, True)

    def mesa(self, c): return self._mesa
    def cliente(self, c): return VARIOS
    def tomar_mesa(self, c): return self.toma
    def siguiente_folio(self): return 500
    def insertar_folio(self, **p): self.llamadas.append(("folio", p["nfol"]))
    def insertar_cuentas(self, cs): self.cuentas_insertadas += cs
    def asignar_folio_a_mesa(self, c, n): self.llamadas.append(("asignar", n))
    def contar_comandas(self, nfol, solo_vigentes=True): return self.n_comandas
    def liberar_mesa(self, c): self.llamadas.append(("liberar", c))
    def estados_de_cuentas(self, n): return self.estados
    def cerrar_folio_liquidado(self, *a): self.llamadas.append(("cerrar",))
    def anular_folio(self, *a): self.llamadas.append(("anular",))
    def contar_cuentas(self, n): return 3
    def maxima_cuenta_con_nota(self, n): return 0


def test_ocupar_mesa_crea_folio_y_cuentas_en_una_unidad_de_trabajo():
    uow, repo = FakeUow(), RepoSalon()
    r = SalonService(repo, uow).ocupar_mesa(GARZON, "M1", cven=12009, caco=1, ccom=2, ncta=3)
    assert r == {"folio": 500, "cuentas": 3}
    assert [c.ncta for c in repo.cuentas_insertadas] == [1, 2, 3]
    assert (uow.commits, uow.rollbacks) == (1, 0)


def test_ocupar_mesa_ya_tomada_por_otro_hace_rollback():
    uow = FakeUow()
    with pytest.raises(Conflict) as e:
        SalonService(RepoSalon(toma=False), uow).ocupar_mesa(GARZON, "M1", 1, 1, 1, 1)
    assert e.value.code == "MESA_OCUPADA" and (uow.commits, uow.rollbacks) == (0, 1)


@pytest.mark.parametrize("mesa,codigo", [(Mesa("M1", 1, 0, True, False), "MESA_ELIMINADA"),
                                         (Mesa("M1", 1, 0, False, True), "MESA_DESHABILITADA")])
def test_ocupar_mesa_no_operable(mesa, codigo):
    with pytest.raises(Conflict) as e:
        SalonService(RepoSalon(mesa=mesa), FakeUow()).ocupar_mesa(GARZON, "M1", 1, 1, 1, 1)
    assert e.value.code == codigo


def test_habilitar_mesa_con_comandas_vigentes_se_rechaza():
    mesa = Mesa("M1", 3, 77, False, False)
    with pytest.raises(Conflict) as e:
        SalonService(RepoSalon(mesa=mesa, comandas=2), FakeUow()).habilitar_mesa(GARZON, "M1")
    assert e.value.code == "MESA_CON_COMANDAS"


def test_habilitar_sin_cuentas_liquidadas_anula_el_folio():
    repo = RepoSalon(mesa=Mesa("M1", 3, 77, False, False), estados=[1, 1])
    SalonService(repo, FakeUow()).habilitar_mesa(GARZON, "M1")
    assert ("anular",) in repo.llamadas and ("cerrar",) not in repo.llamadas


def test_habilitar_con_cuenta_liquidada_cierra_el_folio_sin_anularlo():
    repo = RepoSalon(mesa=Mesa("M1", 3, 77, False, False), estados=[1, ESTC_LIQUIDADA])
    SalonService(repo, FakeUow()).habilitar_mesa(GARZON, "M1")
    assert ("cerrar",) in repo.llamadas and ("anular",) not in repo.llamadas


def test_modificar_no_permite_quitar_cuentas_con_comandas():
    repo = RepoSalon(comandas=1)
    with pytest.raises(Conflict) as e:
        SalonService(repo, FakeUow()).modificar_mesa(GARZON, 77, cven=1, ccom=1, ncta_nueva=2)
    assert e.value.code == "CUENTAS_CON_COMANDAS"


def test_mesa_inexistente():
    repo = RepoSalon()
    repo.mesa = lambda c: None
    with pytest.raises(NotFound):
        SalonService(repo, FakeUow()).habilitar_mesa(GARZON, "X")
