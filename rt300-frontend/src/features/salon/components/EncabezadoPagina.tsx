import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSesion } from '@/features/auth'
import { fechaLarga } from '@/features/inicio/saludo'

interface EncabezadoPaginaProps {
  titulo: string
  icono: LucideIcon
}

export function EncabezadoPagina({ titulo, icono: Icono }: EncabezadoPaginaProps) {
  const perfil = useSesion((s) => s.perfil)

  return (
    <header className="flex items-start gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1b8ef2]/20 to-[#1b8ef2]/5 text-[#0875cf] dark:text-[#7cc4ff] short:size-10">
        <Icono className="size-[23px]" />
      </span>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-[30px] short:text-xl">
          {titulo}
        </h1>
        <p className="truncate text-sm text-muted">
          {fechaLarga()}
          {perfil ? ` · ${perfil.local}` : ''}
        </p>
      </div>
      <Link
        to="/inicio"
        className="ml-auto hidden h-10 shrink-0 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-muted transition hover:border-primary/50 hover:text-fg active:scale-95 md:inline-flex"
      >
        <ArrowLeft className="size-4" />
        Inicio
      </Link>
    </header>
  )
}
