import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import clientes from '@/test/fixtures/clientes-busqueda.json'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { ClientesAdminPage } from './ClientesAdminPage'

describe('ClientesAdminPage', () => {
  it('busca por nombre con al menos 2 letras y muestra los resultados', async () => {
    const consultas: string[] = []
    servidor.use(
      rutaHttp.get('*/api/v1/clientes', ({ request }) => {
        consultas.push(new URL(request.url).search)
        return HttpResponse.json(clientes)
      }),
    )
    const usuario = userEvent.setup()
    renderConProveedores(<ClientesAdminPage />)

    expect(screen.getByText('Busca un cliente')).toBeInTheDocument()
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'no')

    expect(await screen.findByRole('table', { name: 'Clientes encontrados' })).toBeInTheDocument()
    expect(screen.getByText(clientes.clientes[0].nombre)).toBeInTheDocument()
    expect(consultas).toEqual(['?nombre=no'])
  })

  it('una sola letra no consulta al servidor', async () => {
    const consultas = { total: 0 }
    servidor.use(
      rutaHttp.get('*/api/v1/clientes', () => {
        consultas.total++
        return HttpResponse.json(clientes)
      }),
    )
    const usuario = userEvent.setup()
    renderConProveedores(<ClientesAdminPage />)

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'n')
    await new Promise((r) => setTimeout(r, 500))

    await waitFor(() => expect(consultas.total).toBe(0))
    expect(screen.getByText('Busca un cliente')).toBeInTheDocument()
  })
})
