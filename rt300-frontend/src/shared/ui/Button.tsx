import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variante
  loading?: boolean
  fullWidth?: boolean
}

const variantes: Record<Variante, string> = {
  primary:
    'bg-primary text-white shadow-[0_8px_20px_-8px_var(--primary)] hover:brightness-110 active:brightness-95',
  secondary: 'bg-elevated text-fg border border-line hover:border-primary',
  ghost: 'bg-transparent text-fg hover:bg-fg/5',
  danger: 'bg-danger text-white hover:brightness-110',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
