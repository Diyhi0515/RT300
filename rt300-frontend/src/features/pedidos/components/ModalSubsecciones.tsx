import { useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { Modal } from '@/shared/ui/Modal'
import { nombreLegible } from '../nombreLegible'
import type { SeccionMenu } from '../types'
import { IconoSeccion } from './IconoSeccion'

interface ModalSubseccionesProps {
  abierto: boolean
  seccion: SeccionMenu
  subseccion: number
  alElegir: (codigo: number) => void
  alCerrar: () => void
}

const UMBRAL_BUSCADOR = 8

export function ModalSubsecciones({
  abierto,
  seccion,
  subseccion,
  alElegir,
  alCerrar,
}: ModalSubseccionesProps) {
  const [filtro, setFiltro] = useState('')
  const total = seccion.subsecciones.length
  const texto = filtro.trim().toLowerCase()
  const opciones = [{ codigo: 0, nombre: 'Todas' }, ...seccion.subsecciones].filter(
    (s) => s.codigo === 0 || !texto || s.nombre.toLowerCase().includes(texto),
  )

  const cerrar = () => {
    setFiltro('')
    alCerrar()
  }

  return (
    <Modal
      open={abierto}
      onClose={cerrar}
      title={`Subcategorías de ${seccion.nombre}`}
      className="max-w-4xl!"
    >
      <div className="flex items-center gap-3 border-b border-line bg-gradient-to-r from-club-pc/15 via-club-pc/5 to-transparent px-5 py-4 pr-14 lg:gap-4 lg:px-6 lg:py-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-lg shadow-club-pc/30 lg:size-14">
          <IconoSeccion nombre={seccion.nombre} className="size-6 lg:size-7" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold uppercase leading-tight [overflow-wrap:anywhere] lg:text-2xl">
            {nombreLegible(seccion.nombre)}
          </h3>
          <p className="text-xs text-muted lg:text-sm">
            {total} {total === 1 ? 'subcategoría' : 'subcategorías'} · elige una para filtrar los
            productos
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5 lg:p-6">
        {total > UMBRAL_BUSCADOR && (
          <label className="relative block">
            <span className="sr-only">Buscar subcategoría</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value.toUpperCase())}
              placeholder="Buscar subcategoría"
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-10 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
            />
            {filtro && (
              <button
                type="button"
                onClick={() => setFiltro('')}
                aria-label="Limpiar búsqueda de subcategoría"
                className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-primary/10 hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </label>
        )}

        <ul className="grid max-h-[55dvh] grid-cols-2 gap-2.5 overflow-y-auto overscroll-contain p-1 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3 short:max-h-[50dvh]">
          {opciones.map((sub, i) => {
            const activa = sub.codigo === subseccion
            return (
              <li key={sub.codigo}>
                <button
                  type="button"
                  onClick={() => {
                    alElegir(sub.codigo)
                    cerrar()
                  }}
                  style={{ animationDelay: `${Math.min(i, 8) * 15}ms` }}
                  className={`flex min-h-14 w-full animate-[chip-in_0.16s_ease-out_both] cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold uppercase leading-tight transition active:scale-95 lg:min-h-16 lg:px-4 lg:text-sm [overflow-wrap:anywhere] ${
                    activa
                      ? 'bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-lg shadow-club-pc/30'
                      : 'border border-line bg-surface hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <span className="min-w-0 flex-1">{sub.nombre}</span>
                  {activa && <Check className="size-4 shrink-0" aria-hidden />}
                </button>
              </li>
            )
          })}
          {opciones.length === 1 && texto && (
            <li className="col-span-full py-4 text-center text-sm text-muted">
              No hay subcategorías que coincidan.
            </li>
          )}
        </ul>
      </div>
    </Modal>
  )
}
