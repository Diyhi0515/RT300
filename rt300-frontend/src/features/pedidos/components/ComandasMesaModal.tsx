import { useState } from 'react'
import { Printer, Trash2 } from 'lucide-react'
import { formatoMoneda } from '@/features/salon/formato'
import { notificar } from '@/shared/avisos/almacen'
import { Modal } from '@/shared/ui/Modal'
import { useComandasMesa, useEliminarComandas, useReimprimirComandas } from '../hooks'
import type { ItemComandaMesa } from '../types'
import { AutorizarComanda, type AccionComanda, type AutorizacionComanda } from './AutorizarComanda'

interface ComandasMesaModalProps {
  abierto: boolean
  folio: number
  mesa: string
  alCerrar: () => void
}

const clave = (item: ItemComandaMesa) => `${item.comanda}-${item.item}`

export function ComandasMesaModal({ abierto, folio, mesa, alCerrar }: ComandasMesaModalProps) {
  const consulta = useComandasMesa(folio, mesa, abierto)
  const reimprimir = useReimprimirComandas()
  const eliminar = useEliminarComandas()
  const [elegidos, setElegidos] = useState<Set<string>>(new Set())
  const [accion, setAccion] = useState<AccionComanda | null>(null)
  const [intentos, setIntentos] = useState(0)

  const comandas = consulta.data?.comandas ?? []
  const motivos = consulta.data?.motivos ?? []
  const todos = comandas.flatMap((c) => c.items)
  const seleccion = todos.filter((i) => elegidos.has(clave(i)))
  const procesando = reimprimir.isPending || eliminar.isPending

  const cerrar = () => {
    if (procesando) return
    setElegidos(new Set())
    setAccion(null)
    alCerrar()
  }

  const alternar = (items: ItemComandaMesa[]) => {
    setElegidos((actual) => {
      const copia = new Set(actual)
      const completo = items.every((i) => copia.has(clave(i)))
      for (const i of items) {
        if (completo) copia.delete(clave(i))
        else copia.add(clave(i))
      }
      return copia
    })
  }

  const confirmar = async ({ uaut, cont, mtvo }: AutorizacionComanda) => {
    if (!accion || procesando || seleccion.length === 0) return
    const base = {
      nfol: folio,
      mesa,
      uaut,
      mtvo,
      items: seleccion.map((i) => ({ ncom: i.comanda, item: i.item })),
    }
    try {
      if (accion === 'eliminar') await eliminar.mutateAsync({ ...base, cont })
      else await reimprimir.mutateAsync(base)
    } catch {
      setIntentos((n) => n + 1)
      return
    }
    notificar.exito(
      accion === 'eliminar' ? 'Los productos se eliminaron.' : 'Se envió a reimprimir.',
      `Mesa ${mesa}`,
    )
    setElegidos(new Set())
    setAccion(null)
  }

  return (
    <>
      <Modal
        open={abierto}
        onClose={cerrar}
        title={`Comandas de la mesa ${mesa}`}
        className="max-w-2xl!"
      >
        <div className="flex max-h-[85dvh] flex-col short:max-h-[92dvh]">
          <div className="shrink-0 border-b border-line bg-gradient-to-r from-club-pc/15 via-club-pc/5 to-transparent px-5 py-4 pr-14">
            <h3 className="text-lg font-extrabold leading-tight">Comandas de la mesa {mesa}</h3>
            <p className="text-xs text-muted">
              Elige los productos y luego reimprímelos o elimínalos con un autorizador.
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {consulta.isPending && (
              <p role="status" className="py-10 text-center text-sm text-muted">
                Cargando comandas...
              </p>
            )}
            {consulta.isError && (
              <p role="alert" className="py-10 text-center text-sm text-muted">
                No se pudieron cargar las comandas.{' '}
                <button
                  type="button"
                  onClick={() => void consulta.refetch()}
                  className="cursor-pointer font-bold text-primary underline"
                >
                  Reintentar
                </button>
              </p>
            )}
            {consulta.isSuccess && comandas.length === 0 && (
              <p className="py-10 text-center text-sm text-muted">
                Esta mesa aún no tiene comandas vigentes.
              </p>
            )}
            {comandas.map((c) => {
              const completo = c.items.every((i) => elegidos.has(clave(i)))
              return (
                <section
                  key={c.numero}
                  aria-label={`Comanda ${c.numero}`}
                  className="overflow-hidden rounded-2xl border border-line bg-surface"
                >
                  <label className="flex cursor-pointer items-center gap-3 bg-primary/5 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={completo}
                      onChange={() => alternar(c.items)}
                      aria-label={`Elegir toda la comanda ${c.numero}`}
                      className="size-5 cursor-pointer accent-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm font-extrabold">
                        Comanda {c.numero}
                        {c.cuenta !== null && ` · Cuenta ${c.cuenta}`}
                      </strong>
                      {c.garzon && (
                        <small className="block truncate text-[11px] uppercase text-muted">
                          {c.garzon}
                        </small>
                      )}
                    </span>
                    <span className="text-sm font-extrabold tabular-nums text-primary">
                      {formatoMoneda(c.importe)}
                    </span>
                  </label>
                  <ul className="divide-y divide-line">
                    {c.items.map((i) => (
                      <li key={clave(i)}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-primary/[0.03]">
                          <input
                            type="checkbox"
                            checked={elegidos.has(clave(i))}
                            onChange={() => alternar([i])}
                            aria-label={`Elegir ${i.descripcion}`}
                            className="size-5 shrink-0 cursor-pointer accent-primary"
                          />
                          <span className="min-w-0 flex-1 text-sm font-semibold uppercase leading-tight [overflow-wrap:anywhere]">
                            {i.descripcion}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted">
                            {i.cantidad} × {formatoMoneda(i.precio)}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>

          {comandas.length > 0 && (
            <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line bg-surface p-4 short:p-3">
              <button
                type="button"
                disabled={seleccion.length === 0 || procesando}
                onClick={() => setAccion('reimprimir')}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line font-bold transition hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 short:h-10"
              >
                <Printer className="size-4" aria-hidden />
                Reimprimir
              </button>
              <button
                type="button"
                disabled={seleccion.length === 0 || procesando}
                onClick={() => setAccion('eliminar')}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-danger font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 short:h-10"
              >
                <Trash2 className="size-4" aria-hidden />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </Modal>

      {accion && (
        <AutorizarComanda
          key={`${accion}-${intentos}`}
          accion={accion}
          cantidad={seleccion.length}
          motivos={motivos}
          enviando={procesando}
          alConfirmar={(datos) => void confirmar(datos)}
          alCancelar={() => setAccion(null)}
        />
      )}
    </>
  )
}
