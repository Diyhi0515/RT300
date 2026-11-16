import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Cuenta } from '../types'
import { TodasLasCuentas } from './TodasLasCuentas'

const vacia = (numero: number): Cuenta => ({
  numero,
  nombre: `CUENTA ${numero}`,
  liquidada: false,
  lineas: [],
})
const conConsumo = (numero: number): Cuenta => ({
  ...vacia(numero),
  lineas: [{ id: `${numero}-a`, platoId: 'a', nombre: 'PLATO', cantidad: 1, precio: 10 }],
})

const montar = (cuentas: Cuenta[], alEliminar = vi.fn().mockResolvedValue(true)) => {
  const puedeEliminar = (numero: number) => {
    const c = cuentas.find((x) => x.numero === numero)
    return cuentas.length > 1 && !!c && c.lineas.length === 0 && !c.liquidada
  }
  render(
    <TodasLasCuentas
      cuentas={cuentas}
      activa={1}
      puedeAgregar={false}
      puedeEliminar={puedeEliminar}
      alElegir={() => undefined}
      alActualizar={async () => true}
      alEditarCuentas={() => undefined}
      alEliminar={alEliminar}
      alAgregar={() => undefined}
      alVolver={() => undefined}
    />,
  )
  return alEliminar
}

const confirmar = async (usuario: ReturnType<typeof userEvent.setup>) => {
  const dialogo = await screen.findByRole('dialog')
  await usuario.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))
}

describe('TodasLasCuentas: eliminar cuentas', () => {
  it('la X aparece en cada cuenta vacía, también en las del medio, y no en las que tienen consumo', () => {
    montar([vacia(1), conConsumo(3), vacia(7)])
    expect(screen.getByRole('button', { name: 'Eliminar la cuenta 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar la cuenta 7' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar la cuenta 3' })).not.toBeInTheDocument()
  })

  it('con huecos en la numeración elimina por el número de cuenta, no por la posición', async () => {
    const usuario = userEvent.setup()
    const alEliminar = montar([vacia(1), vacia(3), vacia(7)])
    await usuario.click(screen.getByRole('button', { name: 'Eliminar la cuenta 3' }))
    await confirmar(usuario)
    expect(alEliminar).toHaveBeenCalledWith([3])
  })

  it('cancelar la confirmación no elimina nada', async () => {
    const usuario = userEvent.setup()
    const alEliminar = montar([vacia(1), vacia(2)])
    await usuario.click(screen.getByRole('button', { name: 'Eliminar la cuenta 2' }))
    await usuario.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    )
    expect(alEliminar).not.toHaveBeenCalled()
  })

  it('elimina varias a la vez y solo deja elegir cuentas vacías', async () => {
    const usuario = userEvent.setup()
    const alEliminar = montar([vacia(1), vacia(2), conConsumo(4), vacia(9)])
    await usuario.click(screen.getByRole('button', { name: 'Eliminar varias' }))
    await usuario.click(screen.getByRole('button', { name: /CUENTA 2/ }))
    await usuario.click(screen.getByRole('button', { name: /CUENTA 9/ }))
    expect(screen.getByRole('button', { name: /CUENTA 4/ })).toBeDisabled()
    await usuario.click(screen.getByRole('button', { name: 'Eliminar (2)' }))
    await confirmar(usuario)
    expect(alEliminar).toHaveBeenCalledWith([2, 9])
  })

  it('no permite eliminar todas: "Todas las vacías" deja una', async () => {
    const usuario = userEvent.setup()
    const alEliminar = montar([vacia(1), vacia(2), vacia(3)])
    await usuario.click(screen.getByRole('button', { name: 'Eliminar varias' }))
    await usuario.click(screen.getByRole('button', { name: 'Todas las vacías' }))
    await usuario.click(screen.getByRole('button', { name: 'Eliminar (2)' }))
    await confirmar(usuario)
    expect(alEliminar).toHaveBeenCalledWith([2, 3])
  })
})
