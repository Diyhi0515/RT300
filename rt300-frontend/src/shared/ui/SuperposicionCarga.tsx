import { createPortal } from 'react-dom'
import { BandaAxon } from './BandaAxon'
import { Cargador } from './Cargador'
import type { Tono } from './tonos'

interface SuperposicionCargaProps {
  open: boolean
  tone?: Tono
  label?: string
}

export function SuperposicionCarga({
  open,
  tone = 'info',
  label = 'Procesando…',
}: SuperposicionCargaProps) {
  if (!open) return null
  return createPortal(
    <div
      aria-busy
      className="fixed inset-0 z-[85] grid place-items-center bg-black/55 px-6 backdrop-blur-sm animate-[fade_0.2s_ease-out_0.15s_both]"
    >
      <div className="w-full max-w-[17rem] overflow-hidden rounded-3xl border border-line bg-surface shadow-card short:flex short:max-w-md short:items-stretch">
        <BandaAxon tamano="sm" className="h-16 short:h-auto short:basis-[38%] short:shrink-0" />
        <div className="grid place-items-center px-8 pb-8 pt-7 short:flex-1 short:px-6 short:py-5">
          <Cargador tone={tone} label={label} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
