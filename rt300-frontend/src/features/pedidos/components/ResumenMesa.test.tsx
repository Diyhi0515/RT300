import { waitFor } from '@testing-library/react'
import { HttpResponse, http as rutaHttp } from 'msw'
import { beforeAll, describe, expect, it } from 'vitest'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import type { Cuenta, MesaDetalle } from '../types'
import { ResumenMesa } from './ResumenMesa'

const cuenta = (numero: number): Cuenta => ({
  numero,
  nombre: `CUENTA ${numero}`,
  liquidada: false,
  lineas: [],
})

const mesaCon = (folio: number, numeros: number[]) =>
  ({
    codigo: 'HPB02',
    areaId: '1',
    capacidad: 6,
    forma: 'redonda',
    estado: 'ocupada',
    comensales: 10,
    apertura: null,
    mozo: null,
    codigoMozo: null,
    folio,
    numeroCuentas: numeros.length,
    consumo: 0,
    cuentas: numeros.map(cuenta),
  }) as MesaDetalle

describe('ResumenMesa: ordenar cuentas con saltos', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => undefined
  })

  it('pide compactar una vez cuando la numeración tiene huecos', async () => {
    const pedidos: unknown[] = []
    servidor.use(
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/compactar', async ({ request }) => {
        pedidos.push(await request.json())
        return HttpResponse.json({
          eliminadas: [],
          quedan: 3,
          renumeradas: [],
          consecutivas: true,
          cuentas: [],
        })
      }),
    )
    renderConProveedores(<ResumenMesa mesa={mesaCon(9001, [1, 3, 7])} />)
    await waitFor(() => expect(pedidos).toEqual([{ mesa: 'HPB02' }]))
  })

  it('no pide nada cuando la numeración es consecutiva', async () => {
    let llamadas = 0
    servidor.use(
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/compactar', () => {
        llamadas += 1
        return HttpResponse.json({})
      }),
    )
    renderConProveedores(<ResumenMesa mesa={mesaCon(9002, [1, 2, 3])} />)
    await new Promise((resolver) => setTimeout(resolver, 150))
    expect(llamadas).toBe(0)
  })
})
