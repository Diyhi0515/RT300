"""Emisión, renovación y revocación de tokens (infraestructura de auth)."""
import pytest
from flask import Flask
from flask_jwt_extended import JWTManager, decode_token

from app.core.errors import Unauthorized
from app.domain.usuario import Usuario
from app.extensions import esta_revocado
from app.modules.auth.tokens import EmisorTokens

GARZON = Usuario("GP1", "GARZON 1", 2, 2, 1, 0, "garzon")


@pytest.fixture(autouse=True)
def app_jwt():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = "x" * 40
    JWTManager(app)
    with app.app_context():
        yield


def test_emitir_incluye_claims_y_nombre_del_local_sin_la_clave():
    r = EmisorTokens().emitir(GARZON, "RESTAURANTE HOYO 19")
    assert r["perfil"] == {**GARZON.claims(), "local": "RESTAURANTE HOYO 19"}
    claims = decode_token(r["access_token"])
    assert claims["usuario"] == "GP1" and claims["cloc"] == 2 and not any("clave" in k for k in claims)


def test_renovar_entrega_un_access_token_con_los_mismos_claims():
    t = EmisorTokens()
    refresh = decode_token(t.emitir(GARZON, "L")["refresh_token"])
    nuevo = decode_token(t.renovar(refresh)["access_token"])
    assert nuevo["type"] == "access" and nuevo["usuario"] == "GP1" and nuevo["calm"] == 2


def test_cerrar_sesion_revoca_acceso_y_refresh_de_la_misma_persona():
    t = EmisorTokens()
    r = t.emitir(GARZON, "L")
    acceso = decode_token(r["access_token"])
    t.cerrar_sesion(acceso, r["refresh_token"])
    assert esta_revocado(acceso["jti"]) and esta_revocado(decode_token(r["refresh_token"])["jti"])


def test_cerrar_sesion_no_revoca_el_refresh_de_otra_persona():
    t = EmisorTokens()
    mio, ajeno = t.emitir(GARZON, "L"), t.emitir(Usuario("GP2", "G2", 2, 2, 1, 0, "garzon"), "L")
    t.cerrar_sesion(decode_token(mio["access_token"]), ajeno["refresh_token"])
    assert not esta_revocado(decode_token(ajeno["refresh_token"])["jti"])


def test_un_refresh_invalido_no_impide_cerrar_sesion():
    r = EmisorTokens().emitir(GARZON, "L")
    acceso = decode_token(r["access_token"])
    EmisorTokens().cerrar_sesion(acceso, "basura")
    assert esta_revocado(acceso["jti"])


def test_un_refresh_de_una_sesion_anterior_sin_cven_exige_iniciar_sesion_de_nuevo():
    antiguo = {"usuario": "GP1", "nombre": "G", "cloc": 2, "calm": 2, "cmon": 1, "nreg": 0, "rol": "garzon"}
    with pytest.raises(Unauthorized) as e:
        EmisorTokens().renovar(antiguo)
    assert e.value.code == "SESION_DESACTUALIZADA"
