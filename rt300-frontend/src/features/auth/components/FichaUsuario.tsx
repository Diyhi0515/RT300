import { Receipt } from 'lucide-react'
import type { UsuarioLista } from '../types'

interface FichaUsuarioProps {
  usuario: UsuarioLista
  activo: boolean
  onSelect: (usuario: string) => void
  index: number
  variant: 'grid' | 'strip'
  disabled?: boolean
}

export function FichaUsuario({
  usuario,
  activo,
  onSelect,
  index,
  variant,
  disabled = false,
}: FichaUsuarioProps) {
  const supervisor = usuario.usuario === 'MCB'
  const base =
    'flex min-w-0 flex-col items-center justify-center rounded-xl px-1 font-semibold [contain:layout_style] shadow-sm transition duration-200 active:scale-95 animate-[chip-in_0.35s_ease-out_both]'
  const size =
    variant === 'grid'
      ? 'h-16 text-lg short:h-14 short:text-base lg:h-[4.5rem] 2xl:h-20 2xl:text-xl'
      : 'h-16 w-[5.5rem] shrink-0 snap-center text-lg'
  const color = activo
    ? 'bg-club-pc text-white shadow-md ring-2 ring-club-sc dark:shadow-[0_0_24px_rgba(79,124,255,0.6)]'
    : supervisor
      ? 'bg-club-tertiary text-white'
      : variant === 'strip'
        ? 'bg-club-low text-club-text hover:bg-club-high dark:ring-1 dark:ring-white/10'
        : 'bg-club-card text-club-text hover:bg-club-high dark:ring-1 dark:ring-white/10 dark:hover:ring-club-sc/60'

  return (
    <button
      type="button"
      aria-pressed={activo}
      disabled={disabled}
      onClick={() => onSelect(usuario.usuario)}
      style={{ animationDelay: `${Math.min(index, 24) * 30}ms` }}
      className={`${base} ${size} ${color} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span>{usuario.usuario}</span>
      {supervisor && variant === 'strip' ? (
        <Receipt className="size-3.5 opacity-80" aria-hidden />
      ) : (
        <span
          className={`w-full truncate text-center text-xs font-normal short:text-[11px] 2xl:text-sm ${
            activo ? 'text-white' : supervisor ? 'text-white/90' : 'text-club-variant'
          }`}
        >
          {usuario.nombre}
        </span>
      )}
    </button>
  )
}
