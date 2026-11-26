import { useEffect, useState } from 'react'
import { BandaAxon } from './BandaAxon'
import { tonos, type Tono } from './tonos'

type Tamano = 'sm' | 'md' | 'lg'

interface CargadorProps {
  tone?: Tono
  label?: string
  size?: Tamano
}

const tamanos: Record<Tamano, { ficha: string; barra: string }> = {
  sm: { ficha: 'size-10 rounded-xl', barra: 'w-16' },
  md: { ficha: 'size-16 rounded-2xl', barra: 'w-28' },
  lg: { ficha: 'size-24 rounded-3xl', barra: 'w-40' },
}

export function Cargador({ tone = 'info', label, size = 'md' }: CargadorProps) {
  const t = tonos[tone]
  const s = tamanos[size]
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
      <div
        className={`grid shrink-0 animate-[breathe_1.6s_ease-in-out_infinite] place-items-center overflow-hidden bg-white shadow-[0_10px_30px_-8px_rgba(27,142,242,0.55)] ring-1 ring-black/5 ${s.ficha}`}
      >
        <img src="/logo-icono.webp" alt="" className="size-full object-contain p-[6%]" />
      </div>
      <div
        className={`relative h-1.5 overflow-hidden rounded-full bg-fg/10 ${s.barra}`}
        aria-hidden
      >
        <span
          className={`absolute inset-y-0 w-2/5 animate-[barrido_1.3s_ease-in-out_infinite] rounded-full ${t.bar}`}
        />
      </div>
      {label ? (
        <p className="text-sm font-semibold text-fg">{label}</p>
      ) : (
        <span className="sr-only">Cargando</span>
      )}
    </div>
  )
}

export function CargadorPantalla({ tone, label = 'Cargando…' }: { tone?: Tono; label?: string }) {
  return (
    <div className="flex min-h-[var(--alto-app,100dvh)] flex-col bg-bg">
      <BandaAxon className="h-28 short:h-20" />
      <div className="grid flex-1 place-items-center">
        <Cargador tone={tone} label={label} size="lg" />
      </div>
    </div>
  )
}

export function CargadorBloque({ tone, label }: { tone?: Tono; label?: string }) {
  return (
    <div className="grid place-items-center py-24">
      <Cargador tone={tone} label={label} />
    </div>
  )
}

interface CargadorDiferidoProps {
  tone?: Tono
  label?: string
  size?: Tamano
  retardoMs?: number
  className?: string
}

export function CargadorDiferido({
  tone,
  label,
  size = 'md',
  retardoMs = 250,
  className = 'py-14',
}: CargadorDiferidoProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const temporizador = window.setTimeout(() => setVisible(true), retardoMs)
    return () => window.clearTimeout(temporizador)
  }, [retardoMs])

  return (
    <div className={`grid min-h-40 place-items-center ${className}`}>
      {visible && (
        <div className="animate-[fade_0.2s_ease-out]">
          <Cargador tone={tone} label={label} size={size} />
        </div>
      )}
    </div>
  )
}
