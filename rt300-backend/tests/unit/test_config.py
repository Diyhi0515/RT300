import pytest

from app.config import Config

PRODUCCION_OK = {
    "env": "production",
    "secret_key": "s" * 40,
    "jwt_secret_key": "j" * 40,
    "db_user": "rt300_prod",
    "db_password": "Una-clave-larga-y-propia-9",
    "cors_origins": ("https://pos.club.bo",),
}


def test_produccion_con_ajustes_propios_arranca():
    Config(**PRODUCCION_OK).validate()


def test_desarrollo_no_se_valida():
    Config(env="development").validate()


@pytest.mark.parametrize(
    "cambio, texto",
    [
        ({"secret_key": "dev-secret-cambiar"}, "SECRET_KEY"),
        ({"jwt_secret_key": "corta"}, "SECRET_KEY"),
        ({"db_user": "sa"}, "DB_USER"),
        ({"db_user": "prueba"}, "DB_USER"),
        ({"db_password": "Rt300App2026x"}, "DB_USER"),
        ({"db_password": ""}, "DB_USER"),
        ({"cors_origins": ("*",)}, "CORS_ORIGINS"),
        ({"cors_origins": ()}, "CORS_ORIGINS"),
    ],
)
def test_produccion_rechaza_ajustes_de_desarrollo(cambio, texto):
    with pytest.raises(RuntimeError, match=texto):
        Config(**{**PRODUCCION_OK, **cambio}).validate()


def test_informa_todos_los_problemas_juntos():
    with pytest.raises(RuntimeError) as e:
        Config(env="production").validate()
    mensaje = str(e.value)
    assert "SECRET_KEY" in mensaje and "DB_USER" in mensaje


def test_los_secretos_no_salen_en_el_repr():
    texto = repr(Config(**PRODUCCION_OK))
    assert "j" * 40 not in texto and "Una-clave-larga-y-propia-9" not in texto
