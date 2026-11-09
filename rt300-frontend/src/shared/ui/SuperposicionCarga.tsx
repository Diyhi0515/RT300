import { createPortal } from 'react-dom'
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
      className="fixed inset-0 z-[60] grid place-items-center bg-black/50 backdrop-blur-sm animate-[fade_0.2s_ease-out_0.15s_both]"
    >
      <div className="rounded-3xl border border-line bg-surface px-10 py-8 shadow-card">
        <Cargador tone={tone} label={label} />
      </div>
    </div>,
    document.body,
  )
}
