import time

from app.extensions import RevocadosEnMemoria, RevocadosEnRedis


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
