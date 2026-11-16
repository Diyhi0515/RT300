import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import { servidor } from '@/test/servidor'
import { renderConProveedores } from '@/test/render'
import { useSesion } from '@/features/auth'
import type { MesaPlano } from '../types'
import { FormularioOcupar } from './FormularioOcupar'

const mesa: MesaPlano = {
  codigo: 'HPB02',
  areaId: '1',
  capacidad: 4,
  forma: 'redonda',
  estado: 'libre',
  comensales: 0,
  apertura: null,
  mozo: null,
  codigoMozo: null,
  folio: 0,
  numeroCuentas: 0,
  consumo: 0,
}

describe('FormularioOcupar', () => {
  it('ocupa la mesa enviando solo área, comensales y cuentas (el mesero lo decide el servidor)', async () => {
    useSesion.setState({ perfil: { usuario: 'GP1', nombre: 'Mozo Uno', local: '2', rol: 'garzon' } })
    let cuerpo: unknown = null
    let ruta = ''
    servidor.use(
      rutaHttp.post('*/api/v1/salon/mesas/:mesa/ocupar', async ({ request, params }) => {
        cuerpo = await request.json()
        ruta = String(params.mesa)
        return HttpResponse.json({ folio: 99, mesa: 'HPB02' })
      }),
      rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json({ mesas: [] })),
    )
    const usuario = userEvent.setup()
    renderConProveedores(<FormularioOcupar mesa={mesa} />)

    await usuario.click(screen.getByRole('button', { name: /más cuentas/i }))
    await usuario.click(screen.getByRole('button', { name: 'Ocupar mesa' }))

    await waitFor(() => expect(cuerpo).not.toBeNull())
    expect(ruta).toBe('HPB02')
    expect(cuerpo).toEqual({ caco: 1, ccom: 4, ncta: 2 })
  })

  it('muestra quién atiende y bloquea el botón mientras ocupa', async () => {
    useSesion.setState({ perfil: { usuario: 'GP1', nombre: 'Mozo Uno', local: '2', rol: 'garzon' } })
    servidor.use(
      rutaHttp.post('*/api/v1/salon/mesas/:mesa/ocupar', async () => {
        await new Promise((r) => setTimeout(r, 50))
        return HttpResponse.json({ folio: 99, mesa: 'HPB02' })
      }),
      rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json({ mesas: [] })),
    )
    const usuario = userEvent.setup()
    renderConProveedores(<FormularioOcupar mesa={mesa} />)

    expect(screen.getByText('Mozo Uno')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Ocupar mesa' }))

    expect(await screen.findByRole('button', { name: 'Ocupando...' })).toBeDisabled()
  })

  it('las cuentas no pueden superar a los comensales (regla del sistema antiguo)', async () => {
    useSesion.setState({ perfil: { usuario: 'GP1', nombre: 'Mozo Uno', local: '2', rol: 'garzon' } })
    const usuario = userEvent.setup()
    renderConProveedores(<FormularioOcupar mesa={{ ...mesa, capacidad: 2 }} />)

    const masCuentas = screen.getByRole('button', { name: /más cuentas/i })
    await usuario.click(masCuentas)
    expect(masCuentas).toBeDisabled()

    const menosComensales = screen.getByRole('button', { name: /menos comensales/i })
    expect(menosComensales).toBeDisabled()

    await usuario.click(screen.getByRole('button', { name: /más comensales/i }))
    expect(masCuentas).toBeEnabled()
  })
})
