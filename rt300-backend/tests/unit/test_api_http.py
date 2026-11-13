"""Comportamiento HTTP transversal (cabeceras, CORS, compresión, límites, errores) sin base de datos."""
import gzip
import json

import pytest
from flask import jsonify

from app import create_app
from app.config import Config
from app.core.errors import Unauthorized
from app.extensions import limiter

ORIGEN = "http://localhost:5173"


@pytest.fixture
def app():
    app = create_app(Config(env="development", cors_origins=(ORIGEN,), db_host="no-existe", gateway_mode="fake"))

    @app.get("/api/v1/_grande")
    def grande():
        return jsonify({"datos": "x" * 5000})

    @app.get("/api/v1/_pequena")
    def pequena():
        return jsonify({"ok": True})

    @app.get("/api/v1/auth/_grande")
    def grande_auth():
        return jsonify({"datos": "x" * 5000})

    limiter.reset()
    return app


@pytest.fixture
def cliente(app):
    return app.test_client()


def test_toda_respuesta_lleva_cabeceras_de_seguridad(cliente):
    h = cliente.get("/api/v1/_pequena").headers
    assert h["X-Content-Type-Options"] == "nosniff"
    assert h["X-Frame-Options"] == "DENY"
    assert h["Referrer-Policy"] == "no-referrer"
    assert "frame-ancestors 'none'" in h["Content-Security-Policy"]
    assert "camera=()" in h["Permissions-Policy"]


def test_por_defecto_nada_se_guarda_en_cache(cliente):
    assert cliente.get("/api/v1/_pequena").headers["Cache-Control"] == "no-store"


def test_hsts_solo_por_https(cliente):
    assert "Strict-Transport-Security" not in cliente.get("/api/v1/_pequena").headers
    seguro = cliente.get("/api/v1/_pequena", base_url="https://localhost")
    assert "max-age=31536000" in seguro.headers["Strict-Transport-Security"]


def test_ruta_inexistente_responde_json_en_espanol_sin_detalles_internos(cliente):
    r = cliente.get("/api/v1/no-existe")
    cuerpo = r.get_json()
    assert r.status_code == 404 and cuerpo["error"]["code"] == "NO_ENCONTRADO"
    assert "Werkzeug" not in r.get_data(as_text=True) and cuerpo["error"]["request_id"]


def test_sin_token_responde_401_uniforme(cliente):
    r = cliente.get("/api/v1/salon/parametros")
    assert r.status_code == 401 and r.get_json()["error"]["code"] == "NO_AUTENTICADO"


def test_token_basura_responde_401(cliente):
    r = cliente.get("/api/v1/salon/parametros", headers={"Authorization": "Bearer basura"})
    assert r.status_code == 401 and r.get_json()["error"]["code"] == "TOKEN_INVALIDO"


def test_cuerpo_demasiado_grande_se_rechaza(cliente):
    r = cliente.post("/api/v1/auth/login", data="x" * (1024 * 1024 + 10), content_type="application/json")
    assert r.status_code == 413 and r.get_json()["error"]["code"] == "CUERPO_DEMASIADO_GRANDE"


def test_cors_permite_el_origen_configurado(cliente):
    r = cliente.get("/api/v1/_pequena", headers={"Origin": ORIGEN})
    assert r.headers["Access-Control-Allow-Origin"] == ORIGEN


def test_cors_no_permite_otros_origenes(cliente):
    r = cliente.get("/api/v1/_pequena", headers={"Origin": "https://sitio-malicioso.example"})
    assert "Access-Control-Allow-Origin" not in r.headers


def test_preflight_solo_acepta_metodos_y_cabeceras_conocidos(cliente):
    r = cliente.options("/api/v1/salon/mesas", headers={
        "Origin": ORIGEN, "Access-Control-Request-Method": "PATCH", "Access-Control-Request-Headers": "authorization,content-type"})
    permitidos = r.headers["Access-Control-Allow-Methods"]
    assert r.status_code == 200 and "PATCH" in permitidos and "DELETE" not in permitidos
    assert "authorization" in r.headers["Access-Control-Allow-Headers"].lower()


def test_las_respuestas_grandes_se_comprimen(cliente):
    r = cliente.get("/api/v1/_grande", headers={"Accept-Encoding": "gzip"})
    assert r.headers["Content-Encoding"] == "gzip" and "Accept-Encoding" in r.headers["Vary"]
    assert json.loads(gzip.decompress(r.data))["datos"] == "x" * 5000
    assert int(r.headers["Content-Length"]) == len(r.data) < 500


def test_no_se_comprime_si_el_cliente_no_lo_pide_ni_si_es_pequena(cliente):
    assert "Content-Encoding" not in cliente.get("/api/v1/_grande").headers
    assert "Content-Encoding" not in cliente.get("/api/v1/_pequena", headers={"Accept-Encoding": "gzip"}).headers


def test_las_respuestas_de_auth_no_se_comprimen(cliente):
    r = cliente.get("/api/v1/auth/_grande", headers={"Accept-Encoding": "gzip"})
    assert "Content-Encoding" not in r.headers      # tokens: no exponerlos a ataques tipo BREACH


def test_un_request_id_valido_se_conserva(cliente):
    assert cliente.get("/api/v1/_pequena", headers={"X-Request-ID": "abc-123.x"}).headers["X-Request-ID"] == "abc-123.x"


def test_un_request_id_hostil_se_reemplaza(cliente):
    r = cliente.get("/api/v1/_pequena", headers={"X-Request-ID": "<script>alert(1)</script>"})
    assert "<" not in r.headers["X-Request-ID"] and 0 < len(r.headers["X-Request-ID"]) <= 12


class AuthFalso:
    def login(self, usuario, clave):
        raise Unauthorized("Usuario o contraseña incorrectos.", "CREDENCIALES_INVALIDAS")


def intentar(cliente, usuario, ip):
    return cliente.post("/api/v1/auth/login", json={"usuario": usuario, "clave": "x"}, environ_overrides={"REMOTE_ADDR": ip})


def test_el_login_se_limita_por_usuario_aunque_cambie_la_ip(cliente, monkeypatch):
    monkeypatch.setattr("app.modules.auth.routes.auth_service", lambda: AuthFalso())
    for i in range(10):
        assert intentar(cliente, "GP1", f"10.0.0.{i}").status_code == 401
    bloqueado = intentar(cliente, "gp1", "10.0.1.1")                 # otra IP y otra capitalización
    assert bloqueado.status_code == 429 and bloqueado.get_json()["error"]["code"] == "DEMASIADOS_INTENTOS"
    assert intentar(cliente, "GP2", "10.0.1.2").status_code == 401   # los demás usuarios no se ven afectados


def test_el_login_se_limita_por_ip(cliente, monkeypatch):
    monkeypatch.setattr("app.modules.auth.routes.auth_service", lambda: AuthFalso())
    for i in range(10):
        assert intentar(cliente, f"U{i}", "10.9.9.9").status_code == 401
    assert intentar(cliente, "OTRO", "10.9.9.9").status_code == 429


def test_el_limite_de_login_no_filtra_si_el_usuario_existe(cliente, monkeypatch):
    monkeypatch.setattr("app.modules.auth.routes.auth_service", lambda: AuthFalso())
    r = intentar(cliente, "NOEXISTE", "10.5.5.5")
    assert r.get_json()["error"]["message"] == "Usuario o contraseña incorrectos."
