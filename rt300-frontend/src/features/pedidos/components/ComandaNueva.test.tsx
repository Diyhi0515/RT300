import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import mesas from '@/test/fixtures/mesas.json'
import platos from '@/test/fixtures/platos.json'
import secciones from '@/test/fixtures/secciones.json'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { usePedidos } from '../store'
import { ComandaNueva } from './ComandaNueva'

const ocupada = mesas.mesas.find((m) => m.folio)!

describe('ComandaNueva', () => {
  beforeEach(() => {
    usePedidos.setState({ seleccionada: ocupada.mesa, comandaEn: 1 })
  })

  it('envía a cocina solo el código y la cantidad de cada producto (el precio lo decide el servidor)', async () => {
    let cuerpo: unknown = null
    let ruta = ''
    servidor.use(
      rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json(mesas)),
      rutaHttp.get('*/api/v1/salon/folios/:folio/detalle', () => HttpResponse.json({ cuentas: [] })),
      rutaHttp.get('*/api/v1/menu/secciones', () => HttpResponse.json(secciones)),
      rutaHttp.get('*/api/v1/menu/secciones/:s/:ss/platos', () => HttpResponse.json(platos)),
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/:cuenta/comandas', async ({ request }) => {
        cuerpo = await request.json()
        ruta = new URL(request.url).pathname
        return HttpResponse.json({ comanda: 1, estado: 'ok' })
      }),
    )
    const usuario = userEvent.setup()
    renderConProveedores(<ComandaNueva />)

    const plato = platos.platos[0]
    const agregar = await screen.findByRole('button', { name: `Agregar ${plato.descripcion}` })
    await usuario.click(agregar)
    await usuario.click(screen.getByRole('button', { name: `Agregar ${plato.descripcion}` }))
    await usuario.click(screen.getAllByRole('button', { name: /enviar a cocina/i })[0])

    await waitFor(() => expect(cuerpo).not.toBeNull())
    expect(ruta).toBe(`/api/v1/folios/${ocupada.folio}/cuentas/1/comandas`)
    expect(cuerpo).toEqual({ glos: '', items: [{ cart: plato.cart, cant: 2 }] })
  })

  it('sin productos el botón de enviar está deshabilitado', async () => {
    servidor.use(
      rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json(mesas)),
      rutaHttp.get('*/api/v1/salon/folios/:folio/detalle', () => HttpResponse.json({ cuentas: [] })),
      rutaHttp.get('*/api/v1/menu/secciones', () => HttpResponse.json(secciones)),
      rutaHttp.get('*/api/v1/menu/secciones/:s/:ss/platos', () => HttpResponse.json(platos)),
    )
    renderConProveedores(<ComandaNueva />)

    await screen.findByRole('button', { name: `Agregar ${platos.platos[0].descripcion}` })

    expect(screen.getAllByRole('button', { name: /enviar a cocina/i })[0]).toBeDisabled()
  })
})
