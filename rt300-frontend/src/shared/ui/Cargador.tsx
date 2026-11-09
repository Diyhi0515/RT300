import { tonos, type Tono } from './tonos'

type Tamano = 'sm' | 'md' | 'lg'

interface CargadorProps {
  tone?: Tono
  label?: string
  size?: Tamano
}

const tamanos: Record<Tamano, { box: string; ring: string; core: string }> = {
  sm: { box: 'size-10', ring: 'border-[3px]', core: 'inset-1.5' },
  md: { box: 'size-16', ring: 'border-4', core: 'inset-2.5' },
  lg: { box: 'size-24', ring: 'border-[5px]', core: 'inset-3.5' },
}

export function Cargador({ tone = 'info', label, size = 'md' }: CargadorProps) {
  const t = tonos[tone]
  const s = tamanos[size]
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
      <div className={`relative ${s.box} ${t.text}`}>
        <span className={`absolute inset-0 rounded-full ${s.ring} border-current opacity-15`} />
        <span
          className={`absolute inset-0 animate-spin rounded-full ${s.ring} border-transparent border-t-current border-r-current`}
        />
        <span
          className={`absolute ${s.core} animate-[breathe_1.6s_ease-in-out_infinite] overflow-hidden rounded-full bg-white`}
        >
          <img src="/logo-icono.webp" alt="" className="size-full object-contain p-[7%]" />
        </span>
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
    <div className="grid min-h-dvh place-items-center bg-bg">
      <Cargador tone={tone} label={label} size="lg" />
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
