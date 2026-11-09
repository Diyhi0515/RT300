import { useEffect } from 'react'
import { CircleCheck, CircleX, Info, ShieldX, TriangleAlert } from 'lucide-react'
import type { IconoAviso, ProgresoAviso } from '@/shared/avisos/almacen'
import { Modal } from './Modal'
import { tonos, type Tono } from './tonos'

interface ModalAvisoProps {
  open: boolean
  tone: Tono
  title: string
  message?: string
  duration: number
  noticeId: number
  icon?: IconoAviso
  progress?: ProgresoAviso
  onClose: () => void
}

const iconos = {
  club: Info,
  clubAlert: CircleX,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleX,
}

const iconosPropios = {
  shield: ShieldX,
}

export function ModalAviso({
  open,
  tone,
  title,
  message,
  duration,
  noticeId,
  icon,
  progress,
  onClose,
}: ModalAvisoProps) {
  const t = tonos[tone]
  const Icon = icon ? iconosPropios[icon] : iconos[tone]
  const club = tone === 'club' || tone === 'clubAlert'

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [open, duration, noticeId, onClose])

  return (
    <Modal open={open} onClose={onClose} title={title} tone={club ? 'club' : 'default'}>
      <div role="alert" className="flex flex-col items-center gap-3 px-6 pb-8 pt-8 text-center">
        <div
          className={`relative grid size-20 place-items-center rounded-full ${t.soft} ${t.text}`}
        >
          <span
            className={`absolute inset-0 animate-[ripple_1.8s_ease-out_infinite] rounded-full border-2 border-current opacity-30`}
            aria-hidden
          />
          <Icon className="size-10" strokeWidth={1.75} aria-hidden />
        </div>
        <p className={`text-xl font-bold tracking-tight ${club ? 'text-club-text' : ''}`}>
          {title}
        </p>
        {message && (
          <p className={`max-w-xs text-pretty ${club ? 'text-club-variant' : 'text-muted'}`}>
            {message}
          </p>
        )}

        {progress && (
          <div className="mt-1 w-full max-w-xs space-y-2">
            <div
              role="img"
              aria-label={`${progress.actual} de ${progress.total}`}
              className="flex gap-1.5"
            >
              {Array.from({ length: progress.total }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i < progress.actual ? t.bar : club ? 'bg-club-text/15' : 'bg-fg/15'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs font-semibold ${t.text}`}>
              {progress.label}: {progress.actual} de {progress.total}
            </p>
          </div>
        )}
      </div>
      <div className={`h-1.5 w-full ${club ? 'bg-club-text/10' : 'bg-fg/5'}`} aria-hidden>
        <div
          key={noticeId}
          className={`h-full origin-left ${t.bar}`}
          style={{ animation: `drain ${duration}ms linear both` }}
        />
      </div>
    </Modal>
  )
}
