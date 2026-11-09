"""Composition root: único lugar donde se eligen las implementaciones concretas y se inyectan.

Los routes piden aquí el servicio ya armado; los services solo conocen puertos (Protocol).
"""
from __future__ import annotations

from flask import current_app

from .core.db import SqlUnitOfWork, get_db
from .domain.uow import UnitOfWork
from .integrations.comandas.base import ComandasGateway
from .modules.auth.repository import SqlAuthRepository
from .modules.auth.service import AuthService, PoliticaRoles
from .modules.auth.tokens import EmisorTokens
from .modules.clientes.repository import SqlClientesRepository
from .modules.clientes.service import ClientesService
from .modules.comandas.administrar import AdministrarComandasService
from .modules.comandas.guardar import GuardarComandaService
from .modules.comandas.repository import SqlComandasRepository
from .modules.cuentas.repository import SqlCuentasRepository
from .modules.cuentas.service import CuentasService
from .modules.menu.repository import SqlMenuRepository
from .modules.menu.service import MenuService
from .modules.salon.repository import SqlSalonRepository
from .modules.salon.service import SalonService


def _uow() -> UnitOfWork:
    return SqlUnitOfWork(get_db())


def _gateway() -> ComandasGateway:
    return current_app.extensions["comandas_gateway"]


def auth_service() -> AuthService:
    cfg = current_app.config["APP_CONFIG"]
    return AuthService(SqlAuthRepository(get_db()), PoliticaRoles(cfg.admin_users, cfg.cajero_users))


def emisor_tokens() -> EmisorTokens:
    return EmisorTokens()


def salon_service() -> SalonService:
    return SalonService(SqlSalonRepository(get_db()), _uow())


def clientes_service() -> ClientesService:
    return ClientesService(SqlClientesRepository(get_db()), _uow())


def menu_service() -> MenuService:
    return MenuService(SqlMenuRepository(get_db()))


def guardar_comanda_service() -> GuardarComandaService:
    return GuardarComandaService(SqlComandasRepository(get_db()), _uow(), _gateway())


def administrar_comandas_service() -> AdministrarComandasService:
    return AdministrarComandasService(SqlComandasRepository(get_db()), _uow(), _gateway())


def cuentas_service() -> CuentasService:
    return CuentasService(SqlCuentasRepository(get_db()), _gateway())
