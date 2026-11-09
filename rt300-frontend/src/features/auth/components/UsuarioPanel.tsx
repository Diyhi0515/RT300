import { useState } from 'react'
import { LogIn, Pointer, Receipt, RefreshCw, SearchX } from 'lucide-react'
import { Cargador } from '@/shared/ui/Cargador'
import { filtrarUsuarios } from '../filtrarUsuarios'
import { useUsuarios } from '../hooks'
import { BuscadorUsuarios } from './BuscadorUsuarios'
import { FichaUsuario } from './FichaUsuario'

interface UsuarioPanelProps {
  seleccionado: string
  onSelect: (usuario: string) => void
  disabled?: boolean
}

const SUPERVISOR = 'MCB'

const columnasCuadricula = 'grid-cols-3 @lg:grid-cols-4 @xl:grid-cols-5 @3xl:grid-cols-6'

export function UsuarioPanel({ seleccionado, onSelect, disabled = false }: UsuarioPanelProps) {
  const { data, isLoading, isError, refetch, isFetching } = useUsuarios()
  const [busqueda, setBusqueda] = useState('')
  const visibles = filtrarUsuarios(data ?? [], busqueda)
  const supervisor = visibles.find((u) => u.usuario === SUPERVISOR)
  const mozos = visibles.filter((u) => u.usuario !== SUPERVISOR)
  const hayBusqueda = busqueda.trim() !== ''
  const sinResultados = hayBusqueda && visibles.length === 0

  const seleccionarPrimero = () => {
    if (!disabled && visibles[0]) onSelect(visibles[0].usuario)
  }

  return (
    <section className="@container hidden min-h-0 flex-col gap-6 overflow-hidden bg-club-low p-6 md:flex lg:p-8 short:gap-3 short:p-4">
      <div className="flex shrink-0 flex-col justify-between gap-3 @xl:flex-row @xl:items-center">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-club-primary 2xl:text-lg">
            <Pointer className="size-5" aria-hidden />
            <h2>Acceso Rápido - Usuarios</h2>
          </div>
          <p className="mt-0.5 text-[13px] text-club-variant short:hidden">
            Toque el identificador asignado a su turno para autocompletar
          </p>
        </div>
        {!!data?.length && (
          <span className="self-start rounded-full bg-club-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-club-secondary @xl:self-center">
            {hayBusqueda
              ? `${visibles.length} de ${data.length}`
              : `${data.length} ${data.length === 1 ? 'Mozo habilitado' : 'Mozos habilitados'}`}
          </span>
        )}
      </div>

      {!!data?.length && (
        <BuscadorUsuarios valor={busqueda} onCambiar={setBusqueda} onEnter={seleccionarPrimero} />
      )}

      <p className="sr-only" role="status">
        {hayBusqueda ? `${visibles.length} resultados` : ''}
      </p>

      {supervisor && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(supervisor.usuario)}
          className={`group flex w-full shrink-0 items-center justify-between rounded-xl bg-club-tertiary p-3 text-left text-white shadow-sm dark:bg-gradient-to-r dark:from-[#1c3a9c] dark:to-[#2d55d6] dark:shadow-[0_8px_24px_-8px_rgba(45,85,214,0.6)] transition hover:brightness-110 active:scale-[0.99] short:p-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            seleccionado === SUPERVISOR ? 'ring-4 ring-club-sc' : ''
          }`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/20 short:size-9">
              <Receipt className="size-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-semibold">{supervisor.usuario}</span>
              <span className="block truncate text-[13px] opacity-90">{supervisor.nombre}</span>
            </span>
          </span>
          <LogIn
            className="size-6 shrink-0 opacity-80 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </button>
      )}

      {isLoading && (
        <span className="h-[4.5rem] shrink-0 animate-pulse rounded-xl bg-club-card" aria-hidden />
      )}

      <div className="-m-1 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 pr-2 [scrollbar-gutter:stable]">
        {isLoading && (
          <div className="relative min-h-72" role="status" aria-busy>
            <div className={`grid gap-2 opacity-60 ${columnasCuadricula}`} aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="h-16 animate-pulse rounded-xl bg-club-card"
                />
              ))}
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-3xl bg-club-card/95 px-8 py-6 shadow-xl ring-1 ring-club-text/5 backdrop-blur">
                <Cargador label="Cargando usuarios…" />
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-club-card px-4 py-10 text-center">
            <p className="font-semibold text-club-text">No se pudo cargar la lista de usuarios.</p>
            <p className="text-[13px] text-club-variant">
              Puede escribir su usuario manualmente en el formulario.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-club-pc px-5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
              Reintentar
            </button>
          </div>
        )}

        {sinResultados && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-club-card px-4 py-10 text-center">
            <SearchX className="size-9 text-club-variant" aria-hidden />
            <p className="font-semibold text-club-text">Sin resultados para «{busqueda.trim()}»</p>
            <p className="text-[13px] text-club-variant">
              Prueba con otro código o con la zona del mozo.
            </p>
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="inline-flex min-h-11 items-center rounded-xl bg-club-pc px-5 text-sm font-semibold text-white transition active:scale-95"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {mozos.length > 0 && (
          <div className={`grid gap-2 2xl:gap-3 ${columnasCuadricula}`}>
            {mozos.map((u, i) => (
              <FichaUsuario
                key={u.usuario}
                usuario={u}
                activo={seleccionado === u.usuario}
                onSelect={onSelect}
                index={i}
                variant="grid"
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
