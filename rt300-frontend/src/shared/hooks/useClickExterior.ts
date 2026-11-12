import { useEffect, type RefObject } from 'react'

export const useClickExterior = (
  referencia: RefObject<HTMLElement | null>,
  activo: boolean,
  alCerrar: () => void,
) => {
  useEffect(() => {
    if (!activo) return
    const alPresionar = (evento: PointerEvent) => {
      if (!referencia.current?.contains(evento.target as Node)) alCerrar()
    }
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar()
    }
    document.addEventListener('pointerdown', alPresionar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alPresionar)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [referencia, activo, alCerrar])
}
