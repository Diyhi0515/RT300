import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSesion } from '@/features/auth'
import parametros from '@/test/fixtures/parametros.json'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { usePedidos } from '../store'
import { PlanoMesas } from './PlanoMesas'

const mesa = (codigo: string, folio: number) => ({
  mesa: codigo,
  descripcion: codigo,
  capacidad: 4,
  area: 1,
  estado: folio ? 3 : 1,
  folio,
  comensales: folio ? 2 : null,
  cuentas: folio ? 1 : 0,
  consumo: 0,
})

const mesas = { mesas: [mesa('T1', 0), mesa('T2', 0), mesa('T3', 501), mesa('T4', 502)] }

const abrir = () => {
  servidor.use(
    rutaHttp.get('*/api/v1/salon/parametros', () => HttpResponse.json(parametros)),
    rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json(mesas)),
  )
  return renderConProveedores(<PlanoMesas />)
}

const tarjetas = () => screen.queryAllByRole('button', { name: /^Mesa .*sillas$/ })

beforeEach(() => {
  useSesion.setState({
    perfil: { usuario: 'GP1', nombre: 'Mozo Uno', local: '2', rol: 'garzon' },
  })
  usePedidos.setState({ areaId: null, seleccionada: null })
})

describe('PlanoMesas: filtros de estado', () => {
  it('siempre muestra Todos y filtra por libres y ocupadas al hacer clic', async () => {
    const usuario = userEvent.setup()
    abrir()
    const filtros = await screen.findByRole('group', { name: 'Filtrar mesas' })
    await within(filtros).findByRole('button', { name: /^Todos/ })
    await screen.findAllByRole('button', { name: /^Mesa .*sillas$/ })

    const total = tarjetas().length
    const libres = tarjetas().filter((t) => /Libre/.test(t.getAttribute('aria-label') ?? '')).length
    const ocupadas = total - libres
    expect(within(filtros).getByRole('button', { name: /^Todos/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await usuario.click(within(filtros).getByRole('button', { name: /^Libre/ }))
    expect(tarjetas()).toHaveLength(libres)
    expect(tarjetas().every((t) => /Libre/.test(t.getAttribute('aria-label') ?? ''))).toBe(true)

    await usuario.click(within(filtros).getByRole('button', { name: /^Ocupada/ }))
    expect(tarjetas()).toHaveLength(ocupadas)

    await usuario.click(within(filtros).getByRole('button', { name: /^Todos/ }))
    expect(tarjetas()).toHaveLength(total)
  })

  it('Selección muestra solo la mesa elegida o avisa que aún no hay ninguna', async () => {
    const usuario = userEvent.setup()
    abrir()
    const filtros = await screen.findByRole('group', { name: 'Filtrar mesas' })
    await screen.findAllByRole('button', { name: /^Mesa .*sillas$/ })

    await usuario.click(within(filtros).getByRole('button', { name: /^Selección/ }))
    expect(screen.getByText(/aún no has elegido una mesa/i)).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Ver todas' }))
    await usuario.click(tarjetas()[0])
    await usuario.click(within(filtros).getByRole('button', { name: /^Selección/ }))

    expect(tarjetas()).toHaveLength(1)
  })

  it('en el plano, mantener apretada una mesa muestra su información sin elegirla', async () => {
    localStorage.setItem('rt300-vista-mesas', 'plano')
    abrir()
    const mesa = await screen.findByRole('button', { name: /^Mesa T3, Ocupada/ })

    fireEvent.pointerDown(mesa, { pointerType: 'touch', pointerId: 1 })
    await new Promise((r) => setTimeout(r, 550))
    fireEvent.pointerUp(mesa, { pointerType: 'touch', pointerId: 1 })
    fireEvent.click(mesa)

    const info = await screen.findByRole('tooltip')
    expect(info).toHaveTextContent('Mesa T3')
    expect(info).toHaveTextContent('2 comensales')
    expect(info).toHaveTextContent('1 cuenta')
    expect(mesa).toHaveAttribute('aria-pressed', 'false')

    fireEvent.pointerDown(document.body, { pointerType: 'touch', pointerId: 2 })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    localStorage.removeItem('rt300-vista-mesas')
  })

  it('mantener apretada otra mesa cierra la información anterior y abre la nueva', async () => {
    localStorage.setItem('rt300-vista-mesas', 'plano')
    abrir()
    const primera = await screen.findByRole('button', { name: /^Mesa T3, Ocupada/ })
    const segunda = await screen.findByRole('button', { name: /^Mesa T4, Ocupada/ })

    fireEvent.pointerDown(primera, { pointerType: 'touch', pointerId: 1 })
    await new Promise((r) => setTimeout(r, 550))
    fireEvent.pointerUp(primera, { pointerType: 'touch', pointerId: 1 })
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Mesa T3')

    fireEvent.pointerDown(segunda, { pointerType: 'touch', pointerId: 3 })
    await new Promise((r) => setTimeout(r, 550))
    fireEvent.pointerUp(segunda, { pointerType: 'touch', pointerId: 3 })

    const tarjetas = await screen.findAllByRole('tooltip')
    expect(tarjetas).toHaveLength(1)
    expect(tarjetas[0]).toHaveTextContent('Mesa T4')
    localStorage.removeItem('rt300-vista-mesas')
  })
})
