import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vibrar } from '@/lib/vibrar'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { esquemaFormularioInicio, type DatosFormularioInicio } from './esquemas'
import { useIniciarSesion } from './hooks'
import { useAlmacenBloqueo } from './almacenBloqueo'
import { useBloqueo } from './useBloqueo'

try {
  localStorage.removeItem('rt300-last-user')
} catch {
  void 0
}

export const useFormularioInicio = () => {
  const [abiertoHasta, setAbiertoHasta] = useState<number | null>(null)
  const enLinea = useOnlineStatus()
  const { mutateAsync, isPending } = useIniciarSesion()
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    control,
    formState: { errors },
  } = useForm<DatosFormularioInicio>({
    resolver: zodResolver(esquemaFormularioInicio),
    defaultValues: { usuario: '', clave: '' },
  })

  const usuario = useWatch({ control, name: 'usuario' })
  const usuarioActual = usuario.trim().toUpperCase()
  const { bloqueado, restante, total, hasta } = useBloqueo(usuarioActual)

  const seleccionar = (valor: string) => {
    vibrar('toque')
    setValue('usuario', valor, { shouldValidate: true })
    setFocus('clave')
  }

  const limpiar = () => {
    setValue('usuario', '')
    setFocus('usuario')
  }

  const enviar = async (valores: DatosFormularioInicio) => {
    if (bloqueado) return
    const usuarioFinal = valores.usuario.toUpperCase()
    try {
      await mutateAsync({ ...valores, usuario: usuarioFinal })
    } catch {
      const bloqueadoHasta = useAlmacenBloqueo.getState().usuarios[usuarioFinal]?.bloqueadoHasta
      if (bloqueadoHasta) setAbiertoHasta(bloqueadoHasta)
    }
  }

  return {
    register,
    errors,
    usuario,
    usuarioActual,
    seleccionar,
    limpiar,
    alEnviar: handleSubmit(enviar),
    cargando: isPending,
    enLinea,
    bloqueado,
    restante,
    total,
    abrirModal: () => setAbiertoHasta(hasta),
    cerrarModal: () => setAbiertoHasta(null),
    modalAbierto: bloqueado && abiertoHasta === hasta,
  }
}

export type EstadoFormularioInicio = ReturnType<typeof useFormularioInicio>
