import type { Cuenta, EstadoMesaPlano, ItemComanda, MesaPlano } from './types'

export type EstadoCuenta = 'vacia' | 'consumo' | 'liquidada'

export const totalCuenta = (cuenta: Cuenta) =>
  cuenta.lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0)

export const totalMesa = (mesa: MesaPlano) =>
  mesa.cuentas.reduce((suma, c) => (c.liquidada ? suma : suma + totalCuenta(c)), 0)

export const estadoCuenta = (cuenta: Cuenta): EstadoCuenta => {
  if (cuenta.liquidada) return 'liquidada'
  return cuenta.lineas.length ? 'consumo' : 'vacia'
}

export const totalItems = (items: ItemComanda[]) =>
  items.reduce((suma, i) => suma + i.cantidad * i.plato.precio, 0)

export const cantidadItems = (items: ItemComanda[]) =>
  items.reduce((suma, i) => suma + i.cantidad, 0)

export const resumenMesas = (mesas: MesaPlano[]) => {
  const conteo: Record<EstadoMesaPlano, number> = { libre: 0, ocupada: 0, reservada: 0, cobro: 0 }
  let comensales = 0
  let consumo = 0
  for (const mesa of mesas) {
    conteo[mesa.estado] += 1
    if (mesa.estado === 'ocupada' || mesa.estado === 'cobro') {
      comensales += mesa.comensales
      consumo += totalMesa(mesa)
    }
  }
  const ocupadas = conteo.ocupada + conteo.cobro
  return {
    conteo,
    comensales,
    consumo,
    total: mesas.length,
    ocupadas,
    porcentaje: mesas.length ? Math.round((ocupadas / mesas.length) * 100) : 0,
  }
}

export const tiempoCorto = (marca: number) => {
  const minutos = Math.max(0, Math.round((Date.now() - marca) / 60_000))
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)}h ${minutos % 60}m`
}
