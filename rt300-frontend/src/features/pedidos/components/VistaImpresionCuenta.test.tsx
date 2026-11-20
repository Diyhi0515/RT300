import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useSesion } from '@/features/auth'
import { renderConProveedores } from '@/test/render'
import type { Cuenta, MesaDetalle } from '../types'
import { VistaImpresionCuenta } from './VistaImpresionCuenta'

const cuenta: Cuenta = {
  numero: 2,
  nombre: 'JUAN PEREZ',
  nit: '1234567',
  liquidada: false,
  lineas: [
    { id: 'a', platoId: 'A1', nombre: 'AGUA 600 ML', cantidad: 2, precio: 8 },
    { id: 'b', platoId: 'B1', nombre: 'MILANESA', cantidad: 1, precio: 45.5 },
  ],
}
const mesa = { codigo: 'HPB02', mozo: 'MOZO 1', cuentas: [cuenta] } as unknown as MesaDetalle

describe('VistaImpresionCuenta', () => {
  it('muestra el estado de cuenta con sus líneas y el total', () => {
    useSesion.setState({ perfil: { usuario: 'GP1', nombre: 'Mozo', local: 'RESTAURANTE HOYO 19', rol: 'garzon' } })
    renderConProveedores(<VistaImpresionCuenta mesa={mesa} cuenta={cuenta} alCerrar={() => undefined} />)

    const ticket = screen.getByLabelText('Estado de cuenta 2')
    expect(within(ticket).getByText('RESTAURANTE HOYO 19')).toBeInTheDocument()
    expect(within(ticket).getByText('HPB02')).toBeInTheDocument()
    expect(within(ticket).getByText(/JUAN PEREZ/)).toBeInTheDocument()
    expect(within(ticket).getByText('1234567')).toBeInTheDocument()
    expect(within(ticket).getByText('AGUA 600 ML')).toBeInTheDocument()
    expect(within(ticket).getByText('Productos').nextSibling).toHaveTextContent('3')
    expect(within(ticket).getByText('TOTAL').nextSibling?.textContent).toMatch(/61[.,]50/)
    expect(within(ticket).getByText(/no es una factura/i)).toBeInTheDocument()
  })

  it('el botón imprime con la impresora del navegador', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    const usuario = userEvent.setup()
    renderConProveedores(<VistaImpresionCuenta mesa={mesa} cuenta={cuenta} alCerrar={() => undefined} />)

    await usuario.click(screen.getByRole('button', { name: /imprimir desde este equipo/i }))

    expect(imprimir).toHaveBeenCalledTimes(1)
  })
})
