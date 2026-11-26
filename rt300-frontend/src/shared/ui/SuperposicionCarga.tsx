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
      className="fixed inset-0 z-[85] grid place-items-center bg-black/55 px-6 escritorio:backdrop-blur-sm animate-[fade_0.15s_ease-out_0.15s_both]"
    >
      <div className="w-full max-w-[17rem] overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <BandaAxon tamano="sm" className="h-16" />
        <div className="grid place-items-center px-8 pb-8 pt-7">
          <Cargador tone={tone} label={label} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
