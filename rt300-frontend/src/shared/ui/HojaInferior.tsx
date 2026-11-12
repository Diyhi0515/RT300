import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface HojaInferiorProps {
  abierta: boolean
  alCerrar: () => void
  titulo: string
  children: ReactNode
}

export function HojaInferior({ abierta, alCerrar, titulo, children }: HojaInferiorProps) {
  const idTitulo = useId()

  useEffect(() => {
    if (!abierta) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', alTeclear)
    }
  }, [abierta, alCerrar])

  if (!abierta) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end animate-[fade_0.2s_ease-out] bg-black/55 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={alCerrar}
        className="absolute inset-0 cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="relative mx-auto flex max-h-[88dvh] w-full max-w-lg animate-[subir_0.28s_cubic-bezier(0.2,0.9,0.3,1)] flex-col overflow-hidden rounded-t-[28px] border-t border-line bg-surface text-fg shadow-[0_-24px_70px_rgba(1,21,38,.35)]"
      >
        <div className="relative flex shrink-0 items-center justify-between px-5 pb-1 pt-3">
          <span className="absolute left-1/2 top-2 h-1.5 w-11 -translate-x-1/2 rounded-full bg-line" />
          <h2 id={idTitulo} className="sr-only">
            {titulo}
          </h2>
        </div>
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 grid size-10 cursor-pointer place-items-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-fg active:scale-95"
        >
          <X className="size-5" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  )
}
