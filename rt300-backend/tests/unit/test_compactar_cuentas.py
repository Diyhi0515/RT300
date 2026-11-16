"""Renumeración de las cuentas de un folio: consecutivas desde 1, sin tocar las que tienen comandas, notas o están liquidadas."""
import pytest

from app.domain.cuentas import CuentaFolio, plan_compactacion
from app.domain.mesa import Mesa
from app.modules.clientes.service import ClientesService
from tests.unit.fakes import GARZON, FakeUow

OCUPADA = Mesa("M1", 3, 10, False, False)


def cuentas(*numeros, fijas=()):
    return [CuentaFolio(n, n not in fijas) for n in numeros]


# ───────────── el planificador (función pura) ─────────────
def test_sin_huecos_no_cambia_nada():
    assert plan_compactacion(cuentas(1, 2, 3)) == []


def test_cierra_los_huecos_en_orden():
    assert plan_compactacion(cuentas(1, 3, 7)) == [(3, 2), (7, 3)]


def test_una_cuenta_fija_conserva_su_numero_y_las_vacias_llenan_los_libres():
    assert plan_compactacion(cuentas(1, 3, 4, 7, fijas={3})) == [(4, 2), (7, 4)]


def test_si_las_fijas_dejan_huecos_se_quedan():
    assert plan_compactacion(cuentas(2, 5, fijas={2, 5})) == []


def test_nunca_sube_un_numero_ni_choca_con_uno_ocupado():
    plan = plan_compactacion(cuentas(1, 4, 5, 9, 10, fijas={5}))
    ocupados = {1, 4, 5, 9, 10}
    for antes, despues in plan:
        assert despues < antes
        ocupados.discard(antes)
        assert despues not in ocupados
        ocupados.add(despues)
    assert sorted(ocupados) == [1, 2, 3, 4, 5]


def test_el_orden_de_los_pares_se_puede_aplicar_uno_por_uno():
    numeros = {1, 2, 5, 6, 8}
    for antes, despues in plan_compactacion(cuentas(*sorted(numeros))):
        assert despues not in numeros
        numeros.remove(antes)
        numeros.add(despues)
    assert numeros == {1, 2, 3, 4, 5}


# ───────────── el servicio ─────────────
class RepoRenumerable:
    local = 2

    def __init__(self, numeros, con_comandas=(), con_nota=(), liquidadas=()):
        self.filas = {n: {"ncta": n, "estc": 9 if n in liquidadas else 1, "nvta": 1 if n in con_nota else 0} for n in numeros}
        self.comandas = set(con_comandas)
        self.llamadas = []

    def local_de_folio(self, n): return self.local
    def mesa(self, c): return OCUPADA
    def estado_de_cuentas(self, n): return list(self.filas.values())
    def cuentas_con_comandas(self, n): return self.comandas
    def borrar_cuentas(self, nfol, cuentas):
        for c in cuentas:
            self.filas.pop(c)
        self.llamadas.append(("borrar", list(cuentas)))
    def renumerar_cuenta(self, nfol, antes, despues):
        fila = self.filas.pop(antes)
        assert despues not in self.filas, "el número nuevo ya estaba ocupado"
        self.filas[despues] = {**fila, "ncta": despues}
        self.llamadas.append(("renumerar", antes, despues))
    def lista_de_cuentas(self, n):
        return [{"ncta": k, "nombre": f"Cuenta {k}", "estc": v["estc"]} for k, v in sorted(self.filas.items())]


def servicio(repo, uow=None):
    return ClientesService(repo, uow or FakeUow())


def test_al_eliminar_una_del_medio_las_siguientes_se_renumeran():
    repo = RepoRenumerable([1, 2, 3, 4, 5])
    r = servicio(repo).eliminar_cuentas(GARZON, 10, "M1", [2])
    assert r["eliminadas"] == [2] and r["quedan"] == 4 and r["consecutivas"] is True
    assert r["renumeradas"] == [{"antes": 3, "despues": 2}, {"antes": 4, "despues": 3}, {"antes": 5, "despues": 4}]
    assert [c["ncta"] for c in r["cuentas"]] == [1, 2, 3, 4]
    assert [c["nombre"] for c in r["cuentas"]] == ["Cuenta 1", "Cuenta 2", "Cuenta 3", "Cuenta 4"]


def test_eliminar_varias_y_renumerar_todo_en_una_transaccion():
    repo, uow = RepoRenumerable([1, 2, 3, 4, 5, 6]), FakeUow()
    r = servicio(repo, uow).eliminar_cuentas(GARZON, 10, "M1", [3, 5])
    assert [c["ncta"] for c in r["cuentas"]] == [1, 2, 3, 4] and uow.commits == 1


def test_una_cuenta_con_comandas_conserva_su_numero_y_las_vacias_llenan_los_huecos():
    repo = RepoRenumerable([1, 2, 3, 4, 5], con_comandas={4})
    r = servicio(repo).eliminar_cuentas(GARZON, 10, "M1", [2])
    assert [c["ncta"] for c in r["cuentas"]] == [1, 2, 3, 4] and r["consecutivas"] is True
    assert r["renumeradas"] == [{"antes": 3, "despues": 2}, {"antes": 5, "despues": 3}]    # la 4 (con comandas) no se movió


def test_una_cuenta_con_nota_o_liquidada_no_se_mueve_y_puede_quedar_un_hueco():
    repo = RepoRenumerable([1, 2, 3, 4], con_nota={3}, liquidadas={4})
    r = servicio(repo).eliminar_cuentas(GARZON, 10, "M1", [1])
    assert [c["ncta"] for c in r["cuentas"]] == [1, 3, 4] and r["consecutivas"] is False
    assert r["renumeradas"] == [{"antes": 2, "despues": 1}]
    assert next(c for c in r["cuentas"] if c["ncta"] == 4)["liquidada"] is True


def test_compactar_cierra_los_huecos_que_ya_existian():
    repo = RepoRenumerable([1, 3, 7, 9])
    r = servicio(repo).compactar_cuentas(GARZON, 10, "M1")
    assert r["eliminadas"] == [] and r["consecutivas"] is True and [c["ncta"] for c in r["cuentas"]] == [1, 2, 3, 4]
    assert r["renumeradas"] == [{"antes": 3, "despues": 2}, {"antes": 7, "despues": 3}, {"antes": 9, "despues": 4}]


def test_compactar_un_folio_sin_huecos_no_hace_nada():
    repo = RepoRenumerable([1, 2, 3])
    r = servicio(repo).compactar_cuentas(GARZON, 10, "M1")
    assert r["renumeradas"] == [] and r["consecutivas"] is True and not [x for x in repo.llamadas if x[0] == "renumerar"]


@pytest.mark.parametrize("numeros", [[1, 2], [1, 5], [3, 4, 8]])
def test_despues_de_eliminar_la_primera_todo_queda_consecutivo(numeros):
    repo = RepoRenumerable([*numeros, max(numeros) + 1])
    r = servicio(repo).eliminar_cuentas(GARZON, 10, "M1", [numeros[0]])
    assert r["consecutivas"] is True
