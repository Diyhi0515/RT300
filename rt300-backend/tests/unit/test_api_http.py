"""Comportamiento HTTP transversal (cabeceras, CORS, compresión, límites, errores) sin base de datos."""
import gzip
import io
import json

import pytest
from flask import jsonify

from app import create_app
from app.config import Config
from app.core.errors import Unauthorized
from app.domain.usuario import Usuario
from app.extensions import limiter

ORIGEN = "http://localhost:5173"


@pytest.fixture
def app():
    app = create_app(Config(env="development", cors_origins=(ORIGEN,), db_host="no-existe", gateway_mode="fake", revocados_db=""))

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


CSRF = {"X-Requested-With": "rt300"}
GARZON = Usuario("GP1", "GARZON 1", 2, 2, 1, 12012, "garzon")


class AuthCorrecto:
    def login(self, usuario, clave):
        class Resultado:
            pass

        r = Resultado()
        r.usuario, r.local = GARZON, "RESTAURANTE"
        return r


@pytest.fixture
def sesion(cliente, monkeypatch):
    monkeypatch.setattr("app.modules.auth.routes.auth_service", lambda: AuthCorrecto())
    return cliente.post("/api/v1/auth/login", json={"usuario": "GP1", "clave": "x"})


def _cookie(respuesta):
    return next(c for c in respuesta.headers.getlist("Set-Cookie") if c.startswith("rt300_rt="))


def test_el_login_entrega_el_acceso_en_el_cuerpo_y_la_renovacion_solo_en_cookie_httponly(sesion):
    cuerpo = sesion.get_json()
    assert "access_token" in cuerpo and "refresh_token" not in cuerpo
    cookie = _cookie(sesion)
    assert "HttpOnly" in cookie and "SameSite=Strict" in cookie and "Path=/api/v1/auth" in cookie


def test_la_cookie_exige_https_fuera_de_desarrollo():
    assert Config(env="production", cookie_secure="").cookie_segura is True
    assert Config(env="development", cookie_secure="").cookie_segura is False
    assert Config(env="production", cookie_secure="false").cookie_segura is False


def test_refresh_sin_la_cabecera_propia_se_rechaza_aunque_haya_cookie(cliente, sesion):
    r = cliente.post("/api/v1/auth/refresh")
    assert r.status_code == 403 and r.get_json()["error"]["code"] == "CSRF"


def test_refresh_con_cookie_y_cabecera_entrega_un_acceso_nuevo(cliente, sesion):
    r = cliente.post("/api/v1/auth/refresh", headers=CSRF)
    assert r.status_code == 200 and "access_token" in r.get_json()


def test_refresh_sin_cookie_responde_401(cliente):
    assert cliente.post("/api/v1/auth/refresh", headers=CSRF).status_code == 401


def test_un_token_de_acceso_no_sirve_para_renovar(cliente, sesion):
    acceso = sesion.get_json()["access_token"]
    cliente.delete_cookie("rt300_rt", path="/api/v1/auth")
    r = cliente.post("/api/v1/auth/refresh", headers={**CSRF, "Authorization": f"Bearer {acceso}"})
    assert r.status_code == 401


def test_logout_sin_la_cabecera_propia_se_rechaza(cliente, sesion):
    assert cliente.post("/api/v1/auth/logout").status_code == 403


def test_logout_revoca_la_renovacion_borra_la_cookie_y_ya_no_se_puede_renovar(cliente, sesion):
    acceso = sesion.get_json()["access_token"]
    cookie_valor = _cookie(sesion).split(";")[0].split("=", 1)[1]
    r = cliente.post("/api/v1/auth/logout", headers={**CSRF, "Authorization": f"Bearer {acceso}"})
    borrada = _cookie(r)
    assert r.status_code == 200 and ("Max-Age=0" in borrada or "Expires=Thu, 01 Jan 1970" in borrada)
    cliente.set_cookie("rt300_rt", cookie_valor, path="/api/v1/auth")      # un atacante que copió la cookie
    assert cliente.post("/api/v1/auth/refresh", headers=CSRF).status_code == 401
    assert cliente.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {acceso}"}).status_code == 401


def test_logout_funciona_con_el_acceso_vencido(cliente, sesion):
    r = cliente.post("/api/v1/auth/logout", headers={**CSRF, "Authorization": "Bearer vencido"})
    assert r.status_code == 200


