import { HttpResponse, http as rutaHttp } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { servidor } from '@/test/servidor'
import { alNoAutorizado, ErrorApi, http, revocarSesion, tokens } from './http'

const api = (ruta: string) => `*/api/v1${ruta}`

beforeEach(() => {
  tokens.limpiar()
  alNoAutorizado(() => undefined)
})

describe('http: renovación de sesión', () => {
  it('un 401 renueva el token y repite la petición una sola vez', async () => {
    tokens.fijarAcceso('viejo')
    tokens.fijarRenovacion('refresco')
    const usados: string[] = []
    servidor.use(
      rutaHttp.get(api('/datos'), ({ request }) => {
        const auth = request.headers.get('authorization') ?? ''
        usados.push(auth)
        return auth === 'Bearer nuevo' ? HttpResponse.json({ ok: true }) : new HttpResponse(null, { status: 401 })
      }),
      rutaHttp.post(api('/auth/refresh'), () => HttpResponse.json({ access_token: 'nuevo' })),
    )

    const { data } = await http.get('/datos')

    expect(data).toEqual({ ok: true })
    expect(usados).toEqual(['Bearer viejo', 'Bearer nuevo'])
    expect(tokens.obtenerAcceso()).toBe('nuevo')
  })

  it('varios 401 simultáneos comparten una sola renovación', async () => {
    tokens.fijarAcceso('viejo')
    tokens.fijarRenovacion('refresco')
    const renovaciones = vi.fn()
    servidor.use(
      rutaHttp.get(api('/datos'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer nuevo'
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 }),
      ),
      rutaHttp.post(api('/auth/refresh'), async () => {
        renovaciones()
        await new Promise((r) => setTimeout(r, 30))
        return HttpResponse.json({ access_token: 'nuevo' })
      }),
    )

    const respuestas = await Promise.all([http.get('/datos'), http.get('/datos'), http.get('/datos')])

    expect(respuestas.every((r) => r.status === 200)).toBe(true)
    expect(renovaciones).toHaveBeenCalledTimes(1)
  })

  it('si la renovación falla limpia los tokens y avisa que no está autorizado', async () => {
    tokens.fijarAcceso('viejo')
    tokens.fijarRenovacion('refresco')
    const aviso = vi.fn()
    alNoAutorizado(aviso)
    servidor.use(
      rutaHttp.get(api('/datos'), () => new HttpResponse(null, { status: 401 })),
      rutaHttp.post(api('/auth/refresh'), () => new HttpResponse(null, { status: 401 })),
    )

    await expect(http.get('/datos')).rejects.toMatchObject({ status: 401 })

    expect(tokens.obtenerAcceso()).toBeNull()
    expect(tokens.obtenerRenovacion()).toBeNull()
    expect(aviso).toHaveBeenCalledTimes(1)
  })

  it('sin token de renovación no intenta renovar', async () => {
    const renovar = vi.fn()
    servidor.use(
      rutaHttp.get(api('/datos'), () => new HttpResponse(null, { status: 401 })),
      rutaHttp.post(api('/auth/refresh'), () => {
        renovar()
        return HttpResponse.json({ access_token: 'x' })
      }),
    )

    await expect(http.get('/datos')).rejects.toBeInstanceOf(ErrorApi)
    expect(renovar).not.toHaveBeenCalled()
  })
})

describe('http: errores', () => {
  it('un 401 en el login es credenciales inválidas', async () => {
    servidor.use(rutaHttp.post(api('/auth/login'), () => new HttpResponse(null, { status: 401 })))

    await expect(http.post('/auth/login', {})).rejects.toMatchObject({
      status: 401,
      code: 'CREDENCIALES_INVALIDAS',
      message: 'Usuario o contraseña incorrectos.',
    })
  })

  it('usa el código y el request_id que envía el servidor', async () => {
    servidor.use(
      rutaHttp.get(api('/datos'), () =>
        HttpResponse.json({ error: { code: 'MESA_OCUPADA', message: 'x', request_id: 'abc-1' } }, { status: 409 }),
      ),
    )

    await expect(http.get('/datos')).rejects.toMatchObject({
      status: 409,
      code: 'MESA_OCUPADA',
      requestId: 'abc-1',
      message: 'La mesa ya está ocupada.',
    })
  })

  it('un corte de red se informa como NETWORK_ERROR', async () => {
    servidor.use(rutaHttp.get(api('/datos'), () => HttpResponse.error()))

    await expect(http.get('/datos')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })
})

describe('revocarSesion', () => {
  it('envía el token de acceso y el de renovación al cerrar sesión', async () => {
    tokens.fijarAcceso('acceso')
    tokens.fijarRenovacion('refresco')
    let recibido: { auth: string | null; cuerpo: unknown } | null = null
    servidor.use(
      rutaHttp.post(api('/auth/logout'), async ({ request }) => {
        recibido = { auth: request.headers.get('authorization'), cuerpo: await request.json() }
        return HttpResponse.json({})
      }),
    )

    await revocarSesion()

    expect(recibido).toEqual({ auth: 'Bearer acceso', cuerpo: { refresh_token: 'refresco' } })
  })

  it('si el acceso expiró reintenta con el token de renovación', async () => {
    tokens.fijarAcceso('vencido')
    tokens.fijarRenovacion('refresco')
    const credenciales: string[] = []
    servidor.use(
      rutaHttp.post(api('/auth/logout'), ({ request }) => {
        const auth = request.headers.get('authorization') ?? ''
        credenciales.push(auth)
        return auth === 'Bearer refresco' ? HttpResponse.json({}) : new HttpResponse(null, { status: 401 })
      }),
    )

    await revocarSesion()

    expect(credenciales).toEqual(['Bearer vencido', 'Bearer refresco'])
  })

  it('sin sesión no llama al servidor', async () => {
    const llamada = vi.fn()
    servidor.use(rutaHttp.post(api('/auth/logout'), () => (llamada(), HttpResponse.json({}))))

    await revocarSesion()

    expect(llamada).not.toHaveBeenCalled()
  })
})
