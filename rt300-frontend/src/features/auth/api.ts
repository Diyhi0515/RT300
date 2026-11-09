import { http, tokens } from '@/lib/http'
import {
  esquemaRespuestaInicio,
  esquemaRespuestaUsuarios,
  type DatosFormularioInicio,
} from './esquemas'

export const iniciarSesion = async (form: DatosFormularioInicio) => {
  const { data } = await http.post('/auth/login', form)
  return esquemaRespuestaInicio.parse(data)
}

export const listarUsuarios = async () => {
  const { data } = await http.get('/auth/usuarios')
  return esquemaRespuestaUsuarios.parse(data).usuarios
}

export const cerrarSesion = async () => {
  const acceso = tokens.obtenerAcceso()
  const renovacion = tokens.obtenerRenovacion()
  await http.post(
    '/auth/logout',
    { refresh_token: renovacion },
    { headers: acceso ? { Authorization: `Bearer ${acceso}` } : undefined },
  )
}
