"""La comanda se arma en el servidor: el cliente solo envía plato y cantidad."""
import pytest
from pydantic import ValidationError

from app.core.errors import DomainError, Forbidden, NotFound
from app.modules.comandas.armar import ArmarComandaService
from app.modules.comandas.ports import (
    ComponenteFicha,
    ContextoPrecios,
    FichaComanda,
    InsumoFicha,
    ParametrosComanda,
)
from app.modules.comandas.schemas import EnviarComandaIn
from tests.unit.fakes import GARZON

PARAMETROS = ParametrosComanda(cpxc="S", decimales=3, tcam=11.21)


class RepoArmar:
    local = 2

    def __init__(self, abierta=True):
        self._abierta = abierta

    def local_de_folio(self, n): return self.local
    def cuenta_abierta(self, f, c): return self._abierta
    def contexto_precios(self, f, c, cloc): return ContextoPrecios(0, 0, 0)
    def parametros_comanda(self): return PARAMETROS


class CatalogoFalso:
    def __init__(self, fichas):
        self.fichas, self.pedidas = fichas, []

    def ficha(self, u, cart, ctx, cpxc):
        self.pedidas.append((cart, ctx, cpxc))
        return self.fichas[cart]

    def alternativos(self, cins): return []
    def extras_del_plato(self, csme, cssm): return {}
    def textos_del_plato(self, cart): return {}
    def textos_de_comanda(self): return {}
    def centros_de_produccion(self, u, cart): return set()


class GuardarFalso:
    def __init__(self):
        self.recibido = None

    def guardar(self, u, b):
        self.recibido = b
        return {"ntmp": 9001, "comanda": 77}


AGUA = FichaComanda(cart="A1", descripcion="AGUA 600 ML", pvta=8.0, ccpd=22, cbas=1.0)
# receta para 10 porciones: 5 de queso (merma 10 %), el queso es compuesto: leche 2 por cada 4 de base (merma 5 %)
PLATO = FichaComanda(
    cart="P1", descripcion="PIZZA", pvta=30.5, ccpd=7, cbas=10.0,
    insumos=[InsumoFicha("Q1", "QUESO", 5.0, 10.0, "S", 1)],
    componentes=[ComponenteFicha(padre="Q1", cins="L1", descripcion="LECHE", cantidad=2.0, merma_pct=5.0, cbas=4.0, mdcg="N", oimp=0)],
)


def armar(fichas, repo=None):
    guardar = GuardarFalso()
    s = ArmarComandaService(repo or RepoArmar(), CatalogoFalso(fichas), guardar)
    return s, guardar


def pedido(*items):
    return EnviarComandaIn.model_validate({"glos": "mesa 5", "items": [{"cart": c, "cant": n} for c, n in items]})


def test_el_precio_sale_del_catalogo_no_del_cliente():
    s, g = armar({"A1": AGUA})
    r = s.enviar(GARZON, 10, 1, pedido(("A1", 3)))
    assert r == {"ntmp": 9001, "comanda": 77}
    linea = g.recibido.rtcda[0]
    assert (linea.cart, linea.desc, linea.cant, linea.pvta, linea.impt, linea.ccpd) == ("A1", "AGUA 600 ML", 3, 8.0, 24.0, 22)
    assert (linea.item, linea.iteo, linea.tipo, linea.cmon, linea.tcam) == (1, 0, "P", 1, 11.21)
    assert g.recibido.glos == "mesa 5" and g.recibido.rtcia == [] and g.recibido.rtcic == []


def test_el_cliente_no_puede_enviar_un_precio():
    esquema = EnviarComandaIn.model_validate({"items": [{"cart": "A1", "cant": 1, "pvta": 0.01, "impt": 0.01}]})
    assert not hasattr(esquema.items[0], "pvta")        # el campo ni siquiera existe en el esquema


def test_items_numerados_y_lineas_repetidas_se_conservan():
    s, g = armar({"A1": AGUA, "P1": PLATO})
    s.enviar(GARZON, 10, 1, pedido(("A1", 1), ("P1", 2), ("A1", 2)))
    assert [(d.item, d.cart, d.cant) for d in g.recibido.rtcda] == [(1, "A1", 1), (2, "P1", 2), (3, "A1", 2)]
    assert len(s._catalogo.pedidas) == 2                  # la ficha de A1 se consulta una sola vez


def test_insumos_con_merma_total_es_producto_mas_merma():
    s, g = armar({"P1": PLATO})
    s.enviar(GARZON, 10, 1, pedido(("P1", 2)))
    ins = g.recibido.rtcia[0]
    # (5 / 10) * 2 = 1.0 de producto; merma 10 % = 0.1; total 1.1
    assert (ins.rtciacanp, ins.rtciacanm, ins.rtciacant) == (1.0, 0.1, 1.1)
    assert (ins.rtciaitem, ins.rtciacart, ins.rtciacins, ins.rtciaccpd, ins.quitado) == (1, "P1", "Q1", 7, "N")


def test_componentes_se_calculan_sobre_el_total_del_insumo():
    s, g = armar({"P1": PLATO})
    s.enviar(GARZON, 10, 1, pedido(("P1", 2)))
    comp = g.recibido.rtcic[0]
    # (2 / 4) * 1.1 = 0.55 de producto; merma 5 % = 0.0275 -> 0.028 con 3 decimales; total 0.578
    assert (comp.rtciccins, comp.rtciccinc, comp.rtciccanp, comp.rtciccanm, comp.rtciccant) == ("Q1", "L1", 0.55, 0.028, 0.578)


def test_respeta_los_decimales_de_inventario():
    s, g = armar({"P1": PLATO})
    s._repo.parametros_comanda = lambda: ParametrosComanda("S", 1, 11.21)
    s.enviar(GARZON, 10, 1, pedido(("P1", 1)))
    assert g.recibido.rtcia[0].rtciacanp == 0.5 and g.recibido.rtcia[0].rtciacanm == 0.1   # 0.05 -> 0.1 con 1 decimal


def test_cuenta_cerrada_no_guarda_nada():
    s, g = armar({"A1": AGUA}, RepoArmar(abierta=False))
    with pytest.raises(NotFound):
        s.enviar(GARZON, 10, 1, pedido(("A1", 1)))
    assert g.recibido is None


def test_folio_de_otro_local():
    repo = RepoArmar()
    repo.local = 9
    s, g = armar({"A1": AGUA}, repo)
    with pytest.raises(Forbidden):
        s.enviar(GARZON, 10, 1, pedido(("A1", 1)))
    assert g.recibido is None


def test_plato_con_insumos_pero_sin_base_falla_claro():
    s, _ = armar({"P1": FichaComanda("P1", "X", 1.0, 0, 0.0, insumos=[InsumoFicha("Q1", "Q", 1.0, 0.0)])})
    with pytest.raises(DomainError) as e:
        s.enviar(GARZON, 10, 1, pedido(("P1", 1)))
    assert e.value.code == "PLATO_SIN_BASE"


@pytest.mark.parametrize("items", [[], [{"cart": "A1", "cant": 0}], [{"cart": "A1", "cant": 100}], [{"cart": "", "cant": 1}]])
def test_validaciones_de_entrada(items):
    with pytest.raises(ValidationError):
        EnviarComandaIn.model_validate({"items": items})
