import { useMemo, useState } from 'react'
import { LayoutGrid, Map as IconoPlano, MousePointerClick, Rows3 } from 'lucide-react'
import { LayoutGroup, MotionConfig } from 'motion/react'
import { useSesion } from '@/features/auth'
import { resumenMesas } from '../calculos'
import { useAreaActual, useMesas } from '../hooks'
import { usePedidos } from '../store'
import { DesplegableArea } from './DesplegableArea'
import { estilosMesa, ordenEstados } from './estilosMesa'
import { MesaPlano } from './MesaPlano'
import { MesaTarjeta } from './MesaTarjeta'
import { CargadorDiferido } from '@/shared/ui/Cargador'

type Vista = 'tarjetas' | 'plano'
type Filtro = 'todos' | 'libre' | 'ocupada' | 'seleccion'

const CLAVE_VISTA = 'rt300-vista-mesas'

const leerVista = (): Vista => {
  try {
    return localStorage.getItem(CLAVE_VISTA) === 'plano' ? 'plano' : 'tarjetas'
  } catch {
    return 'tarjetas'
  }
}

const chip =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition active:scale-95 hover:brightness-95'
const activo = 'ring-2 ring-primary shadow-md shadow-primary/20'

const VISTAS: { valor: Vista; etiqueta: string; icono: typeof Rows3 }[] = [
  { valor: 'tarjetas', etiqueta: 'Tarjetas', icono: Rows3 },
  { valor: 'plano', etiqueta: 'Plano', icono: IconoPlano },
]

export function PlanoMesas() {
  const consulta = useMesas()
  const mesas = useMemo(() => consulta.data ?? [], [consulta.data])
  const area = useAreaActual()
  const areaId = area?.id ?? ''
  const seleccionada = usePedidos((s) => s.seleccionada)
  const seleccionar = usePedidos((s) => s.seleccionar)
  const perfil = useSesion((s) => s.perfil)
  const [vista, setVista] = useState<Vista>(leerVista)
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const delArea = useMemo(() => mesas.filter((m) => m.areaId === areaId), [mesas, areaId])
  const conteo = resumenMesas(delArea).conteo
  const seleccionadaEnArea = delArea.some((m) => m.codigo === seleccionada)
  const visibles = useMemo(() => {
    if (filtro === 'todos') return delArea
    if (filtro === 'seleccion') return delArea.filter((m) => m.codigo === seleccionada)
    return delArea.filter((m) => m.estado === filtro)
  }, [delArea, filtro, seleccionada])

  const cambiarVista = (nueva: Vista) => {
    setVista(nueva)
    try {
      localStorage.setItem(CLAVE_VISTA, nueva)
    } catch {
      return
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label={`Mesas de ${area?.nombre ?? 'el área'}`}
        className="@container relative overflow-hidden rounded-3xl border border-line border-t-4 border-t-club-pc bg-surface shadow-[0_12px_32px_rgba(1,21,38,.06)] md:sticky md:top-[88px] md:flex md:h-[calc(var(--alto-app,100dvh)-176px)] md:flex-col md:self-start escritorio:md:h-[calc(var(--alto-app,100dvh)-104px)] short:md:top-[72px] short:md:h-[calc(var(--alto-app,100dvh)-148px)] short:escritorio:md:h-[calc(var(--alto-app,100dvh)-88px)]"
      >
        {vista === 'plano' && (
          <div className="pointer-events-none absolute inset-0">
            <div className="rejilla-fondo absolute inset-0 opacity-[0.07] dark:opacity-[0.1]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(43,83,184,0.10),transparent_70%)]" />
          </div>
        )}

        <header className="relative space-y-3 px-4 pb-1 pt-4 md:shrink-0 short:space-y-2 short:pt-2">
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
          <div role="group" aria-label="Filtrar mesas" className="flex flex-wrap gap-1.5">
            <button
              type="button"
              aria-pressed={filtro === 'todos'}
              onClick={() => setFiltro('todos')}
              className={`${chip} bg-bg text-fg ring-1 ring-line ${filtro === 'todos' ? activo : ''}`}
            >
              <LayoutGrid className="size-3.5" aria-hidden />
              Todos
              <span className="tabular-nums opacity-80">({delArea.length})</span>
            </button>
            {ordenEstados.map((estado) => {
              const { etiqueta, icono: Icono, insignia } = estilosMesa[estado]
              return (
                <button
                  key={estado}
                  type="button"
                  aria-pressed={filtro === estado}
                  onClick={() => setFiltro(estado)}
                  className={`${chip} ${insignia} ${filtro === estado ? activo : ''}`}
                >
                  <Icono className="size-3.5" aria-hidden />
                  {etiqueta}
                  <span className="tabular-nums opacity-80">({conteo[estado]})</span>
                </button>
              )
            })}
            <button
              type="button"
              aria-pressed={filtro === 'seleccion'}
              onClick={() => setFiltro('seleccion')}
              className={`${chip} bg-primary/10 text-primary ring-1 ring-primary/60 ${filtro === 'seleccion' ? activo : ''}`}
            >
              <MousePointerClick className="size-3.5" aria-hidden />
              Selección
              {seleccionada && seleccionadaEnArea && (
                <span className="tabular-nums opacity-80">({seleccionada})</span>
              )}
            </button>
          </div>
        </header>

        <div className="relative md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:pb-[72px] escritorio:md:pb-0">
          {consulta.isPending ? (
            <CargadorDiferido label="Cargando mesas..." className="relative py-16" />
          ) : consulta.isError ? (
            <p role="alert" className="relative px-4 pb-8 pt-6 text-center text-sm text-muted">
              No se pudieron cargar las mesas.{' '}
              <button
                type="button"
                onClick={() => void consulta.refetch()}
                className="cursor-pointer font-bold text-primary underline"
              >
                Reintentar
              </button>
            </p>
          ) : visibles.length === 0 ? (
            <p className="relative px-4 pb-8 pt-6 text-center text-sm text-muted">
              {filtro === 'seleccion'
                ? 'Aún no has elegido una mesa.'
                : filtro === 'libre'
                  ? 'No hay mesas libres.'
                  : filtro === 'ocupada'
                    ? 'No hay mesas ocupadas.'
                    : 'No hay mesas en esta área.'}{' '}
              {filtro !== 'todos' && (
                <button
                  type="button"
                  onClick={() => setFiltro('todos')}
                  className="cursor-pointer font-bold text-primary underline"
                >
                  Ver todas
                </button>
              )}
            </p>
          ) : vista === 'tarjetas' ? (
            <div
              key={`${areaId}-tarjetas`}
              className="relative grid animate-[fade_0.15s_ease-out] grid-cols-2 gap-2.5 p-3 @lg:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5 sm:p-4"
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
            <LayoutGroup>
              <div
                key={`${areaId}-plano`}
                className="relative grid grid-cols-3 gap-1.5 p-3 @md:grid-cols-4 @2xl:grid-cols-5 @4xl:grid-cols-6 @6xl:grid-cols-8 sm:gap-2 sm:p-4"
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
            </LayoutGroup>
          )}
        </div>
      </section>
    </MotionConfig>
  )
}
