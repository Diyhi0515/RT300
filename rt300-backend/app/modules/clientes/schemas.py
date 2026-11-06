from pydantic import BaseModel, Field


class ActualizarCuentaIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)
    cage: int = Field(ge=0, description="Código de cliente en la agenda")
    nruc: str = Field(default="", max_length=20)
    nomb: str = Field(default="", max_length=80)
