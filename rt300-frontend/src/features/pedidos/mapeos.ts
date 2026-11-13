import type { ClienteApi, CuentaApi, MesaApi } from './esquemas'
import type { AreaConsumo, ClienteRegistrado, Cuenta, MesaPlano, SeccionMenu } from './types'

const ESTADO_CUENTA_LIQUIDADA = 9

const aNumero = (valor: string | number | null | undefined) => {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

const aTexto = (valor: string | number | null | undefined) =>
  valor === null || valor === undefined ? '' : String(valor).trim()

export const mapearArea = (area: { codigo: number; descripcion?: string | null }): AreaConsumo => ({
  id: String(area.codigo),
  nombre: aTexto(area.descripcion) || `Área ${area.codigo}`,
})

export const mapearMesa = (mesa: MesaApi): MesaPlano => {
  const capacidad = mesa.capacidad && mesa.capacidad > 0 ? mesa.capacidad : 4
  const folio = mesa.folio ?? 0
  const apertura = mesa.apertura ? Date.parse(mesa.apertura) : Number.NaN
  return {
    codigo: mesa.mesa.trim(),
    areaId: String(mesa.area ?? ''),
    capacidad,
    forma: capacidad <= 4 ? 'redonda' : 'larga',
    estado: folio > 0 ? 'ocupada' : 'libre',
    comensales: mesa.comensales ?? 0,
    apertura: Number.isNaN(apertura) ? null : apertura,
    mozo: mesa.mozo?.trim() || null,
    codigoMozo: mesa.cven === null || mesa.cven === undefined ? null : aNumero(mesa.cven),
    folio,
    numeroCuentas: mesa.cuentas ?? 0,
    consumo: mesa.consumo ?? 0,
  }
}

export const mapearCuenta = (cuenta: CuentaApi): Cuenta => {
  const codigoCliente = aNumero(cuenta.cage)
  return {
    numero: cuenta.ncta,
    nombre: aTexto(cuenta.nombre) || `Cuenta ${cuenta.ncta}`,
    codigoCliente: codigoCliente > 0 ? String(codigoCliente) : undefined,
    nit: aTexto(cuenta.nruc) || undefined,
    liquidada: cuenta.estc === ESTADO_CUENTA_LIQUIDADA,
    lineas: cuenta.lineas.map((l) => ({
      id: `${cuenta.ncta}-${l.cart}-${l.pvta ?? 0}`,
      platoId: l.cart,
      nombre: aTexto(l.descripcion) || l.cart,
      cantidad: l.cant ?? 0,
      precio: l.pvta ?? 0,
    })),
  }
}

export const mapearCliente = (cliente: ClienteApi): ClienteRegistrado => ({
  codigo: String(cliente.codigo),
  nombre: aTexto(cliente.nombre),
  nit: aTexto(cliente.nruc),
})

export const mapearSecciones = (
  filas: { csme: number; cssm: number; descripcion?: string | null }[],
): SeccionMenu[] => {
  const secciones: SeccionMenu[] = []
  for (const fila of filas) {
    const nombre = aTexto(fila.descripcion)
    if (fila.cssm === 0) {
      secciones.push({ codigo: fila.csme, nombre, subsecciones: [] })
      continue
    }
    secciones
      .find((s) => s.codigo === fila.csme)
      ?.subsecciones.push({ codigo: fila.cssm, nombre })
  }
  return secciones
}
