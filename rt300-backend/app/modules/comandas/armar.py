"""Caso de uso: armar y enviar una comanda a partir de lo que elige el garzón (plato y cantidad).

En el sistema antiguo el navegador calculaba precios, centro de producción e insumos y el servidor confiaba en lo recibido
(se podía alterar un precio). Aquí el cliente solo envía `cart` y `cant`: el servidor toma el precio de la base con la lista
de la cuenta, resuelve el centro de producción y genera las filas de insumos de `rttmp` con la misma aritmética que
muestran los datos reales (cantidad total = producto + merma).
"""
from __future__ import annotations

from ...core.acceso import exigir_local
from ...core.errors import DomainError, NotFound
from ...domain.usuario import Usuario
from .ports import CatalogoPlatos, ComandasRepo, FichaComanda, GuardarComanda, ParametrosComanda
from .schemas import (
    ComponenteInsumo,
    DetalleComanda,
    EnviarComandaIn,
    GuardarComandaIn,
    InsumoItem,
    ItemEnviarIn,
)


def _cantidades(base: float, cantidad: float, merma_pct: float, decimales: int) -> tuple[float, float, float]:
    """(producto, merma, total) redondeados a los decimales de inventario."""
    producto = cantidad / base
    merma = producto / 100 * merma_pct
    p, m = round(producto, decimales), round(merma, decimales)
    return p, m, round(p + m, decimales)


class ArmarComandaService:
    def __init__(self, repo: ComandasRepo, catalogo: CatalogoPlatos, guardar: GuardarComanda):
        self._repo, self._catalogo, self._guardar = repo, catalogo, guardar

    def enviar(self, u: Usuario, nfol: int, ncta: int, b: EnviarComandaIn) -> dict:
        exigir_local(u, self._repo.local_de_folio(nfol))
        if not self._repo.cuenta_abierta(nfol, ncta):
            raise NotFound(f"No se encontro la Cta.: {ncta} abierta en el Folio: {nfol}", "CUENTA_NO_ABIERTA")

        ctx = self._repo.contexto_precios(nfol, ncta, u.cloc)
        par = self._repo.parametros_comanda()
        fichas: dict[str, FichaComanda] = {}
        rtcda: list[DetalleComanda] = []
        rtcia: list[InsumoItem] = []
        rtcic: list[ComponenteInsumo] = []

        for numero, it in enumerate(b.items, start=1):
            if it.cart not in fichas:
                fichas[it.cart] = self._catalogo.ficha(u, it.cart, ctx, par.cpxc)
            ficha = fichas[it.cart]
            rtcda.append(self._linea(u, numero, it, ficha, par))
            insumos, componentes = self._insumos(numero, it.cant, ficha, par)
            rtcia += insumos
            rtcic += componentes

        return self._guardar.guardar(u, GuardarComandaIn(nfol=nfol, ncta=ncta, glos=b.glos, rtcda=rtcda, rtcia=rtcia, rtcic=rtcic))

    @staticmethod
    def _linea(u: Usuario, numero: int, it: ItemEnviarIn, f: FichaComanda, par: ParametrosComanda) -> DetalleComanda:
        return DetalleComanda(cart=f.cart, desc=f.descripcion, cant=it.cant, pvta=f.pvta, item=numero,
                              impt=round(it.cant * f.pvta, 2), tcam=par.tcam, glos=it.glos or None, cmon=u.cmon,
                              ccpd=f.ccpd, iteo=0, tipo="P")

    @staticmethod
    def _insumos(numero: int, cant: int, f: FichaComanda, par: ParametrosComanda) -> tuple[list[InsumoItem], list[ComponenteInsumo]]:
        if f.insumos and f.cbas <= 0:
            raise DomainError(f"El plato {f.cart} no tiene cantidad base definida para sus insumos.", "PLATO_SIN_BASE")
        insumos: list[InsumoItem] = []
        componentes: list[ComponenteInsumo] = []
        for ins in f.insumos:
            producto, merma, total = _cantidades(f.cbas, ins.cantidad * cant, ins.merma_pct, par.decimales)
            insumos.append(InsumoItem(rtciancom=0, rtciaitem=numero, rtciacart=f.cart, rtciacins=ins.cins, rtciacant=total,
                                      rtciamdcg=ins.mdcg, rtciaccpd=f.ccpd, rtciadesc=ins.descripcion, cinsorigen=ins.cins,
                                      descorigen=ins.descripcion, quitado="N", rtciacost=0, rtciacanp=producto,
                                      rtciacanm=merma, rtciaoimp=ins.oimp))
            for comp in (c for c in f.componentes if c.padre == ins.cins):
                if comp.cbas <= 0:
                    raise DomainError(f"El insumo {comp.padre} no tiene cantidad base definida.", "INSUMO_SIN_BASE")
                cp, cm, ct = _cantidades(comp.cbas, comp.cantidad * total, comp.merma_pct, par.decimales)
                componentes.append(ComponenteInsumo(rtcicncom=0, rtcicitem=numero, rtciccart=f.cart, rtciccins=ins.cins,
                                                    rtciccinc=comp.cins, rtciccant=ct, rtcicmdcg=comp.mdcg, rtcicoimp=comp.oimp,
                                                    rtcicdesc=comp.descripcion, cincorigen=comp.cins,
                                                    descorigen=comp.descripcion, quitado="N", rtciccost=0,
                                                    rtciccanp=cp, rtciccanm=cm))
        return insumos, componentes
