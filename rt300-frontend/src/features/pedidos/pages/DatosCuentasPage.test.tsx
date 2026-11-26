import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import detalle from '@/test/fixtures/detalle-folio.json'
import mesas from '@/test/fixtures/mesas.json'
import { useAvisos } from '@/shared/avisos/almacen'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { DatosCuentasPage } from './DatosCuentasPage'

const ocupada = mesas.mesas.find((m) => m.folio)!

const abrirPagina = (clientes: object[]) => {
  const pedidos: string[] = []
  let guardados = 0
  servidor.use(
    rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json(mesas)),
    rutaHttp.get('*/api/v1/salon/folios/:folio/detalle', () => HttpResponse.json(detalle)),
    rutaHttp.get('*/api/v1/clientes', ({ request }) => {
      const codigo = new URL(request.url).searchParams.get('codigo')
      if (codigo) pedidos.push(codigo)
      return HttpResponse.json({ clientes: codigo ? clientes : [] })
    }),
    rutaHttp.put('*/api/v1/folios/:folio/cuentas/:cuenta', () => {
      guardados++
      return HttpResponse.json({})
    }),
  )
  renderConProveedores(<DatosCuentasPage />, {
    ruta: `/pedidos/cuentas/${ocupada.mesa}`,
    patron: '/pedidos/cuentas/:codigo',
  })
  return { pedidos, guardados: () => guardados }
}

const escribirCodigo = async (usuario: ReturnType<typeof userEvent.setup>, codigo: string) => {
  const campo = await screen.findByRole('textbox', { name: 'Código cliente' })
  await usuario.clear(campo)
  await usuario.type(campo, codigo)
}

const cliente = { codigo: 662, nombre: 'EMPRESA DE PRUEBA', nruc: '1028' }

// jsdom no implementa scrollIntoView, que usa la tabla de cuentas
Element.prototype.scrollIntoView = () => {}

describe('DatosCuentasPage: buscar cliente por código', () => {
  it('el botón carga el nombre y el NIT del cliente', async () => {
    const usuario = userEvent.setup()
    const { pedidos } = abrirPagina([cliente])
    await escribirCodigo(usuario, '662')

    await usuario.click(screen.getByRole('button', { name: 'Buscar cliente por código' }))

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('EMPRESA DE PRUEBA'),
    )
    expect(screen.getByRole('textbox', { name: 'NIT / CI' })).toHaveValue('1028')
    expect(pedidos).toEqual(['662'])
  })

  it('Enter busca el cliente y no guarda la cuenta', async () => {
    const usuario = userEvent.setup()
    const { guardados } = abrirPagina([cliente])
    await escribirCodigo(usuario, '662')

    await usuario.keyboard('{Enter}')

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('EMPRESA DE PRUEBA'),
    )
    expect(guardados()).toBe(0)
  })

  it('avisa cuando el código no existe', async () => {
    const usuario = userEvent.setup()
    useAvisos.setState(useAvisos.getInitialState(), true)
    abrirPagina([])
    await escribirCodigo(usuario, '999999')

    await usuario.click(screen.getByRole('button', { name: 'Buscar cliente por código' }))

    await waitFor(() =>
      expect(JSON.stringify(useAvisos.getState())).toContain('Cliente no encontrado'),
    )
  })
})
