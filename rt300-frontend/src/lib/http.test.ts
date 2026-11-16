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
    tokens.fijarSesionRenovable(true)
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
    tokens.fijarSesionRenovable(true)
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
    tokens.fijarSesionRenovable(true)
    const aviso = vi.fn()
    alNoAutorizado(aviso)
    servidor.use(
      rutaHttp.get(api('/datos'), () => new HttpResponse(null, { status: 401 })),
      rutaHttp.post(api('/auth/refresh'), () => new HttpResponse(null, { status: 401 })),
    )

    await expect(http.get('/datos')).rejects.toMatchObject({ status: 401 })

    expect(tokens.obtenerAcceso()).toBeNull()
    expect(tokens.haySesionRenovable()).toBe(false)
    expect(aviso).toHaveBeenCalledTimes(1)
  })

  it('sin sesión renovable no intenta renovar', async () => {
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

describe('http: recarga de la página (token de acceso solo en memoria)', () => {
  it('renueva antes de enviar y no genera 401 innecesarios', async () => {
    tokens.fijarSesionRenovable(true)
    const llamadas: string[] = []
    servidor.use(
      rutaHttp.get(api('/datos'), ({ request }) => {
        llamadas.push(request.headers.get('authorization') ?? 'sin token')
        return HttpResponse.json({ ok: true })
      }),
      rutaHttp.post(api('/auth/refresh'), () => HttpResponse.json({ access_token: 'nuevo' })),
    )

    await http.get('/datos')

    expect(llamadas).toEqual(['Bearer nuevo'])
  })

  it('varias consultas simultáneas comparten una sola renovación', async () => {
    tokens.fijarSesionRenovable(true)
    const renovaciones = vi.fn()
    servidor.use(
      rutaHttp.get(api('/datos'), () => HttpResponse.json({ ok: true })),
      rutaHttp.post(api('/auth/refresh'), async () => {
        renovaciones()
        await new Promise((r) => setTimeout(r, 30))
        return HttpResponse.json({ access_token: 'nuevo' })
      }),
    )

    await Promise.all([http.get('/datos'), http.get('/datos'), http.get('/datos')])

    expect(renovaciones).toHaveBeenCalledTimes(1)
  })

  it('sin ninguna sesión no intenta renovar', async () => {
    const renovar = vi.fn()
    servidor.use(
      rutaHttp.get(api('/datos'), () => HttpResponse.json({ ok: true })),
      rutaHttp.post(api('/auth/refresh'), () => (renovar(), HttpResponse.json({ access_token: 'x' }))),
    )

    await http.get('/datos')

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
  it('envía el acceso y la cabecera anti-CSRF, sin cuerpo: la renovación viaja en la cookie', async () => {
    tokens.fijarAcceso('acceso')
    tokens.fijarSesionRenovable(true)
    let recibido: { auth: string | null; csrf: string | null; cuerpo: string } | null = null
    servidor.use(
      rutaHttp.post(api('/auth/logout'), async ({ request }) => {
        recibido = {
          auth: request.headers.get('authorization'),
          csrf: request.headers.get('x-requested-with'),
          cuerpo: await request.text(),
        }
        return HttpResponse.json({})
      }),
    )

    await revocarSesion()

    expect(recibido).toEqual({ auth: 'Bearer acceso', csrf: 'rt300', cuerpo: '' })
  })

  it('sin token de acceso igual cierra la sesión con la cookie', async () => {
    tokens.fijarSesionRenovable(true)
    let auth: string | null = 'pendiente'
    servidor.use(
      rutaHttp.post(api('/auth/logout'), ({ request }) => {
        auth = request.headers.get('authorization')
        return HttpResponse.json({})
      }),
    )

    await revocarSesion()

    expect(auth).toBeNull()
  })

  it('sin sesión no llama al servidor', async () => {
    const llamada = vi.fn()
    servidor.use(rutaHttp.post(api('/auth/logout'), () => (llamada(), HttpResponse.json({}))))

    await revocarSesion()

    expect(llamada).not.toHaveBeenCalled()
  })
})

describe('http: cookie de renovación', () => {
  it('la renovación manda la cabecera anti-CSRF y ninguna credencial en Authorization ni en el cuerpo', async () => {
    tokens.fijarSesionRenovable(true)
    let visto: { csrf: string | null; auth: string | null; cuerpo: string } | null = null
    servidor.use(
      rutaHttp.get(api('/datos'), () => HttpResponse.json({ ok: true })),
      rutaHttp.post(api('/auth/refresh'), async ({ request }) => {
        visto = {
          csrf: request.headers.get('x-requested-with'),
          auth: request.headers.get('authorization'),
          cuerpo: await request.text(),
        }
        return HttpResponse.json({ access_token: 'nuevo' })
      }),
    )

    await http.get('/datos')

    expect(visto).toEqual({ csrf: 'rt300', auth: null, cuerpo: '' })
  })

  it('las peticiones llevan credenciales para que el navegador envíe la cookie', () => {
    expect(http.defaults.withCredentials).toBe(true)
  })

  it('el token de renovación nunca se guarda en el almacenamiento del navegador', () => {
    tokens.fijarSesionRenovable(true)
    const guardado = JSON.stringify({ ...sessionStorage }) + JSON.stringify({ ...localStorage })
    expect(guardado).not.toMatch(/refresh|renovacion|token/i)
  })
})