def test_cors_permite_credenciales_solo_para_el_origen_configurado(cliente):
    ok = cliente.options("/api/v1/auth/refresh", headers={
        "Origin": ORIGEN, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "x-requested-with"})
    assert ok.headers["Access-Control-Allow-Credentials"] == "true"
    assert "x-requested-with" in ok.headers["Access-Control-Allow-Headers"].lower()
    ajeno = cliente.options("/api/v1/auth/refresh", headers={"Origin": "http://malo.com", "Access-Control-Request-Method": "POST"})
    assert "Access-Control-Allow-Origin" not in ajeno.headers


def test_instalacion_windows_sirve_frontend_y_fallback_spa(tmp_path):
    (tmp_path / "index.html").write_text("<main>RT300</main>", encoding="utf-8")
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log('rt300')", encoding="utf-8")
    app = create_app(Config(
        env="development", cors_origins=(ORIGEN,), db_host="no-existe", gateway_mode="fake",
        revocados_db="", frontend_dir=str(tmp_path),
    ))
    cliente_front = app.test_client()
    assert "RT300" in cliente_front.get("/").get_data(as_text=True)
    assert "RT300" in cliente_front.get("/pedidos/mesa/1").get_data(as_text=True)
    asset = cliente_front.get("/assets/app.js")
    assert asset.status_code == 200 and "default-src 'self'" in asset.headers["Content-Security-Policy"]


class ServicioImagenFalso:
    def __init__(self):
        self.recibido = None

    def asignar(self, u, cart, contenido):
        self.recibido = (u.rol, cart, len(contenido))
        return {"cart": cart, "imagen": f"{cart}.jpg"}


def _subir(cliente, acceso, contenido=b"x" * 10, campo="imagen"):
    return cliente.post("/api/v1/menu/platos/A1/imagen", headers={"Authorization": f"Bearer {acceso}"},
                        data={campo: (io.BytesIO(contenido), "foto.png")}, content_type="multipart/form-data")


def test_subir_imagen_acepta_un_archivo_mayor_al_tope_general_de_1mb(cliente, sesion, monkeypatch):
    falso = ServicioImagenFalso()
    monkeypatch.setattr("app.modules.menu.routes.imagenes_platos_service", lambda: falso)
    r = _subir(cliente, sesion.get_json()["access_token"], b"x" * (2 * 1024 * 1024))
    assert r.status_code == 201 and r.get_json() == {"cart": "A1", "imagen": "A1.jpg"}
    assert falso.recibido == ("garzon", "A1", 2 * 1024 * 1024)


def test_subir_imagen_rechaza_un_envio_enorme_con_413(cliente, sesion, monkeypatch):
    monkeypatch.setattr("app.modules.menu.routes.imagenes_platos_service", lambda: ServicioImagenFalso())
    r = _subir(cliente, sesion.get_json()["access_token"], b"x" * (6 * 1024 * 1024))
    assert r.status_code == 413


def test_subir_imagen_sin_el_campo_responde_422(cliente, sesion, monkeypatch):
    monkeypatch.setattr("app.modules.menu.routes.imagenes_platos_service", lambda: ServicioImagenFalso())
    r = _subir(cliente, sesion.get_json()["access_token"], campo="otro")
    assert r.status_code == 422 and r.get_json()["error"]["code"] == "IMAGEN_FALTA"


def test_subir_imagen_exige_sesion(cliente):
    r = cliente.post("/api/v1/menu/platos/A1/imagen", data={"imagen": (io.BytesIO(b"x"), "f.png")}, content_type="multipart/form-data")
    assert r.status_code == 401


def test_el_limite_de_login_por_ip_se_configura(monkeypatch):
    app = create_app(Config(env="development", cors_origins=(ORIGEN,), db_host="no-existe", gateway_mode="fake", revocados_db="",
                            rate_limit_login_ip="3/minute"))
    limiter.reset()
    monkeypatch.setattr("app.modules.auth.routes.auth_service", lambda: AuthFalso())
    cliente = app.test_client()
    estados = [intentar(cliente, f"U{i}", "10.7.7.7").status_code for i in range(5)]
    assert estados == [401, 401, 401, 429, 429]


def test_la_imagen_de_un_producto_es_publica_pero_tiene_limite(monkeypatch):
    app = create_app(Config(env="development", cors_origins=(ORIGEN,), db_host="no-existe", gateway_mode="fake", revocados_db="",
                            rate_limit_imagenes="2/minute"))
    limiter.reset()

    class Falso:
        def nombre_imagen(self, cart):
            return None

    monkeypatch.setattr("app.modules.menu.routes.menu_service", lambda: Falso())
    cliente = app.test_client()
    estados = [cliente.get("/api/v1/menu/platos/A1/imagen").status_code for _ in range(3)]
    assert estados == [200, 200, 429]
