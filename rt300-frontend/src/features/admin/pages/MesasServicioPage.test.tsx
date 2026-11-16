import { screen, within } from '@testing-library/react'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import mesas from '@/test/fixtures/mesas.json'
import parametros from '@/test/fixtures/parametros.json'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { MesasServicioPage } from './MesasServicioPage'

describe('MesasServicioPage', () => {
  it('lista solo las mesas ocupadas con su mozo y el total del consumo', async () => {
    servidor.use(
      rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json(mesas)),
      rutaHttp.get('*/api/v1/salon/parametros', () => HttpResponse.json(parametros)),
    )
    renderConProveedores(<MesasServicioPage />)

    const tabla = await screen.findByRole('table', { name: 'Mesas ocupadas' })
    const ocupadas = mesas.mesas.filter((m) => m.folio)
    const filas = within(tabla).getAllByRole('row')

    expect(filas).toHaveLength(ocupadas.length + 2)
    expect(within(tabla).getByText(`${ocupadas.length} ${ocupadas.length === 1 ? 'mesa' : 'mesas'} en servicio`)).toBeInTheDocument()
    expect(within(tabla).getAllByText(/^MOZO/).length).toBeGreaterThan(0)
  })

  it('sin mesas ocupadas muestra el estado vacío', async () => {
    servidor.use(
      rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json({ mesas: [] })),
      rutaHttp.get('*/api/v1/salon/parametros', () => HttpResponse.json(parametros)),
    )
    renderConProveedores(<MesasServicioPage />)

    expect(await screen.findByText('No hay mesas en servicio')).toBeInTheDocument()
  })
})
