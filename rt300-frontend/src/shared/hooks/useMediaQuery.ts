import { useSyncExternalStore } from 'react'

export const useMediaQuery = (consulta: string) =>
  useSyncExternalStore(
    (avisar) => {
      const lista = matchMedia(consulta)
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    () => matchMedia(consulta).matches,
    () => false,
  )
