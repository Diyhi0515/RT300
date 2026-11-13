"""Pruebas de integración de SOLO LECTURA contra la base de datos real (copia de Docker).

No escriben nada. Se ejecutan dentro del contenedor del backend:

    docker compose exec -e RT300_INTEGRATION=1 backend python -m pytest tests/integration -q

Sin RT300_INTEGRATION=1 se omiten, así que `pytest` a secas sigue siendo rápido y no necesita base de datos.
"""
import gzip
import json
import os

import pytest

from app import create_app
from app.extensions import limiter

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(os.getenv("RT300_INTEGRATION") != "1", reason="defina RT300_INTEGRATION=1 (necesita la BD de Docker)"),
]

USUARIO, CLAVE = "GP1", "123456"   # usuario de pruebas de la copia local (clave heredada del sistema antiguo)


@pytest.fixture(scope="module")
def cliente():
    app = create_app()
    limiter.reset()
    return app.test_client()


@pytest.fixture(scope="module")
def sesion(cliente):
    r = cliente.post("/api/v1/auth/login", json={"usuario": USUARIO, "clave": CLAVE})
    assert r.status_code == 200, r.get_data(as_text=True)
    return r.get_json()


@pytest.fixture(scope="module")
def auth(sesion):
    return {"Authorization": f"Bearer {sesion['access_token']}"}


def test_health_con_base_de_datos(cliente):
    r = cliente.get("/api/v1/health")
    assert r.status_code == 200 and r.get_json() == {"status": "ok", "db": True}


def test_login_entrega_el_perfil_que_necesita_el_front(sesion):
    perfil = sesion["perfil"]
    assert perfil["usuario"] == USUARIO and perfil["rol"] == "garzon"
    assert perfil["cven"] > 0 and perfil["cloc"] > 0 and perfil["local"]
    assert "clave" not in json.dumps(sesion).lower()


def test_login_con_clave_mala_no_revela_si_el_usuario_existe(cliente):
    mala = cliente.post("/api/v1/auth/login", json={"usuario": USUARIO, "clave": "mala"}).get_json()
    inexistente = cliente.post("/api/v1/auth/login", json={"usuario": "NOEXISTE", "clave": "mala"}).get_json()
    assert mala["error"]["message"] == inexistente["error"]["message"]


def test_parametros_solo_expone_lo_necesario(cliente, auth):
    d = cliente.get("/api/v1/salon/parametros", headers=auth).get_json()
    assert set(d) == {"caco", "areas", "mesas", "meseros", "local", "moneda", "decimales"}
    assert set(d["local"]) == {"codigo", "descripcion"} and set(d["moneda"]) <= {"codigo", "abreviatura", "descripcion"}
    assert d["areas"] and d["decimales"] >= 0


def test_mesas_del_local_traen_lo_que_pinta_el_plano(cliente, auth):
    mesas = cliente.get("/api/v1/salon/mesas", headers=auth).get_json()["mesas"]
    assert len(mesas) > 10
    claves = {"mesa", "area", "capacidad", "estado", "folio", "comensales", "mozo", "apertura", "cuentas", "consumo"}
    assert claves <= set(mesas[0])
    ocupadas = [m for m in mesas if m["folio"]]
    assert ocupadas and all(m["apertura"] and m["mozo"] and m["cuentas"] >= 1 for m in ocupadas)


def test_el_detalle_del_folio_une_cuentas_y_consumo(cliente, auth):
    mesas = cliente.get("/api/v1/salon/mesas", headers=auth).get_json()["mesas"]
    folio = max((m for m in mesas if m["folio"]), key=lambda m: m["cuentas"])["folio"]
    cuentas = cliente.get(f"/api/v1/salon/folios/{folio}/detalle", headers=auth).get_json()["cuentas"]
    assert cuentas and all({"ncta", "nombre", "estc", "lineas"} <= set(c) for c in cuentas)
    assert any(c["lineas"] for c in cuentas)


def test_lo_de_otro_local_se_rechaza(cliente, auth, sesion):
    mesas = cliente.get("/api/v1/salon/parametros", headers=auth).get_json()["areas"]
    otro_local = cliente.get("/api/v1/salon/mesas/SN02", headers=auth)    # mesa de otro local en la copia de pruebas
    assert mesas and otro_local.status_code == 403 and otro_local.get_json()["error"]["code"] == "OTRO_LOCAL"


def test_menu_se_puede_guardar_y_el_listado_coincide_con_la_ficha(cliente, auth):
    r = cliente.get("/api/v1/menu/secciones", headers=auth)
    assert r.headers["Cache-Control"] == "private, max-age=300"
    secciones = r.get_json()["secciones"]
    assert len([s for s in secciones if s["cssm"] == 0]) >= 10
    platos = cliente.get("/api/v1/menu/secciones/1/0/platos", headers=auth).get_json()["platos"]
    assert platos
    for p in platos[:15]:
        ficha = cliente.get(f"/api/v1/menu/platos/{p['cart']}?tent=0&entg=0&cpxc=N", headers=auth)
        if ficha.status_code == 200:
            assert ficha.get_json()["pvta"] == p["pvta"], p["cart"]   # el listado muestra el precio que se cobra


def test_el_listado_grande_viaja_comprimido(cliente, auth):
    r = cliente.get("/api/v1/menu/secciones/8/0/platos", headers={**auth, "Accept-Encoding": "gzip"})
    assert r.headers.get("Content-Encoding") == "gzip" and len(r.data) < 15000
    assert len(json.loads(gzip.decompress(r.data))["platos"]) > 50


def test_buscar_clientes_no_devuelve_datos_personales(cliente, auth):
    c = cliente.get("/api/v1/clientes?codigo=17", headers=auth).get_json()["clientes"][0]
    assert set(c) == {"codigo", "nombre", "nruc", "ndid", "lpre"}


def test_cerrar_sesion_revoca_el_token(cliente):
    limiter.reset()
    s = cliente.post("/api/v1/auth/login", json={"usuario": "GP2", "clave": CLAVE}).get_json()
    h = {"Authorization": f"Bearer {s['access_token']}"}
    assert cliente.get("/api/v1/auth/me", headers=h).status_code == 200
    assert "refresh_token" not in s
    csrf = {"X-Requested-With": "rt300"}
    assert cliente.post("/api/v1/auth/refresh", headers=csrf).status_code == 200      # la cookie la guarda el cliente de pruebas
    cliente.post("/api/v1/auth/logout", headers={**h, **csrf})
    assert cliente.get("/api/v1/auth/me", headers=h).get_json()["error"]["code"] == "TOKEN_REVOCADO"
    assert cliente.post("/api/v1/auth/refresh", headers=csrf).status_code == 401
