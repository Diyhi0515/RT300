import { afterEach, describe, expect, it, vi } from 'vitest'
import { borrarBorrador, guardarBorrador, leerBorrador } from './borradorComanda'
import type { ItemComanda } from './types'

const items: Record<string, ItemComanda> = {
  '5101004': {
    plato: { id: '5101004', nombre: 'AGUA', precio: 8, moneda: 'Bs.' },
    cantidad: 2,
    categoria: 'GASEOSAS',
    orden: 1,
  },
}

afterEach(() => {
  sessionStorage.clear()
  vi.useRealTimers()
})

describe('borradorComanda', () => {
  it('guarda y recupera lo elegido de una cuenta', () => {
    guardarBorrador(10, 1, items)

    expect(leerBorrador(10, 1)).toEqual(items)
    expect(leerBorrador(10, 2)).toEqual({})
  })

  it('borra el borrador al registrar', () => {
    guardarBorrador(10, 1, items)
    borrarBorrador(10, 1)

    expect(leerBorrador(10, 1)).toEqual({})
  })

  it('guardar vacío elimina el borrador', () => {
    guardarBorrador(10, 1, items)
    guardarBorrador(10, 1, {})

    expect(sessionStorage.length).toBe(0)
  })

  it('descarta un borrador alterado desde el inspector', () => {
    const alterar = (cambio: (copia: Record<string, ItemComanda>) => void) => {
      const copia = structuredClone(items)
      cambio(copia)
      sessionStorage.setItem(
        'rt300:borrador-comanda:10:1',
        JSON.stringify({ guardadoEn: Date.now(), items: copia }),
      )
      return leerBorrador(10, 1)
    }

    expect(alterar((c) => (c['5101004'].cantidad = 5000))).toEqual({})
    expect(alterar((c) => (c['5101004'].cantidad = -1))).toEqual({})
    expect(alterar((c) => (c['5101004'].plato.precio = -5))).toEqual({})
    expect(alterar((c) => (c['5101004'].plato.nombre = 'X'.repeat(500)))).toEqual({})
    expect(alterar((c) => (c['OTRA'] = c['5101004']))).toEqual({})
  })

  it('descarta borradores vencidos o dañados', () => {
    vi.useFakeTimers()
    guardarBorrador(10, 1, items)
    vi.setSystemTime(Date.now() + 13 * 60 * 60 * 1000)
    expect(leerBorrador(10, 1)).toEqual({})

    sessionStorage.setItem('rt300:borrador-comanda:10:1', '{no es json')
    expect(leerBorrador(10, 1)).toEqual({})
  })
})
