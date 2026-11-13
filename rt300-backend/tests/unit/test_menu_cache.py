from app.core.cache import CacheTTL
from app.modules.menu.cache import MenuRepoConCache


class RepoMenuFalso:
    def __init__(self):
        self.llamadas: list[tuple] = []

    def _registrar(self, nombre, *args):
        self.llamadas.append((nombre, *args))
        return [{"n": len(self.llamadas)}]

    def secciones(self, cloc): return self._registrar("secciones", cloc)
    def subsecciones(self): return self._registrar("subsecciones")
    def platos(self, cloc, csme, cssm): return self._registrar("platos", cloc, csme, cssm)
    def extras(self, csme, cssm): return self._registrar("extras", csme, cssm)
    def precio(self, cart, tent, entg): return self._registrar("precio", cart, tent, entg)
    def insumos_de(self, carts): return self._registrar("insumos_de", tuple(carts))
    def tipo_cambio_venta(self): return self._registrar("tipo_cambio_venta")


def armar(ttl=60):
    interno = RepoMenuFalso()
    return MenuRepoConCache(interno, CacheTTL(ttl)), interno


def test_las_lecturas_del_menu_se_guardan():
    repo, interno = armar()
    assert repo.secciones(2) is repo.secciones(2)
    repo.platos(2, 8, 0)
    repo.platos(2, 8, 0)
    assert interno.llamadas == [("secciones", 2), ("platos", 2, 8, 0)]


def test_cada_local_y_seccion_tiene_su_propia_entrada():
    repo, interno = armar()
    repo.secciones(2)
    repo.secciones(3)
    repo.platos(2, 8, 0)
    repo.platos(2, 8, 5)
    assert len(interno.llamadas) == 4


def test_lo_que_cambia_con_cada_venta_nunca_se_guarda():
    repo, interno = armar()
    for _ in range(3):
        repo.precio("A1", 0, 0)
        repo.insumos_de(["A1"])
        repo.tipo_cambio_venta()
    assert len(interno.llamadas) == 9


def test_sin_cache_cuando_el_ttl_es_cero():
    repo, interno = armar(ttl=0)
    repo.secciones(2)
    repo.secciones(2)
    assert len(interno.llamadas) == 2
