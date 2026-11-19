import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import comandas from '@/test/fixtures/comandas-mesa.json'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { ComandasMesaModal } from './ComandasMesaModal'

const abrir = () =>
  renderConProveedores(<ComandasMesaModal abierto folio={500} mesa="HPB02" alCerrar={() => {}} />)

const responderLista = () =>
  servidor.use(rutaHttp.get('*/api/v1/folios/:folio/comandas', () => HttpResponse.json(comandas)))

describe('ComandasMesaModal', () => {
  it('lista las comandas vigentes de la mesa con sus productos', async () => {
    responderLista()
    abrir()

    expect(await screen.findByRole('region', { name: 'Comanda 1001' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Comanda 1002' })).toBeInTheDocument()
    expect(screen.getByLabelText('Elegir AGUA VITAL 600 ML')).toBeInTheDocument()
  })

  it('muestra un aviso cuando la mesa no tiene comandas', async () => {
    servidor.use(
      rutaHttp.get('*/api/v1/folios/:folio/comandas', () =>
        HttpResponse.json(
          { error: { code: 'SIN_COMANDAS', message: 'NO EXISTE COMANDAS EN LA MESA' } },
          { status: 404 },
        ),
      ),
    )
    abrir()

    expect(await screen.findByText(/aún no tiene comandas vigentes/i)).toBeInTheDocument()
  })

  it('sin productos elegidos no se puede reimprimir ni eliminar', async () => {
    responderLista()
    abrir()
    await screen.findByRole('region', { name: 'Comanda 1001' })

    expect(screen.getByRole('button', { name: 'Reimprimir' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled()
  })

  it('reimprimir envía solo comanda, item, motivo y autorizador, sin clave', async () => {
    let cuerpo: Record<string, unknown> | null = null
    responderLista()
    servidor.use(
      rutaHttp.post('*/api/v1/comandas/reimprimir', async ({ request }) => {
        cuerpo = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ntmp: 7, resultado: 1 })
      }),
    )
    const usuario = userEvent.setup()
    abrir()
    await usuario.click(await screen.findByLabelText('Elegir AGUA VITAL 600 ML'))
    await usuario.click(screen.getByRole('button', { name: 'Reimprimir' }))

    await usuario.selectOptions(await screen.findByLabelText('Motivo'), '2')
    await usuario.type(screen.getByLabelText('Usuario autorizador'), 'sup1')
    expect(screen.queryByLabelText('Clave del autorizador')).toBeNull()
    await usuario.click(screen.getAllByRole('button', { name: 'Reimprimir' }).at(-1)!)

    await waitFor(() => expect(cuerpo).not.toBeNull())
    expect(cuerpo).toEqual({
      nfol: 500,
      mesa: 'HPB02',
      uaut: 'SUP1',
      mtvo: 2,
      items: [{ ncom: 1001, item: 2 }],
    })
  })

  it('eliminar exige la clave del autorizador, que va como campo de contraseña', async () => {
    let cuerpo: Record<string, unknown> | null = null
    responderLista()
    servidor.use(
      rutaHttp.post('*/api/v1/comandas/eliminar', async ({ request }) => {
        cuerpo = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ntmp: 8, resultado: 1 })
      }),
    )
    const usuario = userEvent.setup()
    abrir()
    await usuario.click(await screen.findByLabelText('Elegir toda la comanda 1002'))
    await usuario.click(screen.getByRole('button', { name: 'Eliminar' }))

    await usuario.selectOptions(await screen.findByLabelText('Motivo'), '1')
    await usuario.type(screen.getByLabelText('Usuario autorizador'), 'sup1')
    const clave = screen.getByLabelText('Clave del autorizador')
    expect(clave).toHaveAttribute('type', 'password')
    expect(clave).toHaveAttribute('autocomplete', 'new-password')

    const confirmar = screen.getAllByRole('button', { name: 'Eliminar' }).at(-1)!
    expect(confirmar).toBeDisabled()
    await usuario.type(clave, 'secreta')
    await usuario.click(confirmar)

    await waitFor(() => expect(cuerpo).not.toBeNull())
    expect(cuerpo).toEqual({
      nfol: 500,
      mesa: 'HPB02',
      uaut: 'SUP1',
      cont: 'secreta',
      mtvo: 1,
      items: [{ ncom: 1002, item: 1 }],
    })
  })
})
