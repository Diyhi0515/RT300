import type { LucideIcon } from 'lucide-react'

interface TarjetaIndicadorProps {
  etiqueta: string
  valor: string
  detalle: string
  icono: LucideIcon
  color: string
  indice: number
}

export function TarjetaIndicador({
  etiqueta,
  valor,
  detalle,
  icono: Icono,
  color,
  indice,
}: TarjetaIndicadorProps) {
  return (
    <article
      style={{ animationDelay: `${indice * 70}ms` }}
      className="animate-[chip-in_0.4s_ease-out_both] rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_20px_rgba(1,21,38,.05)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(1,21,38,.1)] short:p-3"
    >
      <span className={`mb-4 grid size-9 place-items-center rounded-xl short:mb-2 ${color}`}>
        <Icono className="size-[19px]" />
      </span>
      <p className="text-xs font-medium text-muted">{etiqueta}</p>
      <strong className="mt-1 block text-2xl font-semibold tabular-nums short:text-xl">
        {valor}
      </strong>
      <p className="mt-1 truncate text-[11px] text-muted">{detalle}</p>
    </article>
  )
}
