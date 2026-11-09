import pytest

from app.core.errors import GatewayError
from app.integrations.comandas.base import AltaComandaReq, EstadoCuentaReq
from app.integrations.comandas.soap_gateway import SoapGateway


class ServicioFalso:
    """Imita client.service de zeep: registra la operación y los parámetros recibidos."""

    def __init__(self, respuesta):
        self.respuesta, self.llamadas = respuesta, []

    def __getattr__(self, op):
        def llamar(**kw):
            self.llamadas.append((op, kw))
            if isinstance(self.respuesta, Exception):
                raise self.respuesta
            return self.respuesta
        return llamar


class ClienteFalso:
    def __init__(self, respuesta):
        self.service = ServicioFalso(respuesta)


ALTA = AltaComandaReq(ntra=9, nfol=1, ncta=1, cmon=1, glos="g", cloc=2, usrn="GP1")


def test_alta_envia_los_parametros_del_contrato_y_la_credencial_tecnica():
    c = ClienteFalso(1234)
    r = SoapGateway("http://x?WSDL", 5, "tecnica", client=c).alta_comanda(ALTA)
    op, kw = c.service.llamadas[0]
    assert op == "alta_comanda_rt300"
    assert kw == {"ntra": 9, "nfol": 1, "ncta": 1, "cmon": 1, "glos": "g", "cloc": 2, "usrn": "GP1", "pass": "tecnica"}
    assert r.ok and r.codigo == 1234


def test_respuesta_no_positiva_o_texto_es_rechazo():
    assert not SoapGateway("u", 5, client=ClienteFalso(0)).alta_comanda(ALTA).ok
    r = SoapGateway("u", 5, client=ClienteFalso("Error de impresora")).alta_comanda(ALTA)
    assert not r.ok and "impresora" in r.mensaje


def test_estado_de_cuenta_exito_es_100():
    req = EstadoCuentaReq(1, 1, 1, "M1", "1", "1", "2", "2", "GP1")
    assert SoapGateway("u", 5, client=ClienteFalso(100)).estado_cuenta(req).ok
    assert not SoapGateway("u", 5, client=ClienteFalso(99)).estado_cuenta(req).ok


def test_servicio_caido_se_traduce_a_gateway_error():
    with pytest.raises(GatewayError):
        SoapGateway("u", 5, client=ClienteFalso(ConnectionError("404"))).alta_comanda(ALTA)


def test_sin_wsdl_configurado_falla_claro():
    with pytest.raises(GatewayError):
        SoapGateway("", 5)


@pytest.mark.parametrize("entrada,esperada", [
    ("http://192.168.0.2/RT300WS/RT300.asmx", "http://192.168.0.2/RT300WS/RT300.asmx?WSDL"),   # valor de SYS_WEBSERVICE_DIR
    ("http://192.168.0.2/RT300WS/RT300.asmx?WSDL", "http://192.168.0.2/RT300WS/RT300.asmx?WSDL"),
    ("http://h/s.asmx?wsdl", "http://h/s.asmx?wsdl"),
])
def test_acepta_la_misma_url_que_el_sistema_antiguo(entrada, esperada):
    assert SoapGateway.normalizar_url(entrada) == esperada
