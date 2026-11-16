"""Extras, textos, centro de producción alterno y cambios de insumos: el cliente elige, el servidor valida y genera las filas."""
import pytest
from pydantic import ValidationError

from app.core.errors import ValidationFailed
from app.modules.comandas.ajustes import aplicar_ajustes
from app.modules.comandas.armar import ArmarComandaService
from app.modules.comandas.ports import (
    AlternativoFicha,
    ComponenteFicha,
    ContextoPrecios,
    ExtraFicha,
    FichaComanda,
    InsumoFicha,
    ParametrosComanda,
)
from app.modules.comandas.schemas import AjusteInsumo, EnviarComandaIn
from tests.unit.fakes import GARZON

PARAMETROS = ParametrosComanda(cpxc="S", decimales=3, tcam=11.21)

# plato compuesto: PURE (compuesto, con papa y sal) y ARROZ (simple); el puré tiene un alternativo con sus propios componentes
PLATO = FichaComanda(
    cart="P1", descripcion="MILANESA", pvta=30.0, ccpd=7, cbas=1.0, csme=1, cssm=2,
    insumos=[InsumoFicha("PURE", "PURE DE PAPA", 1.0, 0.0, "S", 0), InsumoFicha("ARROZ", "ARROZ", 1.0, 0.0, "S", 0)],
    componentes=[ComponenteFicha("PURE", "PAPA", "PAPA ARINOSA", 300.0, 0.0, 1.0, "S", 0)],
)
CUNA = AlternativoFicha(
    cins="PURE", cina="CUNA", descripcion="PAPA CUNA",
    componentes=[ComponenteFicha("CUNA", "PAPAH", "PAPA HOLANDEZA", 150.0, 0.0, 1.0, "S", 0)],
)
SALSA = ExtraFicha(cart="X1", descripcion="SALSA EXTRA", impt=5.0, cmon=1)
EXTRA_FICHA = FichaComanda(cart="X1", descripcion="SALSA EXTRA", pvta=5.0, ccpd=9, cbas=1.0)


class Repo:
    local = 2

    def local_de_folio(self, n): return self.local
    def cuenta_abierta(self, f, c): return True
    def contexto_precios(self, f, c, cloc): return ContextoPrecios(0, 0, 0)
    def parametros_comanda(self): return PARAMETROS


class Catalogo:
    def __init__(self):
        self.consultas_de_extras = 0

    def ficha(self, u, cart, ctx, cpxc): return PLATO
    def extras_del_plato(self, csme, cssm):
        self.consultas_de_extras += 1
        return {"X1": SALSA} if (csme, cssm) == (1, 2) else {}
    def ficha_extra(self, u, extra, cpxc): return EXTRA_FICHA
    def alternativos(self, cins): return [CUNA] if cins == "PURE" else []
    def textos_del_plato(self, cart): return {(1, 4): "PARA LLEVAR", (1, 6): "TERMINO 3/4"}
    def textos_de_comanda(self): return {(2, 1): "URGENTE"}
    def centros_de_produccion(self, u, cart): return {7, 8}


class Guardar:
    def guardar(self, u, b):
        self.recibido = b
        return {"ntmp": 1, "comanda": 1}


def enviar(item=None, **comanda):
    guardar = Guardar()
    datos = {"items": [{"cart": "P1", "cant": 2, **(item or {})}], **comanda}
    ArmarComandaService(Repo(), Catalogo(), guardar).enviar(GARZON, 10, 1, EnviarComandaIn.model_validate(datos))
    return guardar.recibido


# ───────────── textos ─────────────
def test_los_textos_del_plato_se_guardan_con_el_texto_de_la_base():
    r = enviar({"textos": [{"pref": 1, "corr": 6}]})
    assert [(t.rttacitem, t.rttaccart, t.rttacpref, t.rttaccorr, t.rttactext) for t in r.rttac] == [(1, "P1", 1, 6, "TERMINO 3/4")]


def test_un_texto_que_no_es_del_plato_se_rechaza():
    with pytest.raises(ValidationFailed) as e:
        enviar({"textos": [{"pref": 9, "corr": 9}]})
    assert e.value.code == "TEXTO_INVALIDO"


def test_los_textos_de_la_comanda_se_validan_y_se_guardan():
    assert [(t.rttcopref, t.rttcocorr) for t in enviar(textos=[{"pref": 2, "corr": 1}]).rttco] == [(2, 1)]
    with pytest.raises(ValidationFailed):
        enviar(textos=[{"pref": 1, "corr": 4}])      # es un texto de plato, no de comanda


# ───────────── centro de producción ─────────────
def test_sin_indicar_centro_se_usa_el_del_local():
    assert enviar().rtcda[0].ccpd == 7


def test_un_centro_alterno_permitido_se_usa_en_la_linea():
    r = enviar({"ccpd": 8})
    assert r.rtcda[0].ccpd == 8 and {i.rtciaccpd for i in r.rtcia} == {7}      # los insumos conservan el del local


def test_un_centro_no_permitido_se_rechaza():
    with pytest.raises(ValidationFailed) as e:
        enviar({"ccpd": 99})
    assert e.value.code == "CENTRO_INVALIDO"


