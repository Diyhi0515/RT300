import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { AjustesAdminPage } from './AjustesAdminPage'

const abrir = () => {
  const enviados: string[] = []
  let propio = ''
  const estado = () => ({
    nombre: propio || 'EMPRESA DE LA BASE',
    nombre_base: 'EMPRESA DE LA BASE',
    personalizado: !!propio,
  })
  servidor.use(
    rutaHttp.get('*/api/v1/negocio/ajustes', () => HttpResponse.json(estado())),
    rutaHttp.put('*/api/v1/negocio/ajustes', async ({ request }) => {
      propio = ((await request.json()) as { nombre: string }).nombre
      enviados.push(propio)
      return HttpResponse.json(estado())
    }),
  )
  renderConProveedores(<AjustesAdminPage />)
  return enviados
}

const campo = () => screen.findByRole('textbox', { name: 'Nombre del negocio' })

describe('AjustesAdminPage', () => {
  it('guarda un nombre nuevo y permite volver al de la base', async () => {
    const usuario = userEvent.setup()
    const enviados = abrir()
    expect(await campo()).toHaveValue('EMPRESA DE LA BASE')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()

    await usuario.clear(await campo())
    await usuario.type(await campo(), 'Mi Restaurante')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    await usuario.click(await screen.findByRole('button', { name: 'Usar el de la base' }))

    await waitFor(async () => expect(await campo()).toHaveValue('EMPRESA DE LA BASE'))
    expect(enviados).toEqual(['Mi Restaurante', ''])
  })

  it('no deja guardar un nombre vacío', async () => {
    const usuario = userEvent.setup()
    abrir()

    await usuario.clear(await campo())

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })
})
