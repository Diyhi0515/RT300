import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { esquemaFormularioInicio, type DatosFormularioInicio } from './esquemas'
import { useIniciarSesion } from './hooks'
import { useAlmacenBloqueo } from './almacenBloqueo'
import { useBloqueo } from './useBloqueo'

const CLAVE_RECORDAR = 'rt300-last-user'

const leerRecordado = () => {
  try {
    return localStorage.getItem(CLAVE_RECORDAR) ?? ''
  } catch {
    return ''
  }
}

const guardarRecordado = (valor: string | null) => {
  try {
    if (valor) localStorage.setItem(CLAVE_RECORDAR, valor)
    else localStorage.removeItem(CLAVE_RECORDAR)
  } catch {
    return
  }
}

export const useFormularioInicio = () => {
  const [recordar, setRecordar] = useState(() => !!leerRecordado())
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
    defaultValues: { usuario: leerRecordado(), clave: '' },
  })

  const usuario = useWatch({ control, name: 'usuario' })
  const usuarioActual = usuario.trim().toUpperCase()
  const { bloqueado, restante, total, hasta } = useBloqueo(usuarioActual)

  const seleccionar = (valor: string) => {
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
      guardarRecordado(recordar ? usuarioFinal : null)
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
    recordar,
    setRecordar,
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
