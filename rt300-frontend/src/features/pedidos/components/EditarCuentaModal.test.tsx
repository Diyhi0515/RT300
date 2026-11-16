import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import type { Cuenta } from '../types'
import { EditarCuentaModal } from './EditarCuentaModal'

const cuenta: Cuenta = { numero: 1, nombre: 'Cuenta 1', liquidada: false, lineas: [] }
const cliente = { codigo: 17, nombre: 'CLIENTE 1', nruc: '1234567', ndid: '7654321', lpre: 0 }

const abrir = () => renderConProveedores(<EditarCuentaModal cuenta={cuenta} alCerrar={() => undefined} alGuardar={async () => true} />)

const buscar = async (texto: string) => {
  const usuario = userEvent.setup()
  await usuario.type(screen.getByRole('textbox', { name: 'Buscar cliente' }), texto)
  await usuario.click(screen.getByRole('button', { name: 'Buscar' }))
}

describe('EditarCuentaModal: buscar cliente', () => {
  it('un código existente carga código, nombre y NIT', async () => {
    servidor.use(
      rutaHttp.get('*/api/v1/clientes', ({ request }) => {
        const url = new URL(request.url)
        return url.searchParams.get('codigo') === '17' ? HttpResponse.json({ clientes: [cliente] }) : HttpResponse.json({ clientes: [] })
      }),
    )
    abrir()
    await buscar('17')
    expect(await screen.findByText(/se cargaron el código/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('CLIENTE 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1234567')).toBeInTheDocument()
  })

  it('si no hay cliente con ese código busca por NIT o CI', async () => {
    const consultas: string[] = []
    servidor.use(
      rutaHttp.get('*/api/v1/clientes', ({ request }) => {
        const url = new URL(request.url)
        consultas.push(url.search)
        if (url.searchParams.get('documento') === '1234567') return HttpResponse.json({ clientes: [cliente] })
        return HttpResponse.json({ clientes: [] })
      }),
    )
    abrir()
    await buscar('1234567')
    expect(await screen.findByText(/se cargaron el código/i)).toBeInTheDocument()
    expect(consultas).toEqual(['?codigo=1234567', '?documento=1234567'])
    expect(screen.getByDisplayValue('CLIENTE 1')).toBeInTheDocument()
  })

  it('un número de más de 9 dígitos se busca directo como NIT o CI', async () => {
    const consultas: string[] = []
    servidor.use(
      rutaHttp.get('*/api/v1/clientes', ({ request }) => {
        consultas.push(new URL(request.url).search)
        return HttpResponse.json({ clientes: [cliente] })
      }),
    )
    abrir()
    await buscar('1234567890')
    expect(await screen.findByText(/se cargaron el código/i)).toBeInTheDocument()
    expect(consultas).toEqual(['?documento=1234567890'])
  })

  it('si no existe de ninguna forma lo avisa', async () => {
    servidor.use(rutaHttp.get('*/api/v1/clientes', () => HttpResponse.json({ clientes: [] })))
    abrir()
    await buscar('999999')
    expect(await screen.findByText(/no hay un cliente con ese código, nit ni ci/i)).toBeInTheDocument()
  })
})
