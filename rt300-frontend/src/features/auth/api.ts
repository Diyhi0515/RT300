import { http } from '@/lib/http'
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
  return esquemaRespuestaUsuarios.parse(data)
}

export const cerrarSesion = async () => {
  await http.post('/auth/logout')
}
