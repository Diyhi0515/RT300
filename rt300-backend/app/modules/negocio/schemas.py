from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from ...core.respuesta import Salida

MAXIMO_NOMBRE = 60


class NombreNegocioIn(BaseModel):
    nombre: str = Field(max_length=MAXIMO_NOMBRE, description="Vacío = usar el nombre de la base")

    @field_validator("nombre")
    @classmethod
    def sin_caracteres_de_control(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor.isprintable():
            raise ValueError("El nombre tiene caracteres no permitidos.")
        return valor


class NegocioOut(Salida):
    nombre: str | None = None


class AjusteNombreOut(Salida):
    nombre: str | None = None
    nombre_base: str | None = None
    personalizado: bool
