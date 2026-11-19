import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http as rutaHttp } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import detalle from '@/test/fixtures/detalle-folio.json'
import mesas from '@/test/fixtures/mesas.json'
import platos from '@/test/fixtures/platos.json'
import secciones from '@/test/fixtures/secciones.json'
import { renderConProveedores } from '@/test/render'
import { servidor } from '@/test/servidor'
import { ComandaPage } from './ComandaPage'

const ocupada = mesas.mesas.find((m) => m.folio)!
const primeraSeccion = secciones.secciones.find((s) => s.cssm === 0)!
const plato = platos.platos[0]
const cuenta = detalle.cuentas[0].ncta

const abrirPagina = () => {
  servidor.use(
    rutaHttp.get('*/api/v1/salon/mesas', () => HttpResponse.json(mesas)),
    rutaHttp.get('*/api/v1/salon/folios/:folio/detalle', () => HttpResponse.json(detalle)),
    rutaHttp.get('*/api/v1/menu/secciones', () => HttpResponse.json(secciones)),
    rutaHttp.get('*/api/v1/menu/secciones/:s/:ss/platos', () => HttpResponse.json(platos)),
  )
  return renderConProveedores(<ComandaPage />, {
    ruta: `/pedidos/comanda/${ocupada.mesa}/${cuenta}`,
    patron: '/pedidos/comanda/:codigo/:cuenta',
  })
}

const entrarALaCategoria = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.click(
    await screen.findByRole('button', { name: new RegExp(primeraSeccion.descripcion, 'i') }),
  )
}

afterEach(() => sessionStorage.clear())

const hayBorrador = () =>
  Object.keys(sessionStorage).some((k) => k.startsWith('rt300:borrador-comanda:'))

