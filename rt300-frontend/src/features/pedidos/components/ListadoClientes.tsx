import { useEffect, useState } from 'react'
import { Search, UserRoundSearch, X } from 'lucide-react'
import { iniciales } from '../calculos'
import { useClientes } from '../hooks'
import type { ClienteRegistrado } from '../types'

interface ListadoClientesProps {
  seleccionado: string
  alElegir: (cliente: ClienteRegistrado) => void
}

const ESPERA_BUSQUEDA_MS = 350
const LIMITE_SERVIDOR = 100
const MAXIMO_DIGITOS_CODIGO = 9
const MINIMO_DIGITOS_DOCUMENTO = 3
const MAXIMO_DIGITOS_DOCUMENTO = 15
const MINIMO_LETRAS = 2

export function ListadoClientes({ seleccionado, alElegir }: ListadoClientesProps) {
  const [texto, setTexto] = useState('')
  const [termino, setTermino] = useState('')

  useEffect(() => {
    const temporizador = window.setTimeout(() => setTermino(texto.trim()), ESPERA_BUSQUEDA_MS)
    return () => window.clearTimeout(temporizador)
  }, [texto])

  const esNumero = /^\d+$/.test(termino)
  const general = useClientes(
    esNumero ? null : termino.length >= MINIMO_LETRAS ? { nombre: termino } : {},
  )
  const porCodigo = useClientes(
    esNumero && termino.length <= MAXIMO_DIGITOS_CODIGO && Number(termino) > 0
      ? { codigo: Number(termino) }
      : null,
  )
  const porDocumento = useClientes(
    esNumero &&
      termino.length >= MINIMO_DIGITOS_DOCUMENTO &&
      termino.length <= MAXIMO_DIGITOS_DOCUMENTO
      ? { documento: termino }
      : null,
  )

  const consultas = esNumero ? [porCodigo, porDocumento] : [general]
  const cargando = consultas.some((c) => c.isFetching && c.fetchStatus !== 'idle')
  const resultados = consultas.flatMap((c) => (c.isSuccess ? c.data : []))
  const listado = resultados.filter(
    (cliente, i) => resultados.findIndex((otro) => otro.codigo === cliente.codigo) === i,
  )
  const hayTope = !esNumero && termino.length < MINIMO_LETRAS && listado.length >= LIMITE_SERVIDOR

  return (
    <section
      aria-label="Listado de clientes"
      className="min-w-0 space-y-3 rounded-3xl border border-line bg-surface p-4 shadow-[0_12px_32px_rgba(1,21,38,.06)] sm:p-5 lg:sticky lg:top-[88px]"
    >
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <UserRoundSearch className="size-4 text-club-primary" aria-hidden />
        Listado de clientes
        {!cargando && (
          <span className="rounded-md bg-line/60 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-muted">
            {listado.length}
          </span>
        )}
      </h2>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value.toUpperCase())}
          aria-label="Buscar en el listado de clientes"
          placeholder="Código, NIT / CI o nombre"
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-line bg-surface pl-9 pr-10 text-base font-medium lg:h-11 lg:text-sm outline-none transition focus:border-club-pc focus:ring-2 focus:ring-club-pc/25"
        />
        {texto && (
          <button
            type="button"
            onClick={() => setTexto('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-club-pc/10 hover:text-fg active:scale-90"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 bg-club-pc/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-club-primary">
          <span>Código</span>
          <span>Nombre</span>
        </div>
        {cargando && listado.length === 0 ? (
          <p role="status" className="px-4 py-8 text-center text-sm text-muted">
            Cargando clientes...
          </p>
        ) : listado.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Sin resultados.</p>
        ) : (
          <ul
            tabIndex={0}
            aria-label="Clientes"
            className="max-h-[min(58dvh,32rem)] lg:max-h-[min(52dvh,26rem)] divide-y divide-line overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--color-club-pc)_transparent] [scrollbar-width:thin]"
          >
            {listado.map((c) => {
              const activo = c.codigo === seleccionado
              return (
                <li key={c.codigo}>
                  <button
                    type="button"
                    onClick={() => alElegir(c)}
                    aria-pressed={activo}
                    className={`grid w-full cursor-pointer grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-2 px-3 py-2 text-left text-sm transition active:bg-club-pc/10 ${
                      activo ? 'bg-club-pc/10' : 'hover:bg-club-pc/5'
                    }`}
                  >
                    <span className="text-xs font-bold tabular-nums text-club-primary">
                      {c.codigo}
                    </span>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-club-pc to-club-tertiary text-[11px] font-extrabold tracking-wide text-white shadow-sm shadow-club-pc/25"
                      >
                        {iniciales(c.nombre)}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate font-semibold">{c.nombre}</strong>
                        {c.nit && <small className="text-[11px] text-muted">NIT {c.nit}</small>}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {hayTope && (
        <p className="text-[11px] text-muted">
          Se muestran los primeros {LIMITE_SERVIDOR}. Escribe para filtrar.
        </p>
      )}
    </section>
  )
}
