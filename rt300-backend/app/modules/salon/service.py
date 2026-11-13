"""Casos de uso del salón. Sin Flask ni SQL: dependen del puerto `SalonRepo` y de una `UnitOfWork`."""
from __future__ import annotations

from ...core.acceso import exigir_local
from ...core.errors import Conflict, DomainError, Forbidden, NotFound, ValidationFailed
from ...domain.mesa import ESTC_LIQUIDADA, Mesa
from ...domain.uow import UnitOfWork
from ...domain.usuario import Usuario
from .ports import Cliente, NuevaCuenta, SalonRepo


class SalonService:
    def __init__(self, repo: SalonRepo, uow: UnitOfWork):
        self._repo, self._uow = repo, uow

    # ───────────── Utilidades internas ─────────────
    def _fecha_negocio(self) -> tuple[str, str, str]:
        """(fdia ISO, hora HH:MM:SS, hent HH:MM) a partir de la fecha de trabajo del negocio."""
        fdia = self._repo.parametros().fdia
        if fdia is None:
            raise DomainError("NO EXISTE PARAMETROS INICALES", "SIN_PARAMETROS")
        return fdia.strftime("%Y-%m-%dT%H:%M:%S"), fdia.strftime("%H:%M:%S"), fdia.strftime("%H:%M")

    def _mesa_operable(self, codigo: str) -> Mesa:
        m = self._repo.mesa(codigo)
        if m is None:
            raise NotFound("NO EXISTE MESA", "MESA_NO_EXISTE")
        if m.eliminada:
            raise Conflict(f"La Mesa '{codigo}' fue eliminada.", "MESA_ELIMINADA")
        if m.deshabilitada:
            raise Conflict(f"La Mesa '{codigo}' esta deshabilitada.", "MESA_DESHABILITADA")
        return m

    def _cliente_varios(self) -> Cliente:
        codigo = self._repo.parametros().cliente_varios
        if not codigo:
            raise DomainError("NO SE HA PARAMETRIZADO CLIENTE VARIOS", "SIN_CLIENTE_VARIOS")
        cli = self._repo.cliente(codigo)
        if cli is None:
            raise NotFound("NO EXISTE CLIENTE VARIOS.", "CLIENTE_VARIOS_NO_EXISTE")
        return cli

    @staticmethod
    def _cuentas(nfol: int, desde: int, hasta: int, cli: Cliente, cmon: int, fdia: str, hent: str) -> list[NuevaCuenta]:
        return [NuevaCuenta(nfol, n, cli, cmon, fdia, hent) for n in range(desde, hasta + 1)]

    # ───────────── Consultas ─────────────
    def parametros_iniciales(self, u: Usuario) -> dict:
        """Todo lo que necesita la pantalla de mesas al abrir (f4100_cargar_parametros_iniciales_rt300a)."""
        p = self._repo.parametros()
        if p.inctl is None:
            raise DomainError("Falta definir parametros de inventario.", "SIN_INCTL")
        if not p.decimales_definidos:
            raise DomainError("Debe definir la cantidad de decimales parametros de Inventario.", "SIN_DECIMALES")
        if p.rtctl is None:
            raise DomainError("Falta definir parametros de control para restaurant.", "SIN_RTCTL")
        moneda, local = self._repo.moneda(u.cmon), self._repo.local(u.cloc)
        if moneda is None:
            raise DomainError("Falta definir parametros de control para restaurant.", "SIN_MONEDA")
        if local is None:
            raise NotFound(f"NO EXISTE Local: {u.cloc}", "LOCAL_NO_EXISTE")
        asignada = self._repo.area_asignada(u.usuario)
        if asignada is None:
            raise DomainError(f"Usuario no esta definido para pedidos. {u.usuario}", "USUARIO_NO_PEDIDOS")

        areas = self._repo.areas(u.calm, u.cloc)
        # área 0 = "sin área asignada": se usa la primera del local
        caco = asignada or (int(areas[0]["codigo"]) if areas else 0)
        return {
            "caco": caco or None,
            "areas": areas,
            "mesas": self._repo.mesas_por_area(caco) if caco else [],
            "meseros": self._repo.meseros(),
            "local": local,
            "moneda": moneda,
            "decimales": p.decimales,
        }

    def mesas_del_local(self, u: Usuario) -> list[dict]:
        return self._repo.mesas_del_local(u.cloc)

    def detalle_folio(self, u: Usuario, nfol: int) -> dict:
        """Cuentas del folio con sus líneas de consumo (2 consultas, sin una por cuenta)."""
        exigir_local(u, self._repo.local_de_folio(nfol))
        lineas: dict[int, list[dict]] = {}
        for linea in self._repo.consumo_por_cuenta(nfol):
            lineas.setdefault(int(linea.pop("ncta")), []).append(linea)
        cuentas = self._repo.cuentas_con_cliente(nfol)
        for c in cuentas:
            c["lineas"] = lineas.get(int(c["ncta"]), [])
        return {"cuentas": cuentas}

    def mesas_de_area(self, u: Usuario, caco: int) -> list[dict]:
        exigir_local(u, self._repo.local_de_area(caco))
        return self._repo.mesas_por_area(caco)

    def detalle_mesa(self, u: Usuario, codigo: str) -> dict:
        """Click en mesa: mesa, folio, mesero, horas, resumen de consumo y cuentas."""
        exigir_local(u, self._repo.local_de_mesa(codigo))
        raw = self._repo.mesa_detalle(codigo)
        m = self._repo.mesa(codigo)
        if raw is None or m is None:
            raise NotFound(f"NO EXISTE MESA: {codigo}", "MESA_NO_EXISTE")
        out: dict = {"mesa": raw, "folio": m.folio, "hora": "", "mesero": "", "resumen": [], "cuentas": []}
        if m.folio:
            f = self._repo.folio_con_mesero(m.folio)
            if f is None:
                raise NotFound(f"NO EXISTE FOLIO: {m.folio}", "FOLIO_NO_EXISTE")
            if not f.mesero_nombre:
                raise NotFound(f"NO EXISTE VENDEDOR: {f.cven} en la agenda.", "MESERO_NO_EXISTE")
            hora = f"Ap: {f.hora_apertura}"
            ultima = self._repo.hora_ultima_comanda(m.folio)
            out.update(mesero=f.mesero_nombre, hora=f"{hora} Ult.comanda : {ultima}" if ultima else hora,
                       resumen=self._repo.resumen(m.folio, codigo))
        out["cuentas"] = self._repo.cuentas_folio(m.folio)
        return out

    def datos_modificacion(self, u: Usuario, nfol: int) -> dict:
        exigir_local(u, self._repo.local_de_folio(nfol))
        f = self._repo.folio_abierto_tipo1(nfol)
        if f is None:
            raise NotFound(f"NO EXISTE FOLIO: {nfol}", "FOLIO_NO_EXISTE")
        return {"folio": f, "cuentas": self._repo.contar_cuentas(nfol)}

    def resumen_folio(self, u: Usuario, nfol: int) -> list[dict]:
        exigir_local(u, self._repo.local_de_folio(nfol))
        return self._repo.resumen(nfol)

    def cuentas_folio(self, u: Usuario, nfol: int) -> list[dict]:
        exigir_local(u, self._repo.local_de_folio(nfol))
        return self._repo.cuentas_folio(nfol)

    # ───────────── Escrituras (una unidad de trabajo cada una) ─────────────
    def _mesero_a_asignar(self, u: Usuario, cven: int | None) -> int | None:
        """En el sistema antiguo la lista de meseros solo se habilitaba a quien tenía caja (adusrcaja); los demás atendían con
        su propio mesero. El PHP no lo comprobaba (solo el navegador): aquí se exige en el servidor, y el mesero debe existir."""
        if not cven or cven == u.cven:
            return cven
        if not u.caja:
            raise Forbidden("Solo un usuario con caja puede asignar otro mesero.", "SIN_PERMISO_MESERO")
        if not self._repo.es_vendedor(cven):
            raise NotFound(f"NO EXISTE VENDEDOR: {cven} en la agenda.", "MESERO_NO_EXISTE")
        return cven

    @staticmethod
    def _validar_cuentas(ccom: int, ncta: int) -> None:
        """Regla del sistema antiguo (RT300a.js): no puede haber más cuentas que comensales, al ocupar y al modificar."""
        if ccom < 1:
            raise ValidationFailed("Indique la cantidad de comensales.", "COMENSALES_INVALIDOS")
        if ncta > ccom:
            raise ValidationFailed(
                "El número de cuentas no puede ser mayor que el número de comensales.", "CUENTAS_MAYOR_COMENSALES"
            )

    def ocupar_mesa(self, u: Usuario, codigo: str, cven: int | None, caco: int, ccom: int, ncta: int) -> dict:
        exigir_local(u, self._repo.local_de_mesa(codigo))
        cven = self._mesero_a_asignar(u, cven) or u.cven
        if not cven:
            raise DomainError("El usuario no tiene mesero asignado.", "SIN_MESERO")
        self._validar_cuentas(ccom, ncta)
        with self._uow:
            self._mesa_operable(codigo)
            cli = self._cliente_varios()
            fdia, hora, hent = self._fecha_negocio()

            # Toma atómica: si otro garzón ocupó la mesa entre la lectura y aquí, no se actualiza ninguna fila.
            if not self._repo.tomar_mesa(codigo):
                actual = self._repo.mesa(codigo)
                if actual is not None and actual.en_union:
                    raise Conflict(f"La Mesa '{codigo}' en proceso de Union.", "MESA_EN_UNION")
                raise Conflict(f"La Mesa '{codigo}' ya esta ocupada.", "MESA_OCUPADA")

            nfol = self._repo.siguiente_folio()
            self._repo.insertar_folio(nfol=nfol, fdia=fdia, caco=caco, mesa=codigo.strip(), ccom=ccom, calm=u.calm,
                                      cloc=u.cloc, nreg=u.nreg, cven=cven, usrn=u.usuario, hora=hora)
            self._repo.insertar_cuentas(self._cuentas(nfol, 1, ncta, cli, u.cmon, fdia, hent))
            self._repo.asignar_folio_a_mesa(codigo, nfol)
        return {"folio": nfol, "cuentas": ncta}

    def habilitar_mesa(self, u: Usuario, codigo: str) -> dict:
        exigir_local(u, self._repo.local_de_mesa(codigo))
        with self._uow:
            m = self._mesa_operable(codigo)
            if m.folio and self._repo.contar_comandas(m.folio) > 0:
                raise Conflict(f"La Mesa '{codigo}' esta ocupada... No se puede habilitar.", "MESA_CON_COMANDAS")
            fdia, hora, _ = self._fecha_negocio()

            self._repo.liberar_mesa(codigo)
            if m.folio:
                if ESTC_LIQUIDADA in self._repo.estados_de_cuentas(m.folio):  # hay cuentas liquidadas: se cierra el folio
                    self._repo.cerrar_folio_liquidado(m.folio, u.usuario, fdia)
                else:
                    self._repo.anular_folio(m.folio, u.usuario, fdia, hora)
        return {"mesa": codigo, "folio_anulado": m.folio or None}

    def modificar_mesa(self, u: Usuario, nfol: int, cven: int | None, ccom: int, ncta_nueva: int) -> list[dict]:
        exigir_local(u, self._repo.local_de_folio(nfol))
        cven = self._mesero_a_asignar(u, cven)
        self._validar_cuentas(ccom, ncta_nueva)
        with self._uow:
            ncta_vieja = self._repo.contar_cuentas(nfol)
            if ncta_nueva < ncta_vieja and self._repo.contar_comandas(nfol, solo_vigentes=False) > 0:
                raise Conflict("No se puede quitar cuentas, existen comandas asignadas.", "CUENTAS_CON_COMANDAS")
            if max(self._repo.maxima_cuenta_con_nota(nfol), 1) > ncta_nueva:
                raise Conflict("No se puede quitar cuentas, Existen Notas de Ventas asociadas al folio.", "CUENTAS_CON_NOTA")
            fdia, hora, hent = self._fecha_negocio()

            self._repo.actualizar_folio(nfol, ccom, cven, u.usuario, hora, fdia)
            if ncta_nueva <= ncta_vieja:
                self._repo.borrar_cuentas_sobrantes(nfol, ncta_nueva)
            else:
                self._repo.insertar_cuentas(self._cuentas(nfol, ncta_vieja + 1, ncta_nueva, self._cliente_varios(), u.cmon, fdia, hent))
        return self._repo.cuentas_folio(nfol)
