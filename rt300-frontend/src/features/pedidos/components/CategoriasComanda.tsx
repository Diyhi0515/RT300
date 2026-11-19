import { ChevronRight } from 'lucide-react'
import type { SeccionMenu } from '../types'
import { IconoSeccion } from './IconoSeccion'

interface CategoriasComandaProps {
  secciones: SeccionMenu[]
  cargando: boolean
  alElegir: (seccion: SeccionMenu) => void
}

export function CategoriasComanda({ secciones, cargando, alElegir }: CategoriasComandaProps) {
  return (
    <section aria-label="Categorías del menú" className="space-y-1">
      <div className="sticky top-[73px] z-20 -mx-4 bg-bg px-4 pb-2 pt-1 short:top-[57px]">
        <h2 className="text-base font-extrabold sm:text-lg lg:text-2xl">Elige una categoría</h2>
        <p className="text-xs text-muted sm:text-sm lg:text-base">
          Luego escoge los productos de la comanda.
        </p>
      </div>
      {cargando && (
        <p role="status" className="py-10 text-center text-sm text-muted">
          Cargando menú...
        </p>
      )}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] lg:gap-4">
        {secciones.map((s, i) => {
          return (
            <li key={s.codigo}>
              <button
                type="button"
                onClick={() => alElegir(s)}
                style={{ animationDelay: `${Math.min(i, 8) * 15}ms` }}
                className="group flex min-h-[7.25rem] lg:min-h-[9.5rem] lg:p-5 w-full animate-[chip-in_0.16s_ease-out_both] cursor-pointer flex-col justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-[0_8px_22px_rgba(1,21,38,.05)] transition hover:-translate-y-0.5 hover:border-primary/50 active:scale-95 short:min-h-[5.5rem] short:gap-1.5 short:p-2.5"
              >
                <span className="grid size-11 place-items-center rounded-xl lg:size-14 bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-md shadow-club-pc/30 short:size-9">
                  <IconoSeccion nombre={s.nombre} className="size-5 lg:size-7" />
                </span>
                <span className="flex items-end justify-between gap-1">
                  <span className="min-w-0">
                    <strong className="line-clamp-3 block text-sm font-extrabold lg:text-base uppercase leading-tight [overflow-wrap:anywhere]">
                      {s.nombre}
                    </strong>
                    {s.subsecciones.length > 0 && (
                      <small className="text-[11px] text-muted lg:text-sm">
                        {s.subsecciones.length}{' '}
                        {s.subsecciones.length === 1 ? 'subsección' : 'subsecciones'}
                      </small>
                    )}
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
