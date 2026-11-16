"""Textos con varias codificaciones en la base (ver core/text.py y scripts/auditar_codificacion.py)."""
import pytest

from app.core.sql import _clean
from app.core.text import reparar_codificacion, variantes_de_busqueda


@pytest.mark.parametrize(
    ("leido", "esperado"),
    [
        ("A\u00a4EZ CINTHIA", "A\u00d1EZ CINTHIA"),                  # ñ en IBM850, nombre en mayúsculas
        ("EVENTOS - CABA\u00a5A JATAI", "EVENTOS - CABA\u00d1A JATAI"),
        ("BAR CARIBE\u00a4O", "BAR CARIBE\u00d1O"),
        ("JOS\u201a P\u00a4A", "JOS\u00c9 P\u00d1A"),              # é y ñ en el mismo texto
        ("Pe\u00a4a", "Pe\u00f1a"),                                   # texto en minúsculas: se respeta
        ("PE\u00b1A", "PE\u00d1A"),                                   # la ñ guardada como ±
        ("NU\u00b1EZ DASHA", "NU\u00d1EZ DASHA"),
        ("Pe\u00b1a", "Pe\u00f1a"),
    ],
)
def test_repara_los_textos_con_la_enie_mal_guardada(leido, esperado):
    assert reparar_codificacion(leido) == esperado


@pytest.mark.parametrize(
    "texto",
    ["PE\u00d1A", "PE\u00f1A ALBERT", "MARIA JOSE", "CAF\u00c9 \u00d1ANDU", "\u00a1HOLA!", "PRECIO \u00a310", "", "50\u00a2",
     "TOLERANCIA \u00b10.5", "5\u00b1", "N\u00ba 26", "CODO 45\u00ba", "G\u00a1ABRIELA"],
)
def test_no_toca_los_textos_correctos_ni_los_simbolos_legitimos(texto):
    assert reparar_codificacion(texto) == texto


def test_un_texto_con_letras_correctas_y_el_simbolo_no_se_toca():
    assert reparar_codificacion("PE\u00d1A \u00a4") == "PE\u00d1A \u00a4"


def test_la_lectura_de_la_base_repara_y_recorta():
    assert _clean("  A\u00a4EZ   ") == "A\u00d1EZ"


def test_las_variantes_de_busqueda_cubren_todas_las_codificaciones():
    v = variantes_de_busqueda("A\u00d1EZ")
    assert "A\u00d1EZ" in v and "A\u00a5EZ" in v and "A\u00b1EZ" in v          # Windows-1252, IBM850 (Ñ) y ±
    assert any("\u00a4" in x for x in variantes_de_busqueda("a\u00f1ez"))        # IBM850 (ñ minúscula)
    assert variantes_de_busqueda("AGUA") == ["AGUA"]
