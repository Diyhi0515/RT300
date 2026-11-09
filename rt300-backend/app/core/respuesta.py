"""Respuestas tipadas: cada endpoint declara un modelo de salida (el contrato con el frontend).

- Solo salen los campos declarados: una columna nueva o sensible de la base legacy no se filtra por accidente.
- Se conservan exactamente las claves que entrega el servicio (`exclude_unset`), así que no aparecen `null` inventados.
- Los bloques que son filas legacy completas a propósito (`gbpmt`, `gbrne`, `local`, `moneda`…) se declaran `dict[str, Any]`.
"""
from __future__ import annotations

from typing import Any

from flask import Response, jsonify
from pydantic import BaseModel, ConfigDict


class Salida(BaseModel):
    model_config = ConfigDict(extra="ignore")


def responder(modelo: type[Salida], datos: Any, status: int = 200) -> tuple[Response, int]:
    cuerpo = modelo.model_validate(datos).model_dump(mode="json", exclude_unset=True)
    return jsonify(cuerpo), status
