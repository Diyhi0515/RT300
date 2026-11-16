import { useMemo, useState } from 'react'
import { Armchair } from 'lucide-react'
import { tiempoCorto } from '@/features/pedidos/calculos'
import { useAreas, useMesas } from '@/features/pedidos/hooks'
import { formatoMoneda } from '@/features/salon/formato'
import { EmptyState } from '@/shared/ui/EmptyState'
import { DetalleMesaAdmin } from '../components/DetalleMesaAdmin'
import { EncabezadoSeccion } from '../components/EncabezadoSeccion'

export function MesasServicioPage() {
  const consulta = useMesas()
  const [elegida, setElegida] = useState<string | null>(null)
  const areas = useAreas()
  const nombres = useMemo(() => new Map(areas.map((a) => [a.id, a.nombre])), [areas])

  const ocupadas = useMemo(
    () =>
      (consulta.data ?? [])
        .filter((m) => m.estado === 'ocupada')
        .sort((a, b) => (a.apertura ?? 0) - (b.apertura ?? 0)),
    [consulta.data],
  )
  const total = ocupadas.reduce((suma, m) => suma + m.consumo, 0)

  return (
    <div>
      <EncabezadoSeccion
        titulo="Mesas en servicio"
        descripcion="Mesas ocupadas, de la más antigua a la más reciente."
        icono={Armchair}
      />

      {consulta.isPending && (
        <p role="status" className="py-10 text-center text-sm text-muted">
          Cargando mesas...
        </p>
      )}
      {consulta.isError && (
        <p role="alert" className="py-10 text-center text-sm text-muted">
          No se pudieron cargar las mesas.{' '}
          <button
            type="button"
            onClick={() => void consulta.refetch()}
            className="cursor-pointer font-bold text-primary underline"
          >
            Reintentar
          </button>
        </p>
      )}
      {consulta.isSuccess && ocupadas.length === 0 && (
        <EmptyState
          icon={<Armchair className="size-8" />}
          title="No hay mesas en servicio"
          description="Cuando se ocupe una mesa aparecerá aquí."
        />
      )}

      {ocupadas.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Mesas ocupadas</caption>
              <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Mesa</th>
                  <th scope="col" className="px-4 py-3">Área</th>
                  <th scope="col" className="px-4 py-3">Mozo</th>
                  <th scope="col" className="px-4 py-3">Abierta hace</th>
                  <th scope="col" className="px-4 py-3 text-right">Comensales</th>
                  <th scope="col" className="px-4 py-3 text-right">Cuentas</th>
                  <th scope="col" className="px-4 py-3 text-right">Consumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ocupadas.map((m) => (
                  <tr key={m.codigo} className="transition hover:bg-primary/5">
                    <th scope="row" className="px-4 py-3 font-bold">
                      <button
                        type="button"
                        onClick={() => setElegida(m.codigo)}
                        className="cursor-pointer font-bold hover:text-primary hover:underline"
                      >
                        {m.codigo}
                      </button>
                    </th>
                    <td className="px-4 py-3 text-muted">{nombres.get(m.areaId) ?? '—'}</td>
                    <td className="min-w-40 px-4 py-3">{m.mozo ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {m.apertura ? tiempoCorto(m.apertura) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{m.comensales}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{m.numeroCuentas}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatoMoneda(m.consumo)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-line bg-bg font-bold">
                <tr>
                  <td colSpan={6} className="px-4 py-3">
                    {ocupadas.length} {ocupadas.length === 1 ? 'mesa' : 'mesas'} en servicio
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatoMoneda(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
      <DetalleMesaAdmin codigo={elegida} alCerrar={() => setElegida(null)} />
    </div>
  )
}
