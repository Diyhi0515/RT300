"""Caso de uso del administrador: subir la imagen de un producto y vincularla (rtalb.rtalbnimg) solo si está vacía."""
from __future__ import annotations

from collections.abc import Callable
from typing import Protocol

from ...core.acceso import exigir_rol
from ...core.errors import Conflict, NotFound, ServicioNoDisponible, ValidationFailed
from ...domain.uow import UnitOfWork
from ...domain.usuario import Usuario
from .almacen_imagenes import AlmacenImagenes, ImagenInvalida, nombre_para


class RepoImagenes(Protocol):
    def existe_plato(self, cart: str) -> bool: ...
    def nombre_imagen(self, cart: str) -> str | None: ...
    def vincular_imagen_si_vacia(self, cart: str, nombre: str) -> int: ...


class ImagenesPlatosService:
    def __init__(self, repo: RepoImagenes, uow: UnitOfWork, almacen: AlmacenImagenes, invalidar_cache: Callable[[], None]):
        self._repo, self._uow, self._almacen, self._invalidar = repo, uow, almacen, invalidar_cache

    def asignar(self, u: Usuario, cart: str, contenido: bytes) -> dict:
        """Guarda la imagen y la vincula. Si el producto ya tiene una imagen que existe, no se cambia (409).

        Si la base ya trae un nombre pero ese archivo no existe, se repone con ese mismo nombre y no se toca la base."""
        exigir_rol(u, "admin")
        cart = cart.strip()
        with self._uow:
            if not self._repo.existe_plato(cart):
                raise NotFound(f"El articulo: {cart} no existe en alimentos y bebidas.", "PLATO_NO_EXISTE")
            actual = (self._repo.nombre_imagen(cart) or "").strip()
            if actual and self._almacen.existe(actual):
                raise Conflict("El producto ya tiene una imagen.", "YA_TIENE_IMAGEN")
            nombre = actual or nombre_para(cart)
            self._guardar(contenido, nombre)
            if not actual and self._repo.vincular_imagen_si_vacia(cart, nombre) == 0:
                raise Conflict("Otro usuario le asignó una imagen al producto hace un momento.", "YA_TIENE_IMAGEN")
        self._invalidar()
        return {"cart": cart, "imagen": nombre}

    def _guardar(self, contenido: bytes, nombre: str) -> None:
        try:
            self._almacen.guardar(contenido, nombre)
        except ImagenInvalida as error:
            raise ValidationFailed(error.motivo, error.codigo) from error
        except OSError as error:
            raise ServicioNoDisponible("No se pudo guardar la imagen en el servidor.", "IMAGEN_NO_SE_PUDO_GUARDAR") from error
