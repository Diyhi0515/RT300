"""Cálculo de los insumos de un plato (filas de `rttmp` tipo 4 y 5) con la aritmética del sistema antiguo.

Cantidad total de un insumo = producto + merma, redondeadas a los decimales de inventario (verificado con datos reales).
"""
from __future__ import annotations

from ...core.errors import DomainError
from .ports import FichaComanda, ParametrosComanda
from .schemas import ComponenteInsumo, InsumoItem


def _cantidades(base: float, cantidad: float, merma_pct: float, decimales: int) -> tuple[float, float, float]:
    """(producto, merma, total) redondeados a los decimales de inventario."""
    producto = cantidad / base
    merma = producto / 100 * merma_pct
    p, m = round(producto, decimales), round(merma, decimales)
    return p, m, round(p + m, decimales)


def insumos_del_plato(
    numero: int, cant: int, ficha: FichaComanda, par: ParametrosComanda, ccpd: int
) -> tuple[list[InsumoItem], list[ComponenteInsumo]]:
    """Filas de insumos y de componentes de `cant` unidades del plato en la línea `numero`."""
    if ficha.insumos and ficha.cbas <= 0:
        raise DomainError(f"El plato {ficha.cart} no tiene cantidad base definida para sus insumos.", "PLATO_SIN_BASE")
    insumos: list[InsumoItem] = []
    componentes: list[ComponenteInsumo] = []
    for ins in ficha.insumos:
        producto, merma, total = _cantidades(ficha.cbas, ins.cantidad * cant, ins.merma_pct, par.decimales)
        insumos.append(
            InsumoItem(rtciancom=0, rtciaitem=numero, rtciacart=ficha.cart, rtciacins=ins.cins, rtciacant=total,
                       rtciamdcg=ins.mdcg, rtciaccpd=ccpd, rtciadesc=ins.descripcion, cinsorigen=ins.cins,
                       descorigen=ins.descripcion, quitado="N", rtciacost=0, rtciacanp=producto, rtciacanm=merma,
                       rtciaoimp=ins.oimp)
        )
        for comp in (c for c in ficha.componentes if c.padre == ins.cins):
            if comp.cbas <= 0:
                raise DomainError(f"El insumo {comp.padre} no tiene cantidad base definida.", "INSUMO_SIN_BASE")
            cp, cm, ct = _cantidades(comp.cbas, comp.cantidad * total, comp.merma_pct, par.decimales)
            componentes.append(
                ComponenteInsumo(rtcicncom=0, rtcicitem=numero, rtciccart=ficha.cart, rtciccins=ins.cins,
                                 rtciccinc=comp.cins, rtciccant=ct, rtcicmdcg=comp.mdcg, rtcicoimp=comp.oimp,
                                 rtcicdesc=comp.descripcion, cincorigen=comp.cins, descorigen=comp.descripcion,
                                 quitado="N", rtciccost=0, rtciccanp=cp, rtciccanm=cm)
            )
    return insumos, componentes
