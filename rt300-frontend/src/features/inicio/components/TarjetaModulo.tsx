import { ArrowUpRight, Lock, LockOpen, type LucideIcon } from 'lucide-react'

export type TonoModulo = 'azul' | 'cian' | 'gris'

interface TarjetaModuloProps {
  titulo: string
  descripcion: string
  icono: LucideIcon
  tono: TonoModulo
  disponible: boolean
  indice: number
  alAbrir: () => void
}

const FONDO: Record<TonoModulo, string> = {
  azul: 'bg-[linear-gradient(135deg,#ffffff_38%,#cfe3fb_100%)] dark:bg-[linear-gradient(135deg,#0f2338_30%,#12408a_100%)]',
  cian: 'bg-[linear-gradient(135deg,#ffffff_38%,#c4f0fb_100%)] dark:bg-[linear-gradient(135deg,#0f2338_30%,#0b6f94_100%)]',
  gris: 'bg-[linear-gradient(135deg,#ffffff_38%,#eceff3_100%)] dark:bg-[linear-gradient(135deg,#0f2338_30%,#1a2a3c_100%)]',
}

const ICONO: Record<TonoModulo, string> = {
  azul: 'bg-gradient-to-br from-[#3aa0ff] to-[#1b66d6] text-white shadow-[0_8px_18px_rgba(27,102,214,.4)]',
  cian: 'bg-gradient-to-br from-[#22c3ee] to-[#0b8fd0] text-white shadow-[0_8px_18px_rgba(11,143,208,.4)]',
  gris: 'bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-white/40',
}

const LINEA: Record<TonoModulo, string> = {
  azul: 'from-[#3aa0ff] to-[#9ccbff]',
  cian: 'from-[#22c3ee] to-[#9be7f7]',
  gris: 'from-slate-300 to-slate-200 dark:from-white/20 dark:to-white/10',
}

export function TarjetaModulo({
  titulo,
  descripcion,
  icono: Icono,
  tono,
  disponible,
  indice,
  alAbrir,
}: TarjetaModuloProps) {
  return (
    <button
      type="button"
      onClick={alAbrir}
      aria-disabled={!disponible}
      style={{ animationDelay: `${indice * 90}ms` }}
      className={`group relative flex h-[230px] w-full animate-[chip-in_0.45s_ease-out_both] cursor-pointer flex-col justify-between overflow-hidden rounded-[28px] border border-line p-5 text-left shadow-[0_14px_34px_rgba(1,21,38,.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(1,21,38,.16)] active:scale-[0.98] short:h-[180px] short:p-4 ${FONDO[tono]}`}
    >
      <Icono
        aria-hidden
        className={`pointer-events-none absolute -bottom-4 -right-4 size-32 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${
          disponible ? 'text-primary/10' : 'text-slate-400/10'
        }`}
        strokeWidth={1.25}
      />

      <div className="flex items-start justify-between">
        <span className={`grid size-12 place-items-center rounded-2xl ${ICONO[tono]}`}>
          <Icono className="size-6" />
        </span>
        {disponible ? (
          <LockOpen className="size-4 text-primary/60" aria-label="Disponible" />
        ) : (
          <Lock className="size-4 text-slate-400" aria-label="No disponible" />
        )}
      </div>

      <div className="relative space-y-1.5">
        <h3 className={`text-lg font-bold tracking-tight ${disponible ? '' : 'text-muted'}`}>
          {titulo}
        </h3>
        <p className="text-[13px] leading-snug text-muted">{descripcion}</p>
        {disponible ? (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[#0a1a3d] px-3 text-xs font-bold text-white transition group-hover:bg-primary dark:bg-white/15">
            Abrir
            <ArrowUpRight className="size-3.5" />
          </span>
        ) : (
          <span className="inline-flex h-7 items-center rounded-lg bg-slate-200/80 px-3 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-white/50">
            Próximamente
          </span>
        )}
      </div>

      <span className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${LINEA[tono]}`} />
    </button>
  )
}
