import { useEffect } from 'react'
import { CircleCheck, CircleX, Info, ShieldX, TriangleAlert } from 'lucide-react'
import type { IconoAviso, ProgresoAviso } from '@/shared/avisos/almacen'
import { BandaAxon } from './BandaAxon'
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
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [open, duration, noticeId, onClose])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      tone="axon"
      capa="z-[90]"
      className="short:max-w-2xl"
    >
      <div className="short:flex short:items-stretch">
        <BandaAxon className="h-28 pb-8 short:h-auto short:basis-[40%] short:shrink-0 short:pb-0" />
        <div
          role="alert"
          className="flex flex-col items-center gap-3 px-6 pb-8 text-center short:flex-1 short:justify-center short:gap-2 short:px-6 short:py-5"
        >
          <span
            className={`relative z-10 -mt-10 grid size-[76px] short:mt-0 short:size-14 animate-[pop_0.16s_cubic-bezier(0.2,0.9,0.3,1)] place-items-center rounded-3xl shadow-lg ring-4 ring-surface ${t.solid}`}
          >
            <Icon className="size-9 short:size-7" strokeWidth={2} aria-hidden />
          </span>
          <p className="text-xl font-bold tracking-tight short:text-lg">{title}</p>
          {message && (
            <p className="max-w-xs text-pretty text-muted short:max-w-none short:text-sm">
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
                      i < progress.actual ? t.bar : 'bg-fg/15'
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
      </div>
      <div className="h-1.5 w-full bg-fg/5" aria-hidden>
        <div
          key={noticeId}
          className={`h-full origin-left ${t.bar}`}
          style={{ animation: `drain ${duration}ms linear both` }}
        />
      </div>
    </Modal>
  )
}
