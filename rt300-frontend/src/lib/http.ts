import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { env } from './env'
import { ERROR_POR_DEFECTO, resolverMensajeError } from './mensajesError'

const CLAVE_RENOVACION = 'rt300-rt'

export class ErrorApi extends Error {
  status: number
  code: string
  requestId?: string

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message)
    this.name = 'ErrorApi'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

let tokenAcceso: string | null = null
let manejadorNoAutorizado: (() => void) | null = null

export const tokens = {
  obtenerAcceso: () => tokenAcceso,
  fijarAcceso: (value: string | null) => {
    tokenAcceso = value
  },
  obtenerRenovacion: () => {
    try {
      return sessionStorage.getItem(CLAVE_RENOVACION)
    } catch {
      return null
    }
  },
  fijarRenovacion: (value: string | null) => {
    try {
      if (value) sessionStorage.setItem(CLAVE_RENOVACION, value)
      else sessionStorage.removeItem(CLAVE_RENOVACION)
    } catch {
      return
    }
  },
  limpiar: () => {
    tokenAcceso = null
    tokens.fijarRenovacion(null)
  },
}

export const alNoAutorizado = (handler: () => void) => {
  manejadorNoAutorizado = handler
}

const adaptadorSimulado: AxiosAdapter = async (config) =>
  (await import('@/simulados/adaptador')).adaptadorSimulado(config)

const adapter = __APP_MODE__ === 'mockup' ? adaptadorSimulado : undefined

export const http = axios.create({
  adapter,
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

const clienteSimple = axios.create({ adapter, baseURL: env.apiUrl, timeout: 20_000 })

http.interceptors.request.use((config) => {
  if (tokenAcceso) config.headers.Authorization = `Bearer ${tokenAcceso}`
  return config
})

let renovando: Promise<string | null> | null = null

const renovarAcceso = async () => {
  const refresh = tokens.obtenerRenovacion()
  if (!refresh) return null
  try {
    const { data } = await clienteSimple.post<{ access_token: string }>('/auth/refresh', null, {
      headers: { Authorization: `Bearer ${refresh}` },
    })
    tokenAcceso = data.access_token
    return tokenAcceso
  } catch {
    return null
  }
}

export const revocarSesion = async () => {
  const acceso = tokenAcceso
  const renovacion = tokens.obtenerRenovacion()
  if (!acceso && !renovacion) return
  const enviar = (credencial: string) =>
    clienteSimple.post(
      '/auth/logout',
      { refresh_token: renovacion },
      { headers: { Authorization: `Bearer ${credencial}` } },
    )
  try {
    await enviar((acceso ?? renovacion) as string)
  } catch (error) {
    const expirado = error instanceof AxiosError && error.response?.status === 401
    if (expirado && acceso && renovacion) await enviar(renovacion)
    else throw error
  }
}

type ConfigReintento = InternalAxiosRequestConfig & { _retry?: boolean }

type CuerpoError = { error?: { code?: string; message?: string; request_id?: string } }

const aErrorApi = (error: AxiosError<CuerpoError>) => {
  if (!error.response) {
    const code = error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR'
    return new ErrorApi(0, code, resolverMensajeError(code, 0))
  }
  const body = error.response.data?.error
  const status = error.response.status
  const loginFailed = status === 401 && error.config?.url?.startsWith('/auth/login')
  const code = body?.code ?? (loginFailed ? 'CREDENCIALES_INVALIDAS' : 'ERROR')
  return new ErrorApi(
    status,
    code,
    resolverMensajeError(code, status, body?.message) || ERROR_POR_DEFECTO,
    body?.request_id,
  )
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<CuerpoError>) => {
    const original = error.config as ConfigReintento | undefined
    const isAuthCall = original?.url?.startsWith('/auth/')

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      renovando ??= renovarAcceso().finally(() => {
        renovando = null
      })
      const token = await renovando
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return http(original)
      }
      tokens.limpiar()
      manejadorNoAutorizado?.()
    }
    throw aErrorApi(error)
  },
)
