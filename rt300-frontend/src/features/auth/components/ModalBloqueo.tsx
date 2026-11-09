import { RotateCcw } from 'lucide-react'
import { notificar } from '@/shared/avisos/almacen'
import { Modal } from '@/shared/ui/Modal'
import { MAX_INTENTOS, useAlmacenBloqueo } from '../almacenBloqueo'
import { formatoTiempo } from '../useBloqueo'

interface ModalBloqueoProps {
  open: boolean
  usuario: string
  restante: number
  total: number
  onClose: () => void
}

const RADIO = 60
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

export function ModalBloqueo({ open, usuario, restante, total, onClose }: ModalBloqueoProps) {
  const fraccion = Math.min(1, Math.max(0, restante / total))

  return (
    <Modal open={open} onClose={onClose} title="Inicio de sesión bloqueado" tone="club">
      <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center">
        <div className="grid h-16 place-items-center rounded-2xl bg-header px-8 shadow-lg shadow-club-pc/20 ring-1 ring-white/10">
          <img
            src="/logo-software.png"
            alt="AXON Software Inteligente"
            width={180}
            height={60}
            className="h-11 w-auto"
          />
        </div>

        <div role="alert" className="space-y-1.5">
          <p className="text-xl font-bold tracking-tight text-club-text">
            Inicio de sesión bloqueado
          </p>
          <p className="max-w-xs text-pretty text-club-variant">
            Superaste los {MAX_INTENTOS} intentos permitidos para {usuario}. Por seguridad podrás
            volver a intentarlo en:
          </p>
        </div>

        <div className="relative grid size-40 place-items-center">
          <span className="absolute inset-3 rounded-full bg-club-low" aria-hidden />
          <svg viewBox="0 0 140 140" className="absolute inset-0 -rotate-90" aria-hidden>
            <defs>
              <linearGradient id="bloqueo-anillo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--club-secondary-container)' }} />
                <stop offset="100%" style={{ stopColor: 'var(--club-primary-container)' }} />
              </linearGradient>
            </defs>
            <circle
              cx="70"
              cy="70"
              r={RADIO}
              fill="none"
              strokeWidth="8"
              className="stroke-club-text/10"
            />
            <circle
              cx="70"
              cy="70"
              r={RADIO}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              stroke="url(#bloqueo-anillo)"
              strokeDasharray={CIRCUNFERENCIA}
              strokeDashoffset={CIRCUNFERENCIA * (1 - fraccion)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear dark:drop-shadow-[0_0_6px_rgba(79,124,255,0.7)]"
            />
          </svg>
          <div className="relative space-y-0.5">
            <p
              role="timer"
              aria-live="off"
              className="text-4xl font-extrabold tabular-nums tracking-tight text-club-text"
            >
              {formatoTiempo(restante)}
            </p>
            <p className="text-xs font-semibold text-club-variant">minutos : segundos</p>
          </div>
        </div>

        <p className="rounded-full bg-club-error-c px-3 py-1 text-xs font-bold text-club-error">
          {MAX_INTENTOS} de {MAX_INTENTOS} intentos usados
        </p>

        <button
          type="button"
          onClick={onClose}
          className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-club-pc text-base font-bold text-white shadow-lg shadow-club-pc/30 transition duration-150 hover:brightness-110 active:scale-[0.98] dark:shadow-[0_8px_28px_-6px_rgba(79,124,255,0.65)]"
        >
          Entendido
        </button>

        {__APP_MODE__ === 'mockup' && (
          <button
            type="button"
            onClick={() => {
              useAlmacenBloqueo.getState().reiniciar()
              notificar.exito('Intentos y bloqueos reiniciados.', 'Modo mockup')
            }}
            className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-club-text/25 text-sm font-semibold text-club-variant transition hover:border-club-pc hover:bg-club-low hover:text-club-text active:scale-[0.98]"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reiniciar bloqueos (solo mockup)
          </button>
        )}
      </div>
    </Modal>
  )
}
