import { Lock, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { seccionesAdmin, seccionesProximas } from '../secciones'

interface BarraLateralProps {
  abierta: boolean
  alCerrar: () => void
}

const enlace = ({ isActive }: { isActive: boolean }) =>
  `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
    isActive
      ? 'bg-primary text-white shadow-md shadow-primary/30'
      : 'text-muted hover:bg-primary/10 hover:text-fg'
  }`

export function BarraLateral({ abierta, alCerrar }: BarraLateralProps) {
  return (
    <>
      <div
        aria-hidden
        onClick={alCerrar}
        className={`fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          abierta ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-label="Administración"
        className={`fixed inset-y-0 left-0 z-[56] flex w-72 flex-col border-r border-line bg-surface pt-[env(safe-area-inset-top)] transition-transform duration-300 lg:sticky lg:top-[72px] lg:z-auto lg:h-[calc(100dvh-72px)] lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          abierta ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4 lg:hidden">
          <strong className="text-sm font-bold">Administración</strong>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar menú"
            className="grid size-10 cursor-pointer place-items-center rounded-xl text-muted transition hover:bg-primary/10 active:scale-90"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
          {seccionesAdmin.map(({ clave, etiqueta, icono: Icono, ruta, exacta }) => (
            <NavLink key={clave} to={ruta as string} end={exacta} onClick={alCerrar} className={enlace}>
              <Icono className="size-[19px] shrink-0" />
              <span className="truncate">{etiqueta}</span>
            </NavLink>
          ))}

          <p className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Próximamente
          </p>
          {seccionesProximas.map(({ clave, etiqueta, icono: Icono }) => (
            <span
              key={clave}
              aria-disabled="true"
              title="Disponible pronto"
              className="flex h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted/60"
            >
              <Icono className="size-[19px] shrink-0" />
              <span className="min-w-0 flex-1 truncate">{etiqueta}</span>
              <Lock className="size-3.5 shrink-0" />
            </span>
          ))}
        </nav>
      </aside>
    </>
  )
}
