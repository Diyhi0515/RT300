import type { Cuenta, EstadoMesaPlano, ItemComanda, MesaPlano } from './types'

export type EstadoCuenta = 'vacia' | 'consumo' | 'liquidada'

export const totalCuenta = (cuenta: Cuenta) =>
  cuenta.lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0)

export const totalMesa = (mesa: MesaPlano) => mesa.consumo

export const estadoCuenta = (cuenta: Cuenta): EstadoCuenta => {
  if (cuenta.liquidada) return 'liquidada'
  return cuenta.lineas.length ? 'consumo' : 'vacia'
}

export const totalItems = (items: ItemComanda[]) =>
  items.reduce((suma, i) => suma + i.cantidad * i.plato.precio, 0)

export const cantidadItems = (items: ItemComanda[]) =>
  items.reduce((suma, i) => suma + i.cantidad, 0)

export const resumenMesas = (mesas: MesaPlano[]) => {
  const conteo: Record<EstadoMesaPlano, number> = { libre: 0, ocupada: 0 }
  let comensales = 0
  let consumo = 0
  for (const mesa of mesas) {
    conteo[mesa.estado] += 1
    if (mesa.estado === 'ocupada') {
      comensales += mesa.comensales
      consumo += totalMesa(mesa)
    }
  }
  return {
    conteo,
    comensales,
    consumo,
    total: mesas.length,
    ocupadas: conteo.ocupada,
    porcentaje: mesas.length ? Math.round((conteo.ocupada / mesas.length) * 100) : 0,
  }
}

export const tiempoCorto = (marca: number) => {
  const minutos = Math.max(0, Math.round((Date.now() - marca) / 60_000))
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas}h ${minutos % 60}m`
  return `${Math.floor(horas / 24)}d ${horas % 24}h`
}

export const iniciales = (nombre: string) => {
  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter((palabra) => /\p{L}/u.test(palabra))
  if (palabras.length === 0) return '?'
  return palabras
    .slice(0, 2)
    .map((palabra) => (palabra.match(/\p{L}/u) as RegExpMatchArray)[0].toUpperCase())
    .join('')
}

const sinAcentos = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export const filtrarCuentas = (cuentas: Cuenta[], texto: string) => {
  const buscado = sinAcentos(texto.trim())
  if (!buscado) return cuentas
  return cuentas.filter((cuenta) =>
    [String(cuenta.numero), cuenta.nombre, cuenta.codigoCliente ?? '', cuenta.nit ?? ''].some((campo) =>
      sinAcentos(campo).includes(buscado),
    ),
  )
}

export const ordenarCuentas = (cuentas: Cuenta[]) => {
  const conCliente = cuentas
    .filter((cuenta) => !!cuenta.codigoCliente)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es') || a.numero - b.numero)
  const sinCliente = cuentas
    .filter((cuenta) => !cuenta.codigoCliente)
    .sort((a, b) => a.numero - b.numero)
  return [...conCliente, ...sinCliente]
}
