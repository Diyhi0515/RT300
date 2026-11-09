"""Contratos de auth: datos de dominio y el puerto que el servicio necesita del almacenamiento."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Credencial:
    """Usuario del sistema (adusr)."""

    usuario: str
    nombre: str
    clave_guardada: str
    deshabilitado: bool
    cloc: int | None
    calm: int | None
    cven: str          # código de mesero en la agenda


@dataclass(frozen=True)
class AccesoPedidos:
    """Habilitación del usuario para pedidos (rturt)."""

    tipo_pedido_inicial: str
    nreg: int


class AuthRepo(Protocol):
    def usuarios_de_pedidos(self) -> list[dict]: ...
    def credencial(self, usuario: str) -> Credencial | None: ...
    def acceso_pedidos(self, usuario: str) -> AccesoPedidos | None: ...
    def moneda_de_venta(self) -> int | None: ...          # None = no hay reglas de negocio
    def mesero_deshabilitado(self, cven: str) -> bool | None: ...   # None = no existe en la agenda
    def hay_parametros_restaurant(self) -> bool: ...
    def nombre_local(self, cloc: int) -> str: ...
