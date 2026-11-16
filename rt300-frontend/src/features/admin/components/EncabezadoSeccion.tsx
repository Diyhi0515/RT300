import type { LucideIcon } from 'lucide-react'

interface EncabezadoSeccionProps {
  titulo: string
  descripcion: string
  icono: LucideIcon
}

export function EncabezadoSeccion({ titulo, descripcion, icono: Icono }: EncabezadoSeccionProps) {
  return (
    <header className="mb-5 flex items-start gap-4 short:mb-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1b8ef2]/20 to-[#1b8ef2]/5 text-[#0875cf] dark:text-[#7cc4ff] short:size-10">
        <Icono className="size-[23px]" />
      </span>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-[28px] short:text-xl">{titulo}</h1>
        <p className="text-sm text-muted">{descripcion}</p>
      </div>
    </header>
  )
}
