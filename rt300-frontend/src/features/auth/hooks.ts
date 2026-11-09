import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ERROR_POR_DEFECTO } from '@/lib/mensajesError'
import { ErrorApi } from '@/lib/http'
import { notificar, useAvisos } from '@/shared/avisos/almacen'
import { listarUsuarios, iniciarSesion, cerrarSesion } from './api'
import { MAX_INTENTOS, useAlmacenBloqueo } from './almacenBloqueo'
import { useSesion } from './store'

export const useIniciarSesion = () => {
  const iniciar = useSesion((s) => s.iniciar)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: iniciarSesion,
    meta: { silentError: true },
    onSuccess: (data, variables) => {
      useAlmacenBloqueo.getState().reiniciar(variables.usuario)
      iniciar(data.perfil, data.access_token, data.refresh_token)
      navigate('/mesas', { replace: true })
    },
    onError: (error, variables) => {
      if (!(error instanceof ErrorApi)) {
        notificar.error(ERROR_POR_DEFECTO)
        return
      }
      if (error.code !== 'CREDENCIALES_INVALIDAS') {
        notificar.error(error.message)
        return
      }
      const { bloqueado, restantes } = useAlmacenBloqueo
        .getState()
        .registrarFallo(variables.usuario)
      if (bloqueado) return
      const aviso =
        restantes === 1
          ? 'Es tu último intento antes del bloqueo temporal.'
          : `Te quedan ${restantes} intentos antes del bloqueo temporal.`
      useAvisos.getState().show({
        tone: MAX_INTENTOS - restantes >= 3 ? 'clubAlert' : 'club',
        title: 'Credenciales incorrectas',
        message: `El usuario o la contraseña no coinciden. ${aviso}`,
        icon: 'shield',
        progress: {
          actual: MAX_INTENTOS - restantes,
          total: MAX_INTENTOS,
          label: 'Intentos usados',
        },
      })
    },
  })
}

export const useUsuarios = () =>
  useQuery({ queryKey: ['auth', 'usuarios'], queryFn: listarUsuarios, retry: false })

export const useCerrarSesion = () => {
  const cerrar = useSesion((s) => s.cerrar)
  const navigate = useNavigate()
  return () => {
    cerrarSesion().catch(() => undefined)
    cerrar()
    navigate('/login', { replace: true })
  }
}
