import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  dismissible?: boolean
  className?: string
  tone?: 'default' | 'club'
}

const estilosPanel = {
  default: 'border border-line bg-surface text-fg shadow-card',
  club: 'bg-club-card text-club-text shadow-2xl shadow-club-pc/15 ring-1 ring-club-text/5 dark:bg-[linear-gradient(160deg,#18284b_0%,#111c35_55%,#0e1830_100%)] dark:shadow-[0_0_90px_-25px_rgba(79,124,255,0.55)] dark:ring-white/12',
}

const estilosCierre = {
  default: 'text-muted hover:bg-fg/5 hover:text-fg',
  club: 'text-club-variant hover:bg-club-high hover:text-club-text',
}

export function Modal({
  open,
  onClose,
  children,
  title,
  dismissible = true,
  className = '',
  tone = 'default',
}: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, dismissible, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="px-safe pb-safe pt-safe fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 py-6 backdrop-blur-sm animate-[fade_0.2s_ease-out]"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative w-full max-w-sm animate-[pop_0.25s_cubic-bezier(0.2,1.2,0.4,1)] overflow-hidden rounded-3xl ${estilosPanel[tone]} ${className}`}
      >
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={`absolute right-2 top-2 z-10 grid size-11 place-items-center rounded-xl transition ${estilosCierre[tone]}`}
          >
            <X className="size-5" />
          </button>
        )}
        {title && (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
