"""Nombre del negocio: sale de la base, el administrador puede cambiarlo solo para la app."""
from dataclasses import replace

import pytest

from app.core.errors import Forbidden, ServicioNoDisponible
from app.modules.negocio import routes
from app.modules.negocio.ajustes import AjustesSqlite
from app.modules.negocio.repository import SqlNegocioRepository
from app.modules.negocio.schemas import NombreNegocioIn
from app.modules.negocio.service import NegocioService
from tests.unit.fakes import GARZON
from tests.unit.test_api_http import app, cliente  # noqa: F401 (fixtures)

ADMIN = replace(GARZON, rol="admin")


class Repo:
    def __init__(self, nombre="EMPRESA DE LA BASE"):
        self._nombre = nombre

    def nombre(self):
        return self._nombre


def servicio(tmp_path, repo=None):
    return NegocioService(repo or Repo(), AjustesSqlite(tmp_path / "datos" / "ajustes.sqlite"))


def test_sin_nombre_propio_se_usa_el_de_la_base(tmp_path):
    assert servicio(tmp_path).nombre() == "EMPRESA DE LA BASE"
    assert not (tmp_path / "datos").exists()                     # leer no crea archivos


def test_el_administrador_cambia_el_nombre_y_se_conserva(tmp_path):
    r = servicio(tmp_path).cambiar_nombre(ADMIN, "  Mi Restaurante  ")
    assert r == {"nombre": "Mi Restaurante", "nombre_base": "EMPRESA DE LA BASE", "personalizado": True}
    assert servicio(tmp_path).nombre() == "Mi Restaurante"      # otra instancia: quedó guardado


def test_dejarlo_vacio_vuelve_al_de_la_base(tmp_path):
    s = servicio(tmp_path)
    s.cambiar_nombre(ADMIN, "Otro")
    assert s.cambiar_nombre(ADMIN, "   ") == {"nombre": "EMPRESA DE LA BASE", "nombre_base": "EMPRESA DE LA BASE",
                                             "personalizado": False}


@pytest.mark.parametrize("accion", [lambda s: s.detalle(GARZON), lambda s: s.cambiar_nombre(GARZON, "X")])
def test_solo_el_administrador(tmp_path, accion):
    with pytest.raises(Forbidden):
        accion(servicio(tmp_path))
    assert not (tmp_path / "datos").exists()


def test_si_no_se_puede_escribir_responde_503(tmp_path):
    (tmp_path / "datos").write_text("ocupa el lugar de la carpeta")
    with pytest.raises(ServicioNoDisponible):
        servicio(tmp_path).cambiar_nombre(ADMIN, "X")


def test_un_archivo_de_ajustes_dañado_no_impide_mostrar_el_nombre(tmp_path):
    (tmp_path / "datos").mkdir()
    (tmp_path / "datos" / "ajustes.sqlite").write_bytes(b"esto no es sqlite" * 20)
    assert servicio(tmp_path).nombre() == "EMPRESA DE LA BASE"


@pytest.mark.parametrize("nombre", ["x" * 61, "dos\nlineas", "tab\there"])
def test_rechaza_nombres_largos_o_con_caracteres_de_control(nombre):
    with pytest.raises(ValueError):
        NombreNegocioIn(nombre=nombre)


def test_la_consulta_publica_entrega_solo_el_nombre(cliente, monkeypatch, tmp_path):  # noqa: F811
    monkeypatch.setattr(routes, "negocio_service", lambda: servicio(tmp_path))
    r = cliente.get("/api/v1/negocio")
    assert r.status_code == 200 and r.get_json() == {"nombre": "EMPRESA DE LA BASE"}


@pytest.mark.parametrize("metodo", ["get", "put"])
def test_los_ajustes_piden_sesion(cliente, metodo):  # noqa: F811
    assert getattr(cliente, metodo)("/api/v1/negocio/ajustes").status_code == 401


def test_una_fila_vacia_cuenta_como_sin_nombre(monkeypatch):
    repo = SqlNegocioRepository(None)
    for fila in (None, {"nombre": ""}, {"nombre": None}):
        monkeypatch.setattr(repo, "_one", lambda *a, fila=fila, **k: fila)
        assert repo.nombre() is None
