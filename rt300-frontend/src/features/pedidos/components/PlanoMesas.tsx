import { useMemo, useState } from 'react'
import { Map as IconoPlano, MousePointerClick, Rows3 } from 'lucide-react'
import { useSesion } from '@/features/auth'
import { areas } from '@/simulados/pedidos'
import { resumenMesas } from '../calculos'
import { usePedidos } from '../store'
import { DesplegableArea } from './DesplegableArea'
import { estilosMesa, ordenEstados } from './estilosMesa'
import { MesaPlano } from './MesaPlano'
import { MesaTarjeta } from './MesaTarjeta'

type Vista = 'tarjetas' | 'plano'

const CLAVE_VISTA = 'rt300-vista-mesas'

const leerVista = (): Vista => {
  try {
    return localStorage.getItem(CLAVE_VISTA) === 'plano' ? 'plano' : 'tarjetas'
  } catch {
    return 'tarjetas'
  }
}

const VISTAS: { valor: Vista; etiqueta: string; icono: typeof Rows3 }[] = [
  { valor: 'tarjetas', etiqueta: 'Tarjetas', icono: Rows3 },
  { valor: 'plano', etiqueta: 'Plano', icono: IconoPlano },
]

export function PlanoMesas() {
  const mesas = usePedidos((s) => s.mesas)
  const areaId = usePedidos((s) => s.areaId)
  const seleccionada = usePedidos((s) => s.seleccionada)
  const seleccionar = usePedidos((s) => s.seleccionar)
  const perfil = useSesion((s) => s.perfil)
  const [vista, setVista] = useState<Vista>(leerVista)

  const area = areas.find((a) => a.id === areaId)
  const visibles = useMemo(() => mesas.filter((m) => m.areaId === areaId), [mesas, areaId])
  const conteo = resumenMesas(visibles).conteo

  const cambiarVista = (nueva: Vista) => {
    setVista(nueva)
    try {
      localStorage.setItem(CLAVE_VISTA, nueva)
    } catch {
      return
    }
  }

  return (
    <section
      aria-label={`Mesas de ${area?.nombre ?? 'el área'}`}
      className="@container relative overflow-hidden rounded-3xl border border-line border-t-4 border-t-club-pc bg-surface shadow-[0_12px_32px_rgba(1,21,38,.06)]"
    >
      {vista === 'plano' && (
        <div className="pointer-events-none absolute inset-0">
          <div className="rejilla-fondo absolute inset-0 opacity-[0.07] dark:opacity-[0.1]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(43,83,184,0.10),transparent_70%)]" />
        </div>
      )}

      <header className="relative space-y-3 px-4 pb-1 pt-4 short:space-y-2 short:pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <DesplegableArea local={perfil?.local ?? 'Club de Campo'} />
          </div>
          <div
            role="group"
            aria-label="Vista de las mesas"
            className="flex rounded-xl border border-line bg-bg p-1"
          >
            {VISTAS.map(({ valor, etiqueta, icono: Icono }) => {
              const activa = vista === valor
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => cambiarVista(valor)}
                  className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition active:scale-95 ${
                    activa
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  <Icono className="size-3.5" />
                  {etiqueta}
                </button>
              )
            })}
          </div>
        </div>
        <ul aria-label="Leyenda de estados" className="flex flex-wrap gap-1.5">
          {ordenEstados.map((estado) => {
            const { etiqueta, icono: Icono, insignia } = estilosMesa[estado]
            return (
              <li
                key={estado}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ${insignia}`}
              >
                <Icono className="size-3.5" aria-hidden />
                {etiqueta}
                <span className="tabular-nums opacity-80">({conteo[estado]})</span>
              </li>
            )
          })}
          <li className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary ring-1 ring-primary/60">
            <MousePointerClick className="size-3.5" aria-hidden />
            Selección
            {seleccionada &&
              mesas.some((m) => m.codigo === seleccionada && m.areaId === areaId) && (
                <span className="tabular-nums opacity-80">({seleccionada})</span>
              )}
          </li>
        </ul>
      </header>

      {vista === 'tarjetas' ? (
        <div
          key={`${areaId}-tarjetas`}
          className="relative grid animate-[fade_0.3s_ease-out] grid-cols-2 gap-2.5 p-3 @lg:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5 sm:p-4"
        >
          {visibles.map((mesa, i) => (
            <MesaTarjeta
              key={mesa.codigo}
              mesa={mesa}
              indice={i}
              seleccionada={mesa.codigo === seleccionada}
              alElegir={seleccionar}
            />
          ))}
        </div>
      ) : (
        <div
          key={`${areaId}-plano`}
          className="relative grid animate-[fade_0.3s_ease-out] grid-flow-dense grid-cols-3 gap-1.5 p-3 @md:grid-cols-4 @2xl:grid-cols-5 @4xl:grid-cols-6 @6xl:grid-cols-8 sm:gap-2 sm:p-4"
        >
          {visibles.map((mesa, i) => (
            <MesaPlano
              key={mesa.codigo}
              mesa={mesa}
              indice={i}
              seleccionada={mesa.codigo === seleccionada}
              alElegir={seleccionar}
            />
          ))}
        </div>
      )}
    </section>
  )
}
