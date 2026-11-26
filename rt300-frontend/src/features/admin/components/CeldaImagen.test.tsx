import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAvisos } from '@/shared/avisos/almacen'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { CeldaImagen } from './CeldaImagen'

const archivo = (nombre = 'foto.png', tipo = 'image/png', bytes = 10) =>
  new File([new Uint8Array(bytes)], nombre, { type: tipo })

describe('CeldaImagen', () => {
  beforeEach(() => useAvisos.getState().dismiss())

  it('con imagen muestra la miniatura y no ofrece subir otra', () => {
    renderConProveedores(<CeldaImagen cart="A1" nombre="AGUA" tieneImagen />)
    expect(screen.getByRole('img', { name: 'Imagen de AGUA' })).toHaveAttribute('src', expect.stringContaining('/menu/platos/A1/imagen'))
    expect(screen.queryByRole('button', { name: /subir imagen/i })).toBeNull()
  })

  it('sin imagen sube el archivo como multipart en el campo "imagen"', async () => {
    let recibido: { campo: FormDataEntryValue | null; tipoContenido: string | null } | null = null
    servidor.use(
      rutaHttp.post('*/api/v1/menu/platos/:cart/imagen', async ({ request }) => {
        const formulario = await request.formData()
        recibido = { campo: formulario.get('imagen'), tipoContenido: request.headers.get('content-type') }
        return HttpResponse.json({ cart: 'A1', imagen: 'A1.jpg' }, { status: 201 })
      }),
    )
    const usuario = userEvent.setup()
    renderConProveedores(<CeldaImagen cart="A1" nombre="AGUA" tieneImagen={false} />)

    await usuario.upload(screen.getByLabelText('Elegir imagen de AGUA'), archivo())

    await waitFor(() => expect(recibido).not.toBeNull())
    expect((recibido!.campo as Blob).size).toBeGreaterThan(0)
    expect(recibido!.tipoContenido).toMatch(/^multipart\/form-data; boundary=/)
    await waitFor(() => expect(useAvisos.getState().notice?.title).toBe('Imagen guardada'))
  })

  it('no envía nada si el archivo no es una imagen o pesa demasiado', async () => {
    let llamadas = 0
    servidor.use(rutaHttp.post('*/api/v1/menu/platos/:cart/imagen', () => (llamadas++, HttpResponse.json({}, { status: 201 }))))
    const usuario = userEvent.setup({ applyAccept: false })
    renderConProveedores(<CeldaImagen cart="A1" nombre="AGUA" tieneImagen={false} />)
    const entrada = screen.getByLabelText('Elegir imagen de AGUA')

    await usuario.upload(entrada, archivo('virus.exe', 'application/octet-stream'))
    expect(useAvisos.getState().notice?.message).toMatch(/jpg, png/i)
    await usuario.upload(entrada, archivo('enorme.png', 'image/png', 6 * 1024 * 1024))
    expect(useAvisos.getState().notice?.message).toMatch(/supera 5 mb/i)

    expect(llamadas).toBe(0)
  })

  it('si el servidor dice que ya tiene imagen, no se anuncia como guardada', async () => {
    let llamadas = 0
    servidor.use(
      rutaHttp.post('*/api/v1/menu/platos/:cart/imagen', () => {
        llamadas++
        return HttpResponse.json({ error: { code: 'YA_TIENE_IMAGEN', message: 'El producto ya tiene una imagen.' } }, { status: 409 })
      }),
    )
    const usuario = userEvent.setup()
    renderConProveedores(<CeldaImagen cart="A1" nombre="AGUA" tieneImagen={false} />)

    await usuario.upload(screen.getByLabelText('Elegir imagen de AGUA'), archivo())

    await waitFor(() => expect(llamadas).toBe(1))
    expect(useAvisos.getState().notice?.title).not.toBe('Imagen guardada')
  })
})
