"""El administrador sube la imagen de un producto: se valida, se recodifica y se vincula solo si rtalbnimg está vacía."""
import io
from dataclasses import replace

import pytest
from PIL import Image

from app.core.errors import Conflict, Forbidden, NotFound, ServicioNoDisponible, ValidationFailed
from app.modules.menu import images
from app.modules.menu.administrar_imagenes import ImagenesPlatosService
from app.modules.menu.almacen_imagenes import MAXIMO_BYTES, AlmacenImagenes, ImagenInvalida, nombre_para
from tests.unit.fakes import GARZON, FakeUow

ADMIN = replace(GARZON, rol="admin")
NUL = bytes([0])


def png(ancho=40, alto=30, modo="RGBA") -> bytes:
    buffer = io.BytesIO()
    Image.new(modo, (ancho, alto), (200, 30, 30, 128) if modo == "RGBA" else "red").save(buffer, "PNG")
    return buffer.getvalue()


class RepoImagenes:
    def __init__(self, existe=True, nombre=None, filas=1):
        self._existe, self.nombre, self._filas, self.vinculos = existe, nombre, filas, []

    def existe_plato(self, cart): return self._existe
    def nombre_imagen(self, cart): return self.nombre
    def vincular_imagen_si_vacia(self, cart, nombre):
        self.vinculos.append((cart, nombre))
        return self._filas


def servicio(tmp_path, repo=None, avisos=None):
    repo = repo or RepoImagenes()
    avisos = avisos if avisos is not None else []
    return ImagenesPlatosService(repo, FakeUow(), AlmacenImagenes(tmp_path), lambda: avisos.append("invalidar")), repo, avisos


# ───────────── almacén ─────────────
def test_nombre_derivado_del_codigo_sin_caracteres_peligrosos():
    assert nombre_para("5101004") == "5101004.jpg"
    assert nombre_para("../../etc/passwd") == "etc_passwd.jpg"
    assert nombre_para("  ") == "producto.jpg"


def test_guarda_como_jpeg_y_recodifica(tmp_path):
    AlmacenImagenes(tmp_path).guardar(png(modo="RGBA"), "A1.jpg")
    with Image.open(tmp_path / "A1.jpg") as im:
        assert im.format == "JPEG" and im.mode == "RGB"
    assert [f.name for f in tmp_path.iterdir()] == ["A1.jpg"]          # sin temporales


def test_reduce_las_imagenes_grandes(tmp_path):
    AlmacenImagenes(tmp_path).guardar(png(4000, 2000, "RGB"), "A1.jpg")
    with Image.open(tmp_path / "A1.jpg") as im:
        assert max(im.size) == 1600


@pytest.mark.parametrize(
    ("contenido", "codigo"),
    [
        (b"", "IMAGEN_VACIA"),
        (b"esto no es una imagen", "IMAGEN_INVALIDA"),
        (b"<svg xmlns='http://www.w3.org/2000/svg'/>", "IMAGEN_INVALIDA"),
        (b"GIF89a" + NUL * 10, "IMAGEN_INVALIDA"),
        (b"MZ" + NUL * 200, "IMAGEN_INVALIDA"),
        (b"x" * (MAXIMO_BYTES + 1), "IMAGEN_MUY_GRANDE"),
    ],
)
def test_rechaza_lo_que_no_es_una_imagen_valida(tmp_path, contenido, codigo):
    with pytest.raises(ImagenInvalida) as e:
        AlmacenImagenes(tmp_path).guardar(contenido, "A1.jpg")
    assert e.value.codigo == codigo and list(tmp_path.iterdir()) == []


def test_un_script_disfrazado_de_imagen_no_se_conserva(tmp_path):
    cuerpo = png() + b"<?php system($_GET['x']); ?>"
    AlmacenImagenes(tmp_path).guardar(cuerpo, "A1.jpg")
    assert b"<?php" not in (tmp_path / "A1.jpg").read_bytes()


