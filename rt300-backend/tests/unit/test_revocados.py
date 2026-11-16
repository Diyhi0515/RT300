import time

from app import _almacen_revocados
from app.config import Config
from app.extensions import RevocadosEnMemoria, RevocadosEnRedis, RevocadosEnSqlite


class RedisFalso:
    def __init__(self):
        self.datos: dict[str, tuple[int, int | None]] = {}

    def set(self, clave, valor, ex=None):
        self.datos[clave] = (valor, ex)

    def exists(self, clave):
        return 1 if clave in self.datos else 0


def test_memoria_revoca_y_poda_los_vencidos():
    almacen = RevocadosEnMemoria()
    almacen.revocar("viejo", time.time() - 10)
    almacen.revocar("vigente", time.time() + 60)
    assert almacen.esta_revocado("vigente")
    assert not almacen.esta_revocado("viejo")
    assert not almacen.esta_revocado("otro")


def test_redis_guarda_con_expiracion_igual_al_resto_de_vida_del_token():
    cliente = RedisFalso()
    almacen = RevocadosEnRedis(cliente)
    almacen.revocar("abc", time.time() + 900)
    _, ex = cliente.datos[RevocadosEnRedis.PREFIJO + "abc"]
    assert 900 <= ex <= 902
    assert almacen.esta_revocado("abc")
    assert not almacen.esta_revocado("zzz")


def test_redis_token_ya_vencido_expira_en_un_segundo_como_minimo():
    cliente = RedisFalso()
    RevocadosEnRedis(cliente).revocar("abc", time.time() - 50)
    assert cliente.datos[RevocadosEnRedis.PREFIJO + "abc"][1] == 1


def test_sqlite_revoca_y_poda_los_vencidos(tmp_path):
    almacen = RevocadosEnSqlite(tmp_path / "r.sqlite")
    almacen.revocar("viejo", time.time() - 10)
    almacen.revocar("vigente", time.time() + 60)
    assert almacen.esta_revocado("vigente")
    assert not almacen.esta_revocado("viejo")
    assert not almacen.esta_revocado("otro")


def test_sqlite_sobrevive_a_un_reinicio(tmp_path):
    ruta = tmp_path / "carpeta" / "r.sqlite"
    RevocadosEnSqlite(ruta).revocar("abc", time.time() + 60)
    assert RevocadosEnSqlite(ruta).esta_revocado("abc")


def test_sqlite_revocar_dos_veces_no_falla(tmp_path):
    almacen = RevocadosEnSqlite(tmp_path / "r.sqlite")
    almacen.revocar("abc", time.time() + 60)
    almacen.revocar("abc", time.time() + 120)
    assert almacen.esta_revocado("abc")


def test_seleccion_usa_sqlite_por_defecto(tmp_path):
    cfg = Config(env="development", revocados_db=str(tmp_path / "r.sqlite"), redis_url="")
    assert isinstance(_almacen_revocados(cfg), RevocadosEnSqlite)


def test_seleccion_cae_a_memoria_si_no_puede_escribir(tmp_path):
    bloqueo = tmp_path / "archivo"
    bloqueo.write_text("x")
    cfg = Config(env="development", revocados_db=str(bloqueo / "r.sqlite"), redis_url="")
    assert isinstance(_almacen_revocados(cfg), RevocadosEnMemoria)


def test_seleccion_sin_ruta_usa_memoria():
    assert isinstance(_almacen_revocados(Config(env="development", revocados_db="", redis_url="")), RevocadosEnMemoria)
