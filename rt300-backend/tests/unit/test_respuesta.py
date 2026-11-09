"""Las respuestas tipadas fijan el contrato: solo salen los campos declarados y tal como los entrega el servicio."""
import json

import pytest
from flask import Flask
from pydantic import ValidationError

from app.core.respuesta import responder
from app.modules.clientes.schemas import ClientesDetalleOut
from app.modules.menu.schemas import FichaPlatoOut
from app.modules.salon.schemas import ParametrosOut


@pytest.fixture(autouse=True)
def contexto():
    with Flask(__name__).app_context():
        yield


def cuerpo(resp):
    return json.loads(resp[0].get_data(as_text=True))


def test_no_filtra_columnas_que_no_estan_en_el_contrato():
    fila_completa = {"codigo": 17, "nombre": "ANA", "nruc": "1", "ndid": "1", "lpre": 0,
                     "gbagefnac": "1944-09-10", "gbagecorg": "SC"}          # columnas personales de gbage
    salida = cuerpo(responder(ClientesDetalleOut, {"clientes": [fila_completa]}))
    assert salida["clientes"][0] == {"codigo": 17, "nombre": "ANA", "nruc": "1", "ndid": "1", "lpre": 0}


def test_conserva_solo_las_claves_entregadas_sin_inventar_nulls():
    ficha = {"ccpd": 0, "pvta": 8, "csme": 1, "cssm": 1, "mcom": "N", "cbas": 1.0, "rtins": None}
    salida = cuerpo(responder(FichaPlatoOut, ficha))
    assert "rtcom" not in salida and salida["rtins"] is None


def test_un_dato_con_tipo_invalido_falla_en_lugar_de_salir_mal():
    with pytest.raises(ValidationError):
        responder(FichaPlatoOut, {"ccpd": 0, "pvta": "no-numero", "csme": 1, "cssm": 1, "mcom": "N", "cbas": 1})


def test_los_bloques_legacy_declarados_como_dict_pasan_completos():
    datos = {"caco": 1, "areas": [], "mesas": [], "meseros": [], "local": {"vtlocdesc": "X", "otra": 1},
             "moneda": {"gbconabre": "Bs."}, "config": {"gbpmt": {"a": 1}, "gbrne": None, "inctl": {}, "rtctl": {}}}
    salida = cuerpo(responder(ParametrosOut, datos))
    assert salida["local"] == {"vtlocdesc": "X", "otra": 1} and salida["config"]["gbpmt"] == {"a": 1}


def test_codigo_de_estado_personalizado():
    assert responder(ClientesDetalleOut, {"clientes": []}, 201)[1] == 201
