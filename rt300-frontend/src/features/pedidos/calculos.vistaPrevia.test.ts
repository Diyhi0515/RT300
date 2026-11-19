import { describe, expect, it } from 'vitest'
import { textoVistaPrevia } from './calculos'
import type { ItemComanda } from './types'

const plato = (nombre: string, precio = 10) => ({ id: 'X', nombre, precio, moneda: 'Bs.' })

const encabezado = (mesa: string, cuenta: number, cliente: string) => [
  `${' '.repeat(13)}PEDIDO DE MESA${' '.repeat(13)}`,
  '-'.repeat(40),
  `Mesa  : ${mesa}`,
  `Cuenta: ${cuenta}`,
  `Clte. : ${cliente}`,
  '-'.repeat(40),
]

describe('textoVistaPrevia (40 columnas, con precios y total)', () => {
  it('muestra cantidad x precio = subtotal por producto y el total', () => {
    const items: ItemComanda[] = [
      { plato: plato('COCACOLA', 20), cantidad: 5 },
      { plato: plato('HIELO', 20), cantidad: 1 },
    ]

    const texto = textoVistaPrevia({ mesa: 'HPB10', cuenta: 1, cliente: 'CONTABILIDAD .', items })

    expect(texto.split('\n')).toEqual([
      ...encabezado('HPB10', 1, 'CONTABILIDAD .'),
      'COCACOLA',
      `  5 x 20,00${' '.repeat(21)}= 100,00`,
      'HIELO',
      `  1 x 20,00${' '.repeat(22)}= 20,00`,
      '-'.repeat(40),
      `TOTAL${' '.repeat(27)}= 120,00`,
    ])
  })

  it('ninguna línea pasa de 40 columnas, los nombres largos se parten y los miles se separan', () => {
    const items: ItemComanda[] = [
      {
        plato: plato('PRODUCTO CON UN NOMBRE MUY LARGO QUE NO CABE EN LA LINEA', 5200),
        cantidad: 12,
      },
    ]

    const texto = textoVistaPrevia({ mesa: 'HPB01', cuenta: 3, cliente: 'X'.repeat(60), items })

    for (const linea of texto.split('\n')) expect(linea.length).toBeLessThanOrEqual(40)
    expect(texto).toContain('PRODUCTO CON UN NOMBRE MUY LARGO QUE NO')
    expect(texto).toContain('CABE EN LA LINEA')
    expect(texto).toContain('= 62.400,00')
  })

  it('incluye extras con su precio, la nota partida en líneas de 40 y los suma al total', () => {
    const items: ItemComanda[] = [
      {
        plato: plato('PIZZA', 50),
        cantidad: 2,
        extras: [{ codigo: 'E1', nombre: 'QUESO', precio: 5, cantidad: 3 }],
        nota: 'SIN CEBOLLA Y BIEN COCIDA POR FAVOR NO PONER ACEITUNAS',
      },
    ]

    const lineas = textoVistaPrevia({ mesa: 'HPB01', cuenta: 1, cliente: 'A', items }).split('\n')

    expect(lineas.slice(6)).toEqual([
      'PIZZA',
      `  2 x 50,00${' '.repeat(21)}= 100,00`,
      '  + QUESO',
      `    3 x 5,00${' '.repeat(21)}= 15,00`,
      '++ SIN CEBOLLA Y BIEN COCIDA POR FAVOR',
      'NO PONER ACEITUNAS',
      '-'.repeat(40),
      `TOTAL${' '.repeat(27)}= 115,00`,
    ])
  })
})
