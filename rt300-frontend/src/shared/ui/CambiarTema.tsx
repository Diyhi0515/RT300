import { Moon, Sun } from 'lucide-react'
import { useTema } from '@/shared/hooks/useTema'

interface CambiarTemaProps {
  className?: string
  onDark?: boolean
  compact?: boolean
}

export function CambiarTema({ className = '', onDark = true, compact = false }: CambiarTemaProps) {
  const theme = useTema((s) => s.theme)
  const toggle = useTema((s) => s.toggle)
  const dark = theme === 'dark'
  const look = onDark
    ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
    : 'border-line bg-elevated text-fg hover:border-primary'
  const icon = 'absolute size-5 transition-all duration-300 ease-out'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-pressed={dark}
      className={`grid ${compact ? 'size-10' : 'size-12'} place-items-center overflow-hidden rounded-xl border transition active:scale-95 ${look} ${className}`}
    >
      <span className="relative grid size-5 place-items-center">
        <Sun
          className={`${icon} ${dark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`}
        />
        <Moon
          className={`${icon} ${dark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
        />
      </span>
    </button>
  )
}
