import { screen } from '@testing-library/react'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { MarcaCabecera } from './MarcaCabecera'

// jsdom no implementa matchMedia, que usa el botón de tema. Se define antes de cargar el componente.
vi.hoisted(() => {
  window.matchMedia ??= (consulta: string) =>
    ({ matches: false, media: consulta, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
})

describe('MarcaCabecera', () => {
  it('muestra el nombre del negocio que entrega el servidor', async () => {
    renderConProveedores(<MarcaCabecera />)

    expect(await screen.findByText('NEGOCIO DE PRUEBA')).toBeInTheDocument()
  })

  it('si no se puede leer, muestra el nombre de la aplicación', async () => {
    servidor.use(rutaHttp.get('*/api/v1/negocio', () => HttpResponse.json({}, { status: 500 })))
    renderConProveedores(<MarcaCabecera />)

    expect(await screen.findByText('RT - AXON')).toBeInTheDocument()
  })
})
