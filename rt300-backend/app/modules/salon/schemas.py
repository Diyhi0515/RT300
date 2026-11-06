from pydantic import BaseModel, Field


class OcuparMesaIn(BaseModel):
    cven: int = Field(description="Código del mesero (gbage)")
    caco: int = Field(description="Área de consumo")
    ccom: int = Field(ge=0, le=999, description="Cantidad de comensales")
    ncta: int = Field(ge=1, le=50, description="Cantidad de cuentas")


class ModificarMesaIn(BaseModel):
    cven: int
    ccom: int = Field(ge=0, le=999)
    ncta: int = Field(ge=1, le=50)
