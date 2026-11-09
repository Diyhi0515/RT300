import { useEffect, useRef, useState } from 'react'
import { Pointer, RefreshCw } from 'lucide-react'
import { Cargador } from '@/shared/ui/Cargador'
import { filtrarUsuarios } from '../filtrarUsuarios'
import { useUsuarios } from '../hooks'
import { BuscadorUsuarios } from './BuscadorUsuarios'
import { FichaUsuario } from './FichaUsuario'

interface UsuarioCarruselProps {
  seleccionado: string
  onSelect: (usuario: string) => void
}

export function UsuarioCarrusel({ seleccionado, onSelect }: UsuarioCarruselProps) {
  const { data, isLoading, isError, refetch, isFetching } = useUsuarios()
  const [busqueda, setBusqueda] = useState('')
  const pista = useRef<HTMLDivElement>(null)
  const visibles = filtrarUsuarios(data ?? [], busqueda)
  const hayBusqueda = busqueda.trim() !== ''

  useEffect(() => {
    pista.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [seleccionado])

  return (
    <div className="space-y-2 md:hidden">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-club-variant">
          <Pointer className="size-4 text-club-primary" aria-hidden />
          Acceso rápido
        </p>
        {!!data?.length && (
          <span className="text-xs font-semibold text-club-secondary">
            {hayBusqueda ? `${visibles.length} de ${data.length}` : `${data.length} mozos`}
          </span>
        )}
      </div>

      {!!data?.length && (
        <BuscadorUsuarios
          valor={busqueda}
          onCambiar={setBusqueda}
          onEnter={() => visibles[0] && onSelect(visibles[0].usuario)}
          fondo="tarjeta"
        />
      )}

      {isLoading && (
        <div className="flex h-16 items-center justify-center gap-3 rounded-xl bg-club-low">
          <Cargador size="sm" />
          <span className="text-sm font-semibold text-club-variant">Cargando usuarios…</span>
        </div>
      )}

      {isError && (
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-club-low px-4 text-sm font-semibold text-club-text"
        >
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
          No se pudo cargar la lista. Reintentar
        </button>
      )}

      {hayBusqueda && visibles.length === 0 && (
        <p
          role="status"
          className="rounded-xl bg-club-low px-4 py-4 text-center text-sm font-semibold text-club-variant"
        >
          Sin resultados para «{busqueda.trim()}»
        </p>
      )}

      {visibles.length > 0 && (
        <div
          ref={pista}
          className="-mx-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-6 py-1 [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibles.map((u, i) => (
            <FichaUsuario
              key={u.usuario}
              usuario={u}
              activo={seleccionado === u.usuario}
              onSelect={onSelect}
              index={i}
              variant="strip"
            />
          ))}
        </div>
      )}
    </div>
  )
}