def test_el_nombre_de_destino_no_puede_salirse_de_la_carpeta(tmp_path):
    carpeta = tmp_path / "subidas"
    AlmacenImagenes(carpeta).guardar(png(), "../../afuera.jpg")
    assert (carpeta / "afuera.jpg").is_file() and not (tmp_path / "afuera.jpg").exists()


# ───────────── servicio ─────────────
def test_solo_el_administrador_puede_subir(tmp_path):
    s, repo, _ = servicio(tmp_path)
    with pytest.raises(Forbidden) as e:
        s.asignar(GARZON, "A1", png())
    assert e.value.code == "SIN_PERMISO_ROL" and repo.vinculos == [] and list(tmp_path.iterdir()) == []


def test_sin_imagen_guarda_vincula_e_invalida_la_cache(tmp_path):
    s, repo, avisos = servicio(tmp_path)
    r = s.asignar(ADMIN, " 5101004 ", png())
    assert r == {"cart": "5101004", "imagen": "5101004.jpg"}
    assert repo.vinculos == [("5101004", "5101004.jpg")] and (tmp_path / "5101004.jpg").is_file() and avisos == ["invalidar"]


def test_si_ya_tiene_una_imagen_que_existe_no_se_cambia(tmp_path):
    (tmp_path / "vieja.jpg").write_bytes(png())
    s, repo, avisos = servicio(tmp_path, RepoImagenes(nombre="vieja.jpg"))
    with pytest.raises(Conflict) as e:
        s.asignar(ADMIN, "A1", png())
    assert e.value.code == "YA_TIENE_IMAGEN" and repo.vinculos == [] and avisos == []


def test_si_la_base_tiene_un_nombre_pero_falta_el_archivo_se_repone_sin_tocar_la_base(tmp_path):
    s, repo, _ = servicio(tmp_path, RepoImagenes(nombre="TABLA MEXICANA.jpg"))
    r = s.asignar(ADMIN, "A1", png())
    assert r["imagen"] == "TABLA MEXICANA.jpg" and (tmp_path / "TABLA MEXICANA.jpg").is_file() and repo.vinculos == []


def test_producto_inexistente(tmp_path):
    s, _, _ = servicio(tmp_path, RepoImagenes(existe=False))
    with pytest.raises(NotFound):
        s.asignar(ADMIN, "NADA", png())


def test_una_imagen_invalida_no_vincula_nada(tmp_path):
    s, repo, avisos = servicio(tmp_path)
    with pytest.raises(ValidationFailed) as e:
        s.asignar(ADMIN, "A1", b"no es imagen")
    assert e.value.code == "IMAGEN_INVALIDA" and repo.vinculos == [] and avisos == []


def test_si_otro_admin_la_vinculo_primero_se_avisa(tmp_path):
    s, _, avisos = servicio(tmp_path, RepoImagenes(filas=0))
    with pytest.raises(Conflict):
        s.asignar(ADMIN, "A1", png())
    assert avisos == []


def test_carpeta_no_escribible_responde_503(tmp_path):
    bloqueo = tmp_path / "archivo"
    bloqueo.write_text("x")
    s = ImagenesPlatosService(RepoImagenes(), FakeUow(), AlmacenImagenes(bloqueo / "subidas"), lambda: None)
    with pytest.raises(ServicioNoDisponible) as e:
        s.asignar(ADMIN, "A1", png())
    assert e.value.status == 503


# ───────────── lo subido se sirve primero ─────────────
def test_se_busca_primero_en_lo_subido_y_despues_en_la_carpeta_heredada(tmp_path):
    subidas, heredada = tmp_path / "subidas", tmp_path / "heredada"
    subidas.mkdir()
    heredada.mkdir()
    (heredada / "x.jpg").write_bytes(b"1")
    (heredada / "y.jpg").write_bytes(b"1")
    (subidas / "x.jpg").write_bytes(b"2")
    carpetas = [str(subidas), str(heredada)]
    assert images.buscar("x.jpg", carpetas).parent == subidas
    assert images.buscar("y.jpg", carpetas).parent == heredada
    assert images.buscar("z.jpg", carpetas) is None
