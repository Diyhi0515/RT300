import { Search, X } from 'lucide-react'

interface BuscadorUsuariosProps {
  valor: string
  onCambiar: (valor: string) => void
  onEnter: () => void
  fondo?: 'panel' | 'tarjeta'
}

const fondos = {
  panel: 'bg-club-card',
  tarjeta: 'bg-club-low',
}

export function BuscadorUsuarios({
  valor,
  onCambiar,
  onEnter,
  fondo = 'panel',
}: BuscadorUsuariosProps) {
  return (
    <div className="relative shrink-0">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-club-variant"
        aria-hidden
      />
      <input
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value.toUpperCase())}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') {
            evento.preventDefault()
            onEnter()
          }
          if (evento.key === 'Escape') onCambiar('')
        }}
        aria-label="Buscar usuario"
        placeholder="Buscar por código o zona"
        autoComplete="off"
        autoCapitalize="characters"
        enterKeyHint="search"
        className={`h-11 w-full rounded-xl pl-11 pr-11 text-base font-medium uppercase text-club-text placeholder:normal-case outline-none ring-1 ring-club-text/10 transition placeholder:font-normal placeholder:text-club-variant/80 focus:ring-2 focus:ring-club-pc dark:ring-white/10 short:h-10 2xl:h-12 ${fondos[fondo]}`}
      />
      {!!valor && (
        <button
          type="button"
          onClick={() => onCambiar('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-club-variant transition hover:bg-club-high hover:text-club-text"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