# ───────────── extras ─────────────
def test_los_extras_son_lineas_hijas_con_el_precio_de_la_base():
    r = enviar({"extras": [{"cart": "X1", "cant": 3}]})
    padre, extra = r.rtcda
    assert (padre.item, padre.iteo, padre.tipo) == (1, 0, "P")
    assert (extra.item, extra.iteo, extra.tipo, extra.cart, extra.cant, extra.pvta, extra.impt, extra.ccpd) == (
        2, 1, "E", "X1", 3, 5.0, 15.0, 9)


def test_la_numeracion_sigue_con_los_extras_en_medio():
    guardar = Guardar()
    datos = {"items": [{"cart": "P1", "cant": 1, "extras": [{"cart": "X1"}]}, {"cart": "P1", "cant": 1}]}
    ArmarComandaService(Repo(), Catalogo(), guardar).enviar(GARZON, 10, 1, EnviarComandaIn.model_validate(datos))
    assert [(d.item, d.iteo, d.tipo) for d in guardar.recibido.rtcda] == [(1, 0, "P"), (2, 1, "E"), (3, 0, "P")]


def test_un_extra_que_no_es_del_plato_se_rechaza():
    with pytest.raises(ValidationFailed) as e:
        enviar({"extras": [{"cart": "OTRO"}]})
    assert e.value.code == "EXTRA_INVALIDO"


def test_el_cliente_no_puede_poner_precio_a_un_extra():
    esquema = EnviarComandaIn.model_validate({"items": [{"cart": "P1", "cant": 1, "extras": [{"cart": "X1", "pvta": 0.01}]}]})
    assert not hasattr(esquema.items[0].extras[0], "pvta")


# ───────────── insumos ─────────────
def _generados():
    from app.modules.comandas.insumos import insumos_del_plato

    return insumos_del_plato(1, 2, PLATO, PARAMETROS, 7)


def test_quitar_un_insumo_conserva_la_fila_marcada():
    r = enviar({"insumos": [{"cins": "ARROZ", "quitar": True}]})
    arroz = next(i for i in r.rtcia if i.cinsorigen == "ARROZ")
    assert arroz.quitado == "S" and arroz.rtciacant == 2.0
    assert next(i for i in r.rtcia if i.cinsorigen == "PURE").quitado == "N"


def test_reemplazar_por_un_alternativo_conserva_cantidades_y_origen():
    r = enviar({"insumos": [{"cins": "PURE", "alternativo": "CUNA"}]})
    pure = next(i for i in r.rtcia if i.cinsorigen == "PURE")
    assert (pure.rtciacins, pure.rtciadesc, pure.descorigen, pure.rtciacant, pure.quitado) == (
        "CUNA", "PAPA CUNA", "PURE DE PAPA", 2.0, "N")


def test_al_reemplazar_los_componentes_de_ambos_quedan_en_cero():
    r = enviar({"insumos": [{"cins": "PURE", "alternativo": "CUNA"}]})
    assert {(c.rtciccins, c.rtciccinc, c.rtciccant, c.rtciccanp, c.rtciccanm) for c in r.rtcic} == {
        ("PURE", "PAPA", 0.0, 0.0, 0.0), ("CUNA", "PAPAH", 0.0, 0.0, 0.0)}


def test_sin_cambios_los_componentes_conservan_su_cantidad():
    assert [c.rtciccant for c in enviar().rtcic] == [600.0]


def test_un_alternativo_que_no_corresponde_se_rechaza():
    with pytest.raises(ValidationFailed) as e:
        enviar({"insumos": [{"cins": "PURE", "alternativo": "OTRO"}]})
    assert e.value.code == "ALTERNATIVO_INVALIDO"


def test_un_insumo_que_no_es_del_plato_se_rechaza():
    with pytest.raises(ValidationFailed) as e:
        enviar({"insumos": [{"cins": "NADA", "quitar": True}]})
    assert e.value.code == "INSUMO_NO_ES_DEL_PLATO"


def test_el_mismo_insumo_no_se_puede_ajustar_dos_veces():
    with pytest.raises(ValidationFailed) as e:
        enviar({"insumos": [{"cins": "ARROZ", "quitar": True}, {"cins": "ARROZ", "quitar": True}]})
    assert e.value.code == "INSUMO_REPETIDO"


@pytest.mark.parametrize("ajuste", [{"cins": "ARROZ"}, {"cins": "ARROZ", "quitar": True, "alternativo": "X"}])
def test_un_ajuste_debe_quitar_o_reemplazar_pero_no_ambos_ni_ninguno(ajuste):
    with pytest.raises(ValidationError):
        AjusteInsumo.model_validate(ajuste)


def test_aplicar_ajustes_es_pura_y_no_modifica_las_listas_recibidas():
    insumos, componentes = _generados()
    aplicar_ajustes(1, insumos, componentes, [AjusteInsumo(cins="ARROZ", quitar=True)], lambda c: [])
    assert all(i.quitado == "N" for i in insumos)
