import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useClickExterior } from '@/shared/hooks/useClickExterior'

interface OpcionLista {
  valor: string | number
  etiqueta: string
}

interface ListaDesplegableProps {
  valor: string | number
  opciones: OpcionLista[]
  alCambiar: (valor: string | number) => void
  etiqueta: string
  className?: string
}

export function ListaDesplegable({
  valor,
  opciones,
  alCambiar,
  etiqueta,
  className = '',
}: ListaDesplegableProps) {
  const [abierta, setAbierta] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const activa = useRef<HTMLButtonElement>(null)
  const idLista = useId()
  useClickExterior(contenedor, abierta, () => setAbierta(false))

  const actual = opciones.find((o) => o.valor === valor)

  useEffect(() => {
    if (abierta) activa.current?.scrollIntoView({ block: 'nearest' })
  }, [abierta])

  const mover = (paso: number) => {
    if (opciones.length === 0) return
    const indice = opciones.findIndex((o) => o.valor === valor)
    const siguiente = Math.min(opciones.length - 1, Math.max(0, indice + paso))
    alCambiar(opciones[siguiente].valor)
  }

  return (
    <div
      ref={contenedor}
      className={`relative min-w-0 ${className}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && abierta) {
          e.stopPropagation()
          setAbierta(false)
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          mover(1)
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          mover(-1)
        }
      }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierta}
        aria-controls={idLista}
        aria-label={etiqueta}
        onClick={() => setAbierta((v) => !v)}
        className={`flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-surface px-3 text-base font-medium transition active:scale-[0.98] lg:h-11 lg:text-sm short:lg:h-9 ${
          abierta ? 'border-club-pc ring-2 ring-club-pc/25' : 'border-line hover:border-club-pc/50'
        }`}
      >
        <span className="truncate">{actual?.etiqueta ?? ''}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform duration-200 ${abierta ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {abierta && (
        <ul
          id={idLista}
          role="listbox"
          aria-label={etiqueta}
          className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-60 min-w-full animate-[pop_0.14s_ease-out] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-1.5 shadow-[0_24px_60px_rgba(1,21,38,.25)] [scrollbar-color:var(--color-club-pc)_transparent] [scrollbar-width:thin]"
        >
          {opciones.map((o) => {
            const elegida = o.valor === valor
            return (
              <li key={o.valor} role="option" aria-selected={elegida}>
                <button
                  ref={elegida ? activa : undefined}
                  type="button"
                  onClick={() => {
                    alCambiar(o.valor)
                    setAbierta(false)
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition active:scale-[0.98] ${
                    elegida ? 'bg-club-pc/10 text-club-primary' : 'text-fg hover:bg-primary/5'
                  }`}
                >
                  <span className="truncate">{o.etiqueta}</span>
                  {elegida && <Check className="size-4 shrink-0" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
