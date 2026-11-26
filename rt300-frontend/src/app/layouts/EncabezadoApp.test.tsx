import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderConProveedores } from '@/test/render'
import { EncabezadoApp } from './EncabezadoApp'

// jsdom no implementa matchMedia, que usa el botón de tema. Se define antes de cargar el componente.
vi.hoisted(() => {
  window.matchMedia ??= (consulta: string) =>
    ({
      matches: false,
      media: consulta,
      addEventListener() {},
      removeEventListener() {},
    }) as unknown as MediaQueryList
})

describe('EncabezadoApp', () => {
  it('muestra el nombre del negocio junto al logo', async () => {
    renderConProveedores(<EncabezadoApp perfilAbierto={false} alCambiarPerfil={() => {}} />)

    expect(await screen.findByTitle('NEGOCIO DE PRUEBA')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'AXON' })).toBeInTheDocument()
  })
})
