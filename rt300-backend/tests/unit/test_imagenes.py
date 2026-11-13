import pytest
from flask import Flask
from PIL import Image

from app.modules.menu import images


@pytest.fixture(autouse=True)
def contexto_de_peticion():
    with Flask(__name__).test_request_context():   # send_file lo requiere
        yield


def test_convierte_a_webp_y_cachea(tmp_path):
    origen, cache = tmp_path / "img", tmp_path / "cache"
    origen.mkdir()
    Image.new("RGB", (1200, 800), "red").save(origen / "plato.bmp")
    r = images.servir("plato.bmp", 480, str(origen), str(cache))
    assert r.mimetype == "image/webp" and list(cache.glob("*.webp"))


def test_ancho_se_ajusta_a_la_lista_fija(tmp_path):
    origen, cache = tmp_path / "img", tmp_path / "cache"
    origen.mkdir()
    Image.new("RGB", (2000, 1000), "blue").save(origen / "p.jpg")
    for w in (1, 100, 475, 5000, 479, 481):
        images.servir("p.jpg", w, str(origen), str(cache))
    assert len(list(cache.glob("*.webp"))) <= 4      # no se crea una variante por cada ancho pedido


def test_sin_archivo_o_nombre_vacio_devuelve_placeholder(tmp_path):
    assert images.servir(None, 480, str(tmp_path), str(tmp_path)).headers.get("X-Placeholder") == "1"
    assert images.servir("no_existe.jpg", 480, str(tmp_path), str(tmp_path)).headers.get("X-Placeholder") == "1"


def test_no_permite_salirse_de_la_carpeta(tmp_path):
    (tmp_path / "secreto.txt").write_text("x")
    carpeta = tmp_path / "img"
    carpeta.mkdir()
    r = images.servir("../secreto.txt", 480, str(carpeta), str(tmp_path / "c"))
    assert r.headers.get("X-Placeholder") == "1"


def test_si_la_cache_no_es_escribible_se_sirve_igual_sin_guardar(tmp_path):
    origen = tmp_path / "img"
    origen.mkdir()
    Image.new("RGB", (800, 600), "green").save(origen / "plato.jpg")
    cache_bloqueada = tmp_path / "es-un-archivo"
    cache_bloqueada.write_text("no es una carpeta")          # mkdir falla: simula un volumen sin permiso
    r = images.servir("plato.jpg", 320, str(origen), str(cache_bloqueada))
    assert r.mimetype == "image/webp" and r.headers.get("X-Placeholder") is None
    assert r.get_data()[:4] == b"RIFF"
