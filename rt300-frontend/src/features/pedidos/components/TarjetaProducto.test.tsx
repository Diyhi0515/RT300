import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Plato } from '../types'
import { TarjetaProducto } from './TarjetaProducto'

const plato = { id: 'A 1', nombre: 'AGUA', precio: 8 } as Plato

const dibujar = (datos: Plato) =>
  render(
    <ul>
      <TarjetaProducto plato={datos} cantidad={0} indice={0} alCambiarCantidad={() => {}} />
    </ul>,
  )

describe('TarjetaProducto', () => {
  it('muestra la imagen del producto cuando tiene una', () => {
    const { container } = dibujar({ ...plato, imagen: 'agua.jpg' })

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/api/v1/menu/platos/A%201/imagen?w=320',
    )
  })

  it('sin imagen solo muestra nombre y precio', () => {
    const { container } = dibujar(plato)

    expect(screen.getByText('AGUA')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})
