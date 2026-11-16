from pydantic import BaseModel, Field

from ...core.respuesta import Salida


class ActualizarCuentaIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)
    cage: int = Field(ge=0, description="Código de cliente en la agenda")
    nruc: str = Field(default="", max_length=20)
    nomb: str = Field(default="", max_length=80)


class EliminarCuentaIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)


class EliminarCuentasIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)
    cuentas: list[int] = Field(min_length=1, max_length=200)


# ───────────── Salida ─────────────
class CompactarCuentasIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)


class RenumeracionOut(Salida):
    antes: int
    despues: int


class CuentaNumeradaOut(Salida):
    ncta: int
    nombre: str | None = None
    liquidada: bool


class CuentasEliminadasOut(Salida):
    eliminadas: list[int]
    quedan: int
    renumeradas: list[RenumeracionOut]
    consecutivas: bool          # false si alguna cuenta con comandas, notas o liquidada impide cerrar todos los huecos
    cuentas: list[CuentaNumeradaOut]

class CuentaClienteOut(Salida):
    nfol: int
    ncta: int
    nombre: str | None = None
    nruc: str | int | None = None
    ndid: str | int | None = None
    cage: int | str | None = None
    cliente: str


class CuentasClienteOut(Salida):
    cuentas: list[CuentaClienteOut]


class ClienteOut(Salida):
    codigo: int
    nombre: str | None = None
    nruc: str | int | None = None


class ClientesOut(Salida):
    clientes: list[ClienteOut]


class ClienteDetalleOut(ClienteOut):
    ndid: str | int | None = None
    lpre: int | None = None   # lista de precio del cliente (la usa la toma de pedido)


class ClientesDetalleOut(Salida):
    clientes: list[ClienteDetalleOut]
