"""Cambios que el garzón hace sobre los insumos de un plato: quitar uno o reemplazarlo por un alternativo.

Reglas tomadas del sistema antiguo y comprobadas con filas reales de `rttmp`:
- Quitar: la fila del insumo se conserva con `quitado = 'S'` (cantidades sin cambio).
- Alternativo: la fila conserva el insumo y las cantidades originales (`cinsorigen`), pero pasa a llevar el código y la
  descripción del alternativo; los componentes del insumo original y los del alternativo quedan con cantidad 0 (el
  servicio de comandas los recalcula).
Función pura: no toca la base; el catálogo se pasa como una función.
"""
from __future__ import annotations

from collections.abc import Callable

from ...core.errors import ValidationFailed
from .ports import AlternativoFicha
from .schemas import AjusteInsumo, ComponenteInsumo, InsumoItem

CEROS = {"rtciccant": 0.0, "rtciccanp": 0.0, "rtciccanm": 0.0}


def aplicar_ajustes(
    numero: int,
    insumos: list[InsumoItem],
    componentes: list[ComponenteInsumo],
    ajustes: list[AjusteInsumo],
    alternativos_de: Callable[[str], list[AlternativoFicha]],
) -> tuple[list[InsumoItem], list[ComponenteInsumo]]:
    insumos, componentes = list(insumos), list(componentes)
    del_plato = {str(i.cinsorigen): n for n, i in enumerate(insumos)}
    vistos: set[str] = set()
    for ajuste in ajustes:
        if ajuste.cins in vistos:
            raise ValidationFailed(f"El insumo {ajuste.cins} se indicó más de una vez.", "INSUMO_REPETIDO")
        vistos.add(ajuste.cins)
        if ajuste.cins not in del_plato:
            raise ValidationFailed(f"El insumo {ajuste.cins} no es del plato.", "INSUMO_NO_ES_DEL_PLATO")
        posicion = del_plato[ajuste.cins]
        if ajuste.quitar:
            insumos[posicion] = insumos[posicion].model_copy(update={"quitado": "S"})
        else:
            componentes = _reemplazar(numero, insumos, componentes, posicion, ajuste, alternativos_de)
    return insumos, componentes


def _reemplazar(
    numero: int,
    insumos: list[InsumoItem],
    componentes: list[ComponenteInsumo],
    posicion: int,
    ajuste: AjusteInsumo,
    alternativos_de: Callable[[str], list[AlternativoFicha]],
) -> list[ComponenteInsumo]:
    elegido = next((a for a in alternativos_de(ajuste.cins) if a.cina == ajuste.alternativo), None)
    if elegido is None:
        raise ValidationFailed(f"{ajuste.alternativo} no es un alternativo de {ajuste.cins}.", "ALTERNATIVO_INVALIDO")
    original = insumos[posicion]
    insumos[posicion] = original.model_copy(update={"rtciacins": elegido.cina, "rtciadesc": elegido.descripcion})
    puestos_a_cero = [
        c.model_copy(update=CEROS) if c.rtciccins == ajuste.cins and c.rtcicitem == numero else c for c in componentes
    ]
    nuevos = [
        ComponenteInsumo(rtcicncom=0, rtcicitem=numero, rtciccart=original.rtciacart, rtciccins=elegido.cina,
                         rtciccinc=c.cins, rtciccant=0, rtcicmdcg=c.mdcg, rtcicoimp=c.oimp, rtcicdesc=c.descripcion,
                         cincorigen=c.cins, descorigen=c.descripcion, quitado="N", rtciccost=0, rtciccanp=0, rtciccanm=0)
        for c in elegido.componentes
    ]
    return puestos_a_cero + nuevos
