import { describe, expect, it } from 'vitest'
import detalleFolio from '@/test/fixtures/detalle-folio.json'
import mesasApi from '@/test/fixtures/mesas.json'
import secciones from '@/test/fixtures/secciones.json'
import { esquemaDetalleFolio, esquemaRespuestaMesas, esquemaSecciones } from './esquemas'
import { mapearArea, mapearCliente, mapearCuenta, mapearMesa, mapearSecciones } from './mapeos'

const mesas = esquemaRespuestaMesas.parse(mesasApi).mesas
const libre = mesas.find((m) => !m.folio)!
const ocupada = mesas.find((m) => m.folio)!

describe('mapearMesa', () => {
  it('una mesa sin folio está libre y no tiene datos de servicio', () => {
    const m = mapearMesa(libre)
    expect(m).toMatchObject({ estado: 'libre', comensales: 0, apertura: null, mozo: null, numeroCuentas: 0, consumo: 0 })
  })

  it('una mesa con folio está ocupada y trae mozo, apertura y consumo', () => {
    const m = mapearMesa(ocupada)
    expect(m.estado).toBe('ocupada')
    expect(m.folio).toBe(ocupada.folio)
    expect(m.mozo).toMatch(/^MOZO/)
    expect(m.apertura).toBe(Date.parse(ocupada.apertura!))
    expect(m.consumo).toBe(ocupada.consumo)
    expect(m.numeroCuentas).toBe(ocupada.cuentas)
  })

  it('el área es el código en texto', () => {
    expect(mapearMesa(libre).areaId).toBe(String(libre.area))
  })

  it.each([
    [2, 'redonda'],
    [4, 'redonda'],
    [5, 'larga'],
    [10, 'larga'],
  ])('con %i sillas la forma es %s', (capacidad, forma) => {
    expect(mapearMesa({ ...libre, capacidad }).forma).toBe(forma)
  })

  it('tolera datos faltantes: limpia el código y asume 4 sillas', () => {
    const m = mapearMesa({ mesa: ' HPB09 ' })
    expect(m).toMatchObject({ codigo: 'HPB09', capacidad: 4, estado: 'libre', folio: 0, codigoMozo: null })
  })

  it('una fecha inválida no rompe la pantalla', () => {
    expect(mapearMesa({ ...ocupada, apertura: 'no-es-fecha' }).apertura).toBeNull()
  })
})

describe('mapearCuenta', () => {
  const cuentas = esquemaDetalleFolio.parse(detalleFolio).cuentas

  it('convierte las líneas con cantidad y precio', () => {
    const c = mapearCuenta(cuentas[0])
    expect(c.numero).toBe(cuentas[0].ncta)
    expect(c.lineas.length).toBeGreaterThan(0)
    expect(c.lineas[0]).toMatchObject({ platoId: cuentas[0].lineas[0].cart, cantidad: cuentas[0].lineas[0].cant })
  })

  it('el estado 9 es liquidada y el 1 está abierta', () => {
    expect(mapearCuenta({ ncta: 1, estc: 9, lineas: [] }).liquidada).toBe(true)
    expect(mapearCuenta({ ncta: 1, estc: 1, lineas: [] }).liquidada).toBe(false)
  })

  it('el cliente 0 significa sin cliente', () => {
    expect(mapearCuenta({ ncta: 1, cage: 0, lineas: [] }).codigoCliente).toBeUndefined()
    expect(mapearCuenta({ ncta: 1, cage: 12000, lineas: [] }).codigoCliente).toBe('12000')
  })

  it('sin nombre usa "Cuenta N"', () => {
    expect(mapearCuenta({ ncta: 7, nombre: '  ', lineas: [] }).nombre).toBe('Cuenta 7')
  })

  it('las líneas de una misma cuenta tienen identificador único', () => {
    const ids = mapearCuenta(cuentas[0]).lineas.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('mapearSecciones', () => {
  it('agrupa las subsecciones bajo su sección', () => {
    const resultado = mapearSecciones(esquemaSecciones.parse(secciones).secciones)
    const total = resultado.reduce((s, x) => s + 1 + x.subsecciones.length, 0)
    expect(total).toBe(secciones.secciones.length)
    expect(resultado[0].subsecciones.length).toBeGreaterThan(0)
    expect(resultado.every((s) => s.nombre)).toBe(true)
  })

  it('ignora subsecciones cuya sección no llegó', () => {
    expect(mapearSecciones([{ csme: 9, cssm: 3, descripcion: 'HUERFANA' }])).toEqual([])
  })
})

describe('otros mapeos', () => {
  it('área: id en texto y nombre con respaldo', () => {
    expect(mapearArea({ codigo: 3, descripcion: ' TERRAZA ' })).toEqual({ id: '3', nombre: 'TERRAZA' })
    expect(mapearArea({ codigo: 4 }).nombre).toBe('Área 4')
  })

  it('cliente: código en texto y NIT vacío si no viene', () => {
    expect(mapearCliente({ codigo: 17, nombre: 'ANA', nruc: 123 })).toEqual({ codigo: '17', nombre: 'ANA', nit: '123' })
    expect(mapearCliente({ codigo: 18 }).nit).toBe('')
  })
})
