import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import { servidor } from '@/test/servidor'
import { enviarComanda } from './api'

describe('enviarComanda: validación antes de salir del navegador', () => {
  const espiar = () => {
    const llamadas: unknown[] = []
    servidor.use(
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/:cuenta/comandas', async ({ request }) => {
        llamadas.push(await request.json())
        return HttpResponse.json({ ntmp: 1, comanda: '1' })
      }),
    )
    return llamadas
  }

  it('manda solo código y cantidad, descartando cualquier campo extra', async () => {
    const llamadas = espiar()

    await enviarComanda(1, 1, {
      glos: '',
      items: [{ cart: '5101004', cant: 2, pvta: 0.01 } as { cart: string; cant: number }],
    })

    expect(llamadas).toEqual([{ glos: '', items: [{ cart: '5101004', cant: 2 }] }])
  })

  it('rechaza cantidades fuera de rango, vacías o con demasiados productos', async () => {
    const llamadas = espiar()
    const unItem = (cant: number) => ({ glos: '', items: [{ cart: '5101004', cant }] })

    await expect(enviarComanda(1, 1, unItem(0))).rejects.toThrow()
    await expect(enviarComanda(1, 1, unItem(100))).rejects.toThrow()
    await expect(enviarComanda(1, 1, unItem(1.5))).rejects.toThrow()
    await expect(enviarComanda(1, 1, { glos: '', items: [] })).rejects.toThrow()
    await expect(
      enviarComanda(1, 1, {
        glos: '',
        items: Array.from({ length: 101 }, (_, i) => ({ cart: `P${i}`, cant: 1 })),
      }),
    ).rejects.toThrow()

    expect(llamadas).toHaveLength(0)
  })
})
