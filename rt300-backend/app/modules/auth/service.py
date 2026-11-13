"""Casos de uso de autenticación. Mismas validaciones que `f5000_iniciar_session` del PHP, sin revelar
qué usuarios existen (un solo mensaje para usuario/clave inválidos)."""
from __future__ import annotations

from dataclasses import dataclass

from ...core.errors import Unauthorized
from ...core.legacy_password import verificar
from ...core.text import to_int
from ...domain.usuario import Usuario
from .ports import AuthRepo


@dataclass(frozen=True)
class ResultadoLogin:
    usuario: Usuario
    local: str   # nombre del local (vtloc), para mostrar en pantalla


class PoliticaRoles:
    """Decide el rol de un usuario. Hoy por configuración; sustituible cuando se defina el mapeo real
    (docs/00 §8 #5) sin tocar el servicio."""

    def __init__(self, admins: tuple[str, ...] = (), cajeros: tuple[str, ...] = ()):
        self._admins, self._cajeros = set(admins), set(cajeros)

    def rol_de(self, usuario: str) -> str:
        if usuario in self._admins:
            return "admin"
        if usuario in self._cajeros:
            return "cajero"
        return "garzon"


class AuthService:
    def __init__(self, repo: AuthRepo, roles: PoliticaRoles):
        self._repo, self._roles = repo, roles

    def listar_usuarios(self) -> list[dict]:
        return self._repo.usuarios_de_pedidos()

    def login(self, usuario: str, clave: str) -> ResultadoLogin:
        usuario = usuario.strip().upper()
        cred = self._repo.credencial(usuario)
        acceso = self._repo.acceso_pedidos(usuario)
        guardada = cred.clave_guardada if cred else ""
        # Mismo trabajo y mismo mensaje en todos los casos de fallo: no se filtra qué usuarios existen.
        clave_ok = verificar(clave, guardada or "0")
        if not (cred and acceso and guardada and clave_ok):
            raise Unauthorized("Usuario o contraseña incorrectos.", "CREDENCIALES_INVALIDAS")

        if cred.deshabilitado:
            raise Unauthorized("Usuario deshabilitado.", "USUARIO_DESHABILITADO")
        if cred.cloc is None:
            raise Unauthorized("Usuario no tiene definido local, no se puede encontrar registradora.", "SIN_LOCAL")
        cmon = self._repo.moneda_de_venta()
        if cmon is None:
            raise Unauthorized("Falta definir reglas del negocio.", "SIN_REGLAS")
        if not cred.cven:
            raise Unauthorized(f"Usuario '{usuario}' no tiene asignado Mesero", "SIN_MESERO")
        deshabilitado = self._repo.mesero_deshabilitado(cred.cven)
        if deshabilitado is None:
            raise Unauthorized("Mesero no existe en la agenda.", "MESERO_NO_EXISTE")
        if deshabilitado:
            raise Unauthorized("Mesero deshabilitado en la agenda.", "MESERO_DESHABILITADO")
        if cred.calm is None:
            raise Unauthorized(f"Falta definir almacen para el usuario '{usuario}'", "SIN_ALMACEN")
        if not self._repo.hay_parametros_restaurant():
            raise Unauthorized("Falta definir parametros de control para Restaurant.", "SIN_RTCTL")
        if not acceso.tipo_pedido_inicial:
            raise Unauthorized("Falta Definir tipo de pedido inicial.", "SIN_TIPO_PEDIDO")

        sesion = Usuario(usuario=usuario, nombre=cred.nombre, cloc=cred.cloc, calm=cred.calm, cmon=cmon,
                         nreg=self._repo.registradora(usuario, cred.cloc, acceso.nreg), rol=self._roles.rol_de(usuario),
                         cven=to_int(cred.cven, 0) or 0, caja=cred.caja)
        return ResultadoLogin(sesion, self._repo.nombre_local(cred.cloc))
