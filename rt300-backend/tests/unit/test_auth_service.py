import pytest

from app.core.errors import Unauthorized
from app.modules.auth.ports import AccesoPedidos, Credencial
from app.modules.auth.service import AuthService, PoliticaRoles

CLAVE_123456 = "314580"


class RepoAuth:
    def __init__(self, **over):
        self.cred = Credencial("GP1", "GARZON 1", CLAVE_123456 + "   ", False, 2, 2, "12009")
        self.acceso = AccesoPedidos("1", 0)
        self.moneda = 1
        self.mesero_deshab = False
        self.rtctl = True
        self.__dict__.update(over)

    def credencial(self, u): return self.cred if u == "GP1" else None
    def acceso_pedidos(self, u): return self.acceso if u == "GP1" else None
    def moneda_de_venta(self): return self.moneda
    def mesero_deshabilitado(self, c): return self.mesero_deshab
    def hay_parametros_restaurant(self): return self.rtctl
    def nombre_local(self, c): return "RESTAURANTE HOYO 19"
    def usuarios_de_pedidos(self): return []
    def registradora(self, u, c, n): return n


def svc(**over):
    return AuthService(RepoAuth(**over), PoliticaRoles(admins=("GP1",)) if over.pop("admin", False) else PoliticaRoles())


def test_login_ok_devuelve_usuario_de_dominio():
    r = svc().login("gp1", "123456")
    u = r.usuario
    assert (u.usuario, u.cloc, u.calm, u.cmon, u.rol) == ("GP1", 2, 2, 1, "garzon")
    assert r.local == "RESTAURANTE HOYO 19"


def test_usuario_inexistente_y_clave_mala_dan_el_mismo_mensaje():
    with pytest.raises(Unauthorized) as a:
        svc().login("NOEXISTE", "x")
    with pytest.raises(Unauthorized) as b:
        svc().login("GP1", "mala")
    assert a.value.message == b.value.message and a.value.code == b.value.code == "CREDENCIALES_INVALIDAS"


def test_usuario_sin_acceso_a_pedidos_no_se_distingue():
    with pytest.raises(Unauthorized) as e:
        svc(acceso=None).login("GP1", "123456")
    assert e.value.code == "CREDENCIALES_INVALIDAS"


def test_deshabilitado_solo_se_informa_tras_clave_correcta():
    r = RepoAuth(cred=Credencial("GP1", "G", CLAVE_123456, True, 2, 2, "1"))
    with pytest.raises(Unauthorized) as e:
        AuthService(r, PoliticaRoles()).login("GP1", "123456")
    assert e.value.code == "USUARIO_DESHABILITADO"
    with pytest.raises(Unauthorized) as e2:
        AuthService(r, PoliticaRoles()).login("GP1", "otra")
    assert e2.value.code == "CREDENCIALES_INVALIDAS"


def test_rol_admin_por_politica():
    s = AuthService(RepoAuth(), PoliticaRoles(admins=("GP1",)))
    assert s.login("GP1", "123456").usuario.rol == "admin"


def test_la_caja_del_usuario_viaja_en_la_sesion():
    from app.modules.auth.ports import Credencial

    cred = Credencial("GP1", "GARZON 1", CLAVE_123456 + "   ", False, 2, 2, "12009", caja="3")
    assert svc(cred=cred).login("gp1", "123456").usuario.caja == "3"
    assert svc().login("gp1", "123456").usuario.caja == ""


def test_la_registradora_se_resuelve_con_el_repositorio():
    class Repo(RepoAuth):
        def registradora(self, u, c, n): return 7

    r = AuthService(Repo(), PoliticaRoles()).login("gp1", "123456")
    assert r.usuario.nreg == 7
