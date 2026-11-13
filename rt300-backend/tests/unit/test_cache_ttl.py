import threading

from app.core.cache import CacheTTL


class RelojFalso:
    def __init__(self):
        self.ahora = 1000.0

    def __call__(self):
        return self.ahora


def contador():
    llamadas = []

    def fabrica():
        llamadas.append(1)
        return {"valor": len(llamadas)}

    return fabrica, llamadas


def test_el_segundo_pedido_sale_de_la_cache():
    cache, (fabrica, llamadas) = CacheTTL(60), contador()
    a, b = cache.obtener("k", fabrica), cache.obtener("k", fabrica)
    assert a is b and len(llamadas) == 1


def test_vence_pasado_el_ttl():
    reloj = RelojFalso()
    cache, (fabrica, llamadas) = CacheTTL(60, reloj=reloj), contador()
    cache.obtener("k", fabrica)
    reloj.ahora += 59
    cache.obtener("k", fabrica)
    assert len(llamadas) == 1
    reloj.ahora += 2
    cache.obtener("k", fabrica)
    assert len(llamadas) == 2


def test_claves_distintas_no_se_mezclan():
    cache = CacheTTL(60)
    assert cache.obtener(("platos", 1), lambda: "uno") == "uno"
    assert cache.obtener(("platos", 2), lambda: "dos") == "dos"


def test_ttl_cero_desactiva_la_cache():
    cache, (fabrica, llamadas) = CacheTTL(0), contador()
    cache.obtener("k", fabrica)
    cache.obtener("k", fabrica)
    assert len(llamadas) == 2 and not cache.activa and len(cache) == 0


def test_el_tamano_esta_acotado_y_sale_lo_menos_usado():
    cache = CacheTTL(60, max_entradas=2)
    cache.obtener("a", lambda: 1)
    cache.obtener("b", lambda: 2)
    cache.obtener("a", lambda: 1)          # "a" se usó hace poco
    cache.obtener("c", lambda: 3)          # entra "c" y sale "b"
    assert len(cache) == 2
    llamadas = []
    cache.obtener("b", lambda: llamadas.append(1) or 2)
    assert llamadas == [1]


def test_limpiar_vacia_la_cache():
    cache = CacheTTL(60)
    cache.obtener("k", lambda: 1)
    cache.limpiar()
    assert len(cache) == 0


def test_varios_hilos_no_rompen_la_cache():
    cache, errores = CacheTTL(60, max_entradas=50), []

    def trabajo(n):
        try:
            for i in range(200):
                assert cache.obtener(("k", i % 80), lambda i=i: i % 80) == i % 80
        except AssertionError as e:  # pragma: no cover
            errores.append((n, e))

    hilos = [threading.Thread(target=trabajo, args=(n,)) for n in range(8)]
    [h.start() for h in hilos]
    [h.join() for h in hilos]
    assert errores == [] and len(cache) <= 50
