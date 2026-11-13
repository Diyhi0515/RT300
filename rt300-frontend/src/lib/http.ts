import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { env } from './env'
import { ERROR_POR_DEFECTO, resolverMensajeError } from './mensajesError'

const CLAVE_SESION = 'rt300-sesion'
const CABECERA_CSRF = { 'X-Requested-With': 'rt300' }

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
  haySesionRenovable: () => {
    try {
      return sessionStorage.getItem(CLAVE_SESION) === '1'
    } catch {
      return false
    }
  },
  fijarSesionRenovable: (activa: boolean) => {
    try {
      if (activa) sessionStorage.setItem(CLAVE_SESION, '1')
      else sessionStorage.removeItem(CLAVE_SESION)
    } catch {
      return
    }
  },
  limpiar: () => {
    tokenAcceso = null
    tokens.fijarSesionRenovable(false)
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
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

const clienteSimple = axios.create({
  adapter,
  baseURL: env.apiUrl,
  timeout: 20_000,
  withCredentials: true,
})

let renovando: Promise<string | null> | null = null

const esRutaAuth = (url?: string) => !!url?.startsWith('/auth/')

const renovarAcceso = async () => {
  if (!tokens.haySesionRenovable()) return null
  try {
    const { data } = await clienteSimple.post<{ access_token: string }>('/auth/refresh', null, {
      headers: CABECERA_CSRF,
    })
    tokenAcceso = data.access_token
    return tokenAcceso
  } catch {
    return null
  }
}

const renovarCompartido = () => {
  renovando ??= renovarAcceso().finally(() => {
    renovando = null
  })
  return renovando
}

http.interceptors.request.use(async (config) => {
  if (!tokenAcceso && !esRutaAuth(config.url) && tokens.haySesionRenovable()) await renovarCompartido()
  if (tokenAcceso) config.headers.Authorization = `Bearer ${tokenAcceso}`
  return config
})

export const revocarSesion = async () => {
  const acceso = tokenAcceso
  if (!acceso && !tokens.haySesionRenovable()) return
  await clienteSimple.post('/auth/logout', null, {
    headers: acceso ? { ...CABECERA_CSRF, Authorization: `Bearer ${acceso}` } : CABECERA_CSRF,
  })
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
    const isAuthCall = esRutaAuth(original?.url)

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      const token = await renovarCompartido()
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
