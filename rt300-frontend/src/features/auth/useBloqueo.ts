import { useEffect, useRef, useSyncExternalStore } from 'react'
import { notificar } from '@/shared/avisos/almacen'
import { BLOQUEO_MS, useAlmacenBloqueo } from './almacenBloqueo'

const suscribir = (callback: () => void) => {
  const id = window.setInterval(callback, 1000)
  return () => window.clearInterval(id)
}

export const formatoTiempo = (segundos: number) =>
  `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`

export const useBloqueo = (usuario: string) => {
  const hasta = useAlmacenBloqueo((s) => s.usuarios[usuario]?.bloqueadoHasta ?? null)
  const reiniciar = useAlmacenBloqueo((s) => s.reiniciar)
  const estuvoBloqueado = useRef(false)

  const restante = useSyncExternalStore(
    suscribir,
    () => (hasta ? Math.max(0, Math.ceil((hasta - Date.now()) / 1000)) : 0),
    () => 0,
  )

  useEffect(() => {
    if (restante > 0) estuvoBloqueado.current = true
    if (hasta && restante === 0) {
      reiniciar(usuario)
      if (estuvoBloqueado.current) {
        notificar.exito(`Ya puedes volver a intentar con ${usuario}.`, 'Bloqueo finalizado')
      }
      estuvoBloqueado.current = false
    }
  }, [hasta, restante, reiniciar, usuario])

  return { bloqueado: restante > 0, restante, total: BLOQUEO_MS / 1000, hasta }
}
