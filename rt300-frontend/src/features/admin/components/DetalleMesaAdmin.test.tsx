import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import detalle from '@/test/fixtures/detalle-folio.json'
import mesas from '@/test/fixtures/mesas.json'
import parametros from '@/test/fixtures/parametros.json'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { DetalleMesaAdmin } from './DetalleMesaAdmin'

const ocupada = mesas.mesas.find((m) => m.folio)!

const rutas = () =>
  servidor.use(
    rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json(mesas)),
    rutaHttp.get('*/api/v1/salon/parametros', () => HttpResponse.json(parametros)),
    rutaHttp.get('*/api/v1/salon/folios/:folio/detalle', () => HttpResponse.json(detalle)),
  )

describe('DetalleMesaAdmin', () => {
  it('muestra el detalle de solo lectura de una mesa ocupada', async () => {
    rutas()
    renderConProveedores(<DetalleMesaAdmin codigo={ocupada.mesa} alCerrar={() => undefined} />)

    const dialogo = await screen.findByRole('dialog')
    expect(await within(dialogo).findByText(`Mesa ${ocupada.mesa}`)).toBeInTheDocument()
    expect(within(dialogo).getByText(ocupada.mozo as string)).toBeInTheDocument()
    expect(await within(dialogo).findByRole('region', { name: 'Cuentas' })).toBeInTheDocument()
    expect(within(dialogo).queryByRole('button', { name: /ocupar|enviar|habilitar/i })).not.toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Abrir en Pedidos' })).toBeInTheDocument()
  })

  it('sin código no muestra nada', () => {
    rutas()
    renderConProveedores(<DetalleMesaAdmin codigo={null} alCerrar={() => undefined} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('el botón cerrar avisa', async () => {
    rutas()
    let cerrado = false
    const usuario = userEvent.setup()
    renderConProveedores(<DetalleMesaAdmin codigo={ocupada.mesa} alCerrar={() => (cerrado = true)} />)
    await usuario.click(await screen.findByRole('button', { name: 'Cerrar' }))
    expect(cerrado).toBe(true)
  })
})
