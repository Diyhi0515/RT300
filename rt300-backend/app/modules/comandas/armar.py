"""Caso de uso: armar y enviar una comanda a partir de lo que elige el garzón.

En el sistema antiguo el navegador calculaba precios, centro de producción, insumos y textos, y el servidor confiaba en lo
recibido (se podía alterar un precio). Aquí el cliente solo *elige* (plato, cantidad, extras, textos, centro alterno, insumos
a quitar o reemplazar) y el servidor lo valida contra el catálogo y genera todas las filas de `rttmp`.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from ...core.acceso import exigir_local
from ...core.errors import NotFound, ValidationFailed
from ...domain.usuario import Usuario
from .ajustes import aplicar_ajustes
from .insumos import insumos_del_plato
from .ports import CatalogoPlatos, ComandasRepo, ExtraFicha, FichaComanda, GuardarComanda, ParametrosComanda
from .schemas import (
    ComponenteInsumo,
    DetalleComanda,
    EnviarComandaIn,
    ExtraIn,
    GuardarComandaIn,
    InsumoItem,
    ItemEnviarIn,
    TextoComanda,
    TextoItem,
    TextoRef,
)


@dataclass
class _Comanda:
    """Filas acumuladas de la comanda; `siguiente()` numera las líneas (platos y extras) en orden."""

    rtcda: list[DetalleComanda] = field(default_factory=list)
    rttac: list[TextoItem] = field(default_factory=list)
    rtcia: list[InsumoItem] = field(default_factory=list)
    rtcic: list[ComponenteInsumo] = field(default_factory=list)
    _numero: int = 0

    def siguiente(self) -> int:
        self._numero += 1
        return self._numero


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
        comanda = _Comanda()
        for item in b.items:
            if item.cart not in fichas:
                fichas[item.cart] = self._catalogo.ficha(u, item.cart, ctx, par.cpxc)
            self._agregar_plato(u, item, fichas[item.cart], par, comanda)

        return self._guardar.guardar(
            u,
            GuardarComandaIn(nfol=nfol, ncta=ncta, glos=b.glos, rtcda=comanda.rtcda, rttac=comanda.rttac,
                             rttco=self._textos_de_comanda(b.textos), rtcia=comanda.rtcia, rtcic=comanda.rtcic),
        )

    # ───────────── Un plato y sus complementos ─────────────
    def _agregar_plato(self, u: Usuario, it: ItemEnviarIn, ficha: FichaComanda, par: ParametrosComanda, c: _Comanda) -> None:
        numero = c.siguiente()
        ccpd = self._centro(u, it, ficha)
        c.rtcda.append(self._linea(u, numero, it.cant, ficha, par, ccpd, glos=it.glos, padre=0))
        insumos, componentes = insumos_del_plato(numero, it.cant, ficha, par, ficha.ccpd)   # los insumos siguen al centro del local
        insumos, componentes = aplicar_ajustes(numero, insumos, componentes, it.insumos, self._catalogo.alternativos)
        c.rtcia += insumos
        c.rtcic += componentes
        c.rttac += self._textos_del_plato(numero, ficha.cart, it.textos)
        self._agregar_extras(u, it.extras, ficha, numero, par, c)

    def _agregar_extras(
        self, u: Usuario, pedidos: list[ExtraIn], ficha: FichaComanda, padre: int, par: ParametrosComanda, c: _Comanda
    ) -> None:
        if not pedidos:
            return
        disponibles = self._catalogo.extras_del_plato(ficha.csme, ficha.cssm)
        for pedido in pedidos:
            extra = self._extra_valido(pedido.cart, ficha.cart, disponibles)
            ficha_extra = self._catalogo.ficha_extra(u, extra, par.cpxc)
            numero = c.siguiente()
            c.rtcda.append(self._linea(u, numero, pedido.cant, ficha_extra, par, ficha_extra.ccpd, glos="", padre=padre))
            insumos, componentes = insumos_del_plato(numero, pedido.cant, ficha_extra, par, ficha_extra.ccpd)
            c.rtcia += insumos
            c.rtcic += componentes

    @staticmethod
    def _extra_valido(cart: str, plato: str, disponibles: dict[str, ExtraFicha]) -> ExtraFicha:
        if cart not in disponibles:
            raise ValidationFailed(f"{cart} no es un extra disponible para {plato}.", "EXTRA_INVALIDO")
        return disponibles[cart]

    # ───────────── Validaciones contra el catálogo ─────────────
    def _centro(self, u: Usuario, it: ItemEnviarIn, ficha: FichaComanda) -> int:
        if it.ccpd is None or it.ccpd == ficha.ccpd:
            return ficha.ccpd
        if it.ccpd not in self._catalogo.centros_de_produccion(u, ficha.cart):
            raise ValidationFailed(f"El centro de producción {it.ccpd} no es válido para {ficha.cart}.", "CENTRO_INVALIDO")
        return it.ccpd

    def _textos_del_plato(self, numero: int, cart: str, refs: list[TextoRef]) -> list[TextoItem]:
        if not refs:
            return []
        validos = self._catalogo.textos_del_plato(cart)
        self._exigir_textos(refs, validos, f"del plato {cart}")
        return [TextoItem(rttacitem=numero, rttaccart=cart, rttacpref=r.pref, rttaccorr=r.corr, rttactext=validos[(r.pref, r.corr)])
                for r in refs]

    def _textos_de_comanda(self, refs: list[TextoRef]) -> list[TextoComanda]:
        if not refs:
            return []
        self._exigir_textos(refs, self._catalogo.textos_de_comanda(), "de la comanda")
        return [TextoComanda(rttcopref=r.pref, rttcocorr=r.corr) for r in refs]

    @staticmethod
    def _exigir_textos(refs: list[TextoRef], validos: dict[tuple[int, int], str], de_que: str) -> None:
        for r in refs:
            if (r.pref, r.corr) not in validos:
                raise ValidationFailed(f"El texto {r.pref}/{r.corr} no es {de_que}.", "TEXTO_INVALIDO")

    # ───────────── Filas ─────────────
    @staticmethod
    def _linea(
        u: Usuario, numero: int, cant: int, f: FichaComanda, par: ParametrosComanda, ccpd: int, glos: str, padre: int
    ) -> DetalleComanda:
        return DetalleComanda(cart=f.cart, desc=f.descripcion, cant=cant, pvta=f.pvta, item=numero,
                              impt=round(cant * f.pvta, 2), tcam=par.tcam, glos=glos or None, cmon=u.cmon, ccpd=ccpd,
                              iteo=padre, tipo="P" if padre == 0 else "E")