describe('ComandaPage', () => {
  it('al abrir muestra primero las categorías y no los productos', async () => {
    abrirPagina()

    expect(await screen.findByText('Elige una categoría')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: new RegExp(primeraSeccion.descripcion, 'i') }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `Agregar ${plato.descripcion}` })).toBeNull()
  })

  it('elegir una categoría muestra sus productos y se puede volver a las categorías', async () => {
    const usuario = userEvent.setup()
    abrirPagina()
    await entrarALaCategoria(usuario)

    expect(
      await screen.findByRole('button', { name: `Agregar ${plato.descripcion}` }),
    ).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Volver a las categorías' }))

    expect(await screen.findByText('Elige una categoría')).toBeInTheDocument()
  })

  it('envía a cocina solo el código y la cantidad de cada producto (el precio lo decide el servidor)', async () => {
    let cuerpo: unknown = null
    let ruta = ''
    servidor.use(
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/:cuenta/comandas', async ({ request }) => {
        cuerpo = await request.json()
        ruta = new URL(request.url).pathname
        return HttpResponse.json({ comanda: 1, estado: 'ok' })
      }),
    )
    const usuario = userEvent.setup()
    abrirPagina()
    await entrarALaCategoria(usuario)

    await usuario.click(await screen.findByRole('button', { name: `Agregar ${plato.descripcion}` }))
    await usuario.click(screen.getByRole('button', { name: `Agregar ${plato.descripcion}` }))
    await usuario.click(screen.getAllByRole('button', { name: /registrar/i })[0])
    expect(cuerpo).toBeNull()
    await usuario.click(await screen.findByRole('button', { name: 'Sí, registrar' }))

    await waitFor(() => expect(cuerpo).not.toBeNull())
    expect(ruta).toBe(`/api/v1/folios/${ocupada.folio}/cuentas/${cuenta}/comandas`)
    expect(cuerpo).toEqual({ glos: '', items: [{ cart: plato.cart, cant: 2 }] })
  })

  it('guarda lo elegido en un borrador, lo recupera al recargar y lo borra al registrar', async () => {
    servidor.use(
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/:cuenta/comandas', () =>
        HttpResponse.json({ ntmp: 1, comanda: '1' }),
      ),
    )
    const usuario = userEvent.setup()
    const primera = abrirPagina()
    await entrarALaCategoria(usuario)
    await usuario.click(await screen.findByRole('button', { name: `Agregar ${plato.descripcion}` }))

    await waitFor(() => expect(hayBorrador()).toBe(true))
    primera.unmount()

    abrirPagina()
    await entrarALaCategoria(usuario)
    expect(
      await screen.findByRole('button', { name: `Quitar ${plato.descripcion}` }),
    ).toBeInTheDocument()

    await usuario.click(screen.getAllByRole('button', { name: /registrar/i })[0])
    await usuario.click(await screen.findByRole('button', { name: 'Sí, registrar' }))

    await waitFor(() => expect(hayBorrador()).toBe(false))
  })

  it('permite eliminar un producto y vaciar toda la comanda', async () => {
    const usuario = userEvent.setup()
    abrirPagina()
    await entrarALaCategoria(usuario)
    const otro = platos.platos[1]

    await usuario.click(await screen.findByRole('button', { name: `Agregar ${plato.descripcion}` }))
    await usuario.click(screen.getByRole('button', { name: `Agregar ${otro.descripcion}` }))

    await usuario.click(screen.getByRole('button', { name: `Eliminar ${plato.descripcion}` }))
    expect(
      screen.queryByRole('button', { name: `Eliminar ${plato.descripcion}` }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Eliminar ${otro.descripcion}` })).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /vaciar comanda/i }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí, vaciar' }))

    expect(await screen.findByText('Aún no hay productos')).toBeInTheDocument()
    expect(hayBorrador()).toBe(false)
  })

  it('envía la nota, el centro de producción y los extras elegidos para un producto', async () => {
    let cuerpo: { items: unknown[] } | null = null
    servidor.use(
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/:cuenta/comandas', async ({ request }) => {
        cuerpo = (await request.json()) as { items: unknown[] }
        return HttpResponse.json({ ntmp: 1, comanda: '1' })
      }),
      rutaHttp.get('*/api/v1/menu/platos/:cart/centros-produccion', () =>
        HttpResponse.json({ centros: [{ ccpd: 2, nombre: '2 - BARRA', seleccionado: false }] }),
      ),
      rutaHttp.get('*/api/v1/menu/secciones/:s/:ss/extras', () =>
        HttpResponse.json({
          extras: [{ cart: 'E1', impt: 5, descripcion: 'EXTRA QUESO', moneda: 'Bs.' }],
        }),
      ),
    )
    const usuario = userEvent.setup()
    abrirPagina()
    await entrarALaCategoria(usuario)
    await usuario.click(await screen.findByRole('button', { name: `Agregar ${plato.descripcion}` }))

    await usuario.click(screen.getByRole('button', { name: `Nota de ${plato.descripcion}` }))
    await usuario.type(await screen.findByLabelText('Indicación para cocina'), 'sin sal')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    await usuario.click(
      screen.getByRole('button', { name: `Centro de producción de ${plato.descripcion}` }),
    )
    await usuario.click(await screen.findByRole('button', { name: /2 - BARRA/ }))
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    await usuario.click(screen.getByRole('button', { name: `Extras de ${plato.descripcion}` }))
    const agregarExtra = await screen.findByRole('button', { name: 'Agregar un EXTRA QUESO' })
    await usuario.click(agregarExtra)
    await usuario.click(agregarExtra)
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    await usuario.click(screen.getAllByRole('button', { name: /registrar/i })[0])
    await usuario.click(await screen.findByRole('button', { name: 'Sí, registrar' }))

    await waitFor(() => expect(cuerpo).not.toBeNull())
    expect(cuerpo!.items).toEqual([
      {
        cart: plato.cart,
        cant: 1,
        glos: 'SIN SAL',
        ccpd: 2,
        extras: [{ cart: 'E1', cant: 2 }],
      },
    ])
  })

  it('la vista previa del pedido muestra el formato de 40 columnas sin registrar nada', async () => {
    let enviado = false
    servidor.use(
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/:cuenta/comandas', () => {
        enviado = true
        return HttpResponse.json({ ntmp: 1, comanda: '1' })
      }),
    )
    const usuario = userEvent.setup()
    abrirPagina()
    await entrarALaCategoria(usuario)
    expect(screen.getByRole('button', { name: 'Vista previa del pedido' })).toBeDisabled()

    await usuario.click(await screen.findByRole('button', { name: `Agregar ${plato.descripcion}` }))
    await usuario.click(screen.getByRole('button', { name: 'Vista previa del pedido' }))

    const texto = (await screen.findByLabelText('Texto del pedido')).textContent ?? ''
    expect(texto).toContain('PEDIDO DE MESA')
    expect(texto).toContain(`Mesa  : ${ocupada.mesa}`)
    expect(texto).toContain(plato.descripcion.slice(0, 34).trimEnd())
    expect(enviado).toBe(false)
  })

  it('sin productos el botón de enviar está deshabilitado', async () => {
    abrirPagina()

    await screen.findByText('Elige una categoría')

    expect(screen.getByRole('button', { name: /registrar comanda/i })).toBeDisabled()
  })

  it('si el usuario cancela la confirmación no se envía nada', async () => {
    let enviado = false
    servidor.use(
      rutaHttp.post('*/api/v1/folios/:folio/cuentas/:cuenta/comandas', () => {
        enviado = true
        return HttpResponse.json({ comanda: 1, estado: 'ok' })
      }),
    )
    const usuario = userEvent.setup()
    abrirPagina()
    await entrarALaCategoria(usuario)

    await usuario.click(await screen.findByRole('button', { name: `Agregar ${plato.descripcion}` }))
    await usuario.click(screen.getAllByRole('button', { name: /registrar/i })[0])
    await usuario.click(await screen.findByRole('button', { name: /cancelar/i }))

    expect(enviado).toBe(false)
    expect(screen.queryByRole('button', { name: 'Sí, registrar' })).not.toBeInTheDocument()
  })
})
