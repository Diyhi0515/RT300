import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { claveDe, perfilDe, usuarios } from './datos'

const RETARDO_MS = 700

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const respuestaOk = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config,
})

const fallar = (config: InternalAxiosRequestConfig, status: number, code: string): never => {
  const response: AxiosResponse = {
    data: { error: { code } },
    status,
    statusText: '',
    headers: {},
    config,
  }
  throw new AxiosError('Mock error', AxiosError.ERR_BAD_REQUEST, config, null, response)
}

const cuerpoDe = (config: InternalAxiosRequestConfig) => {
  try {
    return typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {})
  } catch {
    return {}
  }
}

export const adaptadorSimulado = async (
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> => {
  await esperar(RETARDO_MS)
  const route = `${config.method?.toLowerCase()} ${config.url}`

  if (route === 'get /auth/usuarios') return respuestaOk(config, usuarios)

  if (route === 'post /auth/login') {
    const { usuario, clave } = cuerpoDe(config) as { usuario?: string; clave?: string }
    const perfil = perfilDe((usuario ?? '').toUpperCase())
    if (!perfil || clave !== claveDe(perfil.usuario)) {
      return fallar(config, 401, 'CREDENCIALES_INVALIDAS')
    }
    return respuestaOk(config, {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      perfil,
    })
  }

  if (route === 'post /auth/refresh')
    return respuestaOk(config, { access_token: 'mock-access-token' })
  if (route === 'post /auth/logout') return respuestaOk(config, {})

  return fallar(config, 404, 'NOT_FOUND')
}
