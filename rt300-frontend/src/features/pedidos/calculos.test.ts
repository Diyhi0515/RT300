import { afterEach, describe, expect, it, vi } from 'vitest'
import { cantidadItems, estadoCuenta, filtrarCuentas, ordenarCuentas, iniciales, resumenMesas, tiempoCorto, totalCuenta, totalItems, totalMesa } from './calculos'
import type { Cuenta, ItemComanda, MesaPlano } from './types'

const linea = (cantidad: number, precio: number) => ({ id: `${cantidad}-${precio}`, platoId: 'A', nombre: 'A', cantidad, precio })

const cuenta = (lineas = [linea(2, 10), linea(1, 5.5)], liquidada = false): Cuenta => ({
  numero: 1,
  nombre: 'Cuenta 1',
  liquidada,
  lineas,
})

const mesa = (estado: MesaPlano['estado'], comensales = 0, consumo = 0): MesaPlano => ({
  codigo: 'M',
  areaId: '1',
  capacidad: 4,
  forma: 'redonda',
  estado,
  comensales,
  apertura: null,
  mozo: null,
  codigoMozo: null,
  folio: estado === 'ocupada' ? 1 : 0,
  numeroCuentas: 1,
  consumo,
})

describe('cuentas', () => {
  it('totalCuenta suma cantidad por precio', () => {
    expect(totalCuenta(cuenta())).toBe(25.5)
    expect(totalCuenta(cuenta([]))).toBe(0)
  })

  it('estadoCuenta distingue vacía, con consumo y liquidada', () => {
    expect(estadoCuenta(cuenta([]))).toBe('vacia')
    expect(estadoCuenta(cuenta())).toBe('consumo')
    expect(estadoCuenta(cuenta(undefined, true))).toBe('liquidada')
  })
})

describe('comanda', () => {
  const items: ItemComanda[] = [
    { plato: { id: 'A', nombre: 'A', precio: 8, moneda: 'Bs.' }, cantidad: 2 },
    { plato: { id: 'B', nombre: 'B', precio: 110, moneda: 'Bs.' }, cantidad: 1 },
  ]

  it('suma el total y la cantidad de productos', () => {
    expect(totalItems(items)).toBe(126)
    expect(cantidadItems(items)).toBe(3)
  })
})

describe('resumenMesas', () => {
  it('cuenta libres y ocupadas, comensales y consumo solo de las ocupadas', () => {
    const r = resumenMesas([mesa('libre'), mesa('ocupada', 4, 100), mesa('ocupada', 2, 50.5), mesa('libre', 9, 999)])
    expect(r.conteo).toEqual({ libre: 2, ocupada: 2 })
    expect(r.comensales).toBe(6)
    expect(r.consumo).toBe(150.5)
    expect(r.porcentaje).toBe(50)
    expect(r.total).toBe(4)
  })

  it('sin mesas no divide por cero', () => {
    expect(resumenMesas([]).porcentaje).toBe(0)
  })

  it('totalMesa es el consumo que informa el servidor', () => {
    expect(totalMesa(mesa('ocupada', 2, 77))).toBe(77)
  })
})

describe('tiempoCorto', () => {
  afterEach(() => vi.useRealTimers())

  it.each([
    [30, 'Ahora'],
    [5 * 60_000, '5 min'],
    [59 * 60_000, '59 min'],
    [65 * 60_000, '1h 5m'],
    [3 * 3_600_000 + 7 * 60_000, '3h 7m'],
    [26 * 3_600_000, '1d 2h'],
  ])('hace %i ms se muestra %s', (milisegundos, esperado) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-13T12:00:00'))
    expect(tiempoCorto(Date.now() - milisegundos)).toBe(esperado)
  })

  it('una marca futura no da tiempo negativo', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-13T12:00:00'))
    expect(tiempoCorto(Date.now() + 60_000)).toBe('Ahora')
  })
})

describe('iniciales', () => {
  it('toma la primera letra de las dos primeras palabras, en mayúscula', () => {
    expect(iniciales('Asbun Rojas Jorge Antonio')).toBe('AR')
    expect(iniciales('AÑEZ AGUILERA BLANCA')).toBe('AA')
  })

  it('con una sola palabra devuelve una letra y con nombre vacío un signo', () => {
    expect(iniciales('cabrera')).toBe('C')
    expect(iniciales('   ')).toBe('?')
  })

  it('ignora signos sueltos y espacios repetidos', () => {
    expect(iniciales('  - ñuñez   (de) perez')).toBe('ÑD')
  })
})

describe('filtrarCuentas', () => {
  const cuentas: Cuenta[] = [
    { numero: 1, nombre: 'ÑUÑEZ PEREZ', codigoCliente: '1018', nit: '2974484016', liquidada: false, lineas: [] },
    { numero: 12, nombre: 'CONTABILIDAD', liquidada: false, lineas: [] },
    { numero: 20, nombre: 'AGUILERA', codigoCliente: '17355', liquidada: false, lineas: [] },
  ]

  it('sin texto devuelve todas', () => {
    expect(filtrarCuentas(cuentas, '  ')).toHaveLength(3)
  })

  it('busca por número, nombre sin importar tildes, código de cliente y NIT', () => {
    expect(filtrarCuentas(cuentas, '12').map((c) => c.numero)).toEqual([12])
    expect(filtrarCuentas(cuentas, 'nunez').map((c) => c.numero)).toEqual([1])
    expect(filtrarCuentas(cuentas, '17355').map((c) => c.numero)).toEqual([20])
    expect(filtrarCuentas(cuentas, '2974').map((c) => c.numero)).toEqual([1])
  })

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(filtrarCuentas(cuentas, 'zzz')).toEqual([])
  })
})

describe('ordenarCuentas', () => {
  const cuenta = (numero: number, nombre: string, codigoCliente?: string): Cuenta => ({
    numero,
    nombre,
    codigoCliente,
    liquidada: false,
    lineas: [],
  })

  it('primero las cuentas con cliente en orden alfabético y luego las comunes por número', () => {
    const cuentas = [
      cuenta(1, 'CONTABILIDAD'),
      cuenta(2, 'ZAPATA', '30'),
      cuenta(3, 'ÁLVAREZ', '10'),
      cuenta(4, 'CONTABILIDAD'),
      cuenta(5, 'MENDEZ', '20'),
    ]
    expect(ordenarCuentas(cuentas).map((c) => c.numero)).toEqual([3, 5, 2, 1, 4])
  })

  it('no modifica la lista original y desempata por número', () => {
    const cuentas = [cuenta(9, 'RAMOS', '1'), cuenta(2, 'RAMOS', '2')]
    expect(ordenarCuentas(cuentas).map((c) => c.numero)).toEqual([2, 9])
    expect(cuentas.map((c) => c.numero)).toEqual([9, 2])
  })
})
