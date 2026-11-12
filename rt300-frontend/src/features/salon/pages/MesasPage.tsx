import { Armchair, CalendarClock, ShieldCheck, Users } from 'lucide-react'
import { CuadriculaMesas } from '../components/CuadriculaMesas'
import { EncabezadoPagina } from '../components/EncabezadoPagina'
import { TarjetaIndicador } from '../components/TarjetaIndicador'
import { useSalon } from '../store'

export function MesasPage() {
  const mesas = useSalon((s) => s.mesas)

  const ocupadas = mesas.filter((m) => m.estado === 'ocupada')
  const libres = mesas.filter((m) => m.estado === 'libre').length
  const reservadas = mesas.filter((m) => m.estado === 'reservada').length
  const comensales = ocupadas.reduce((suma, m) => suma + m.comensales, 0)

  const indicadores = [
    {
      etiqueta: 'Mesas ocupadas',
      valor: String(ocupadas.length),
      detalle: `${comensales} comensales en sala`,
      icono: Armchair,
      color: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    },
    {
      etiqueta: 'Mesas libres',
      valor: String(libres),
      detalle: `de ${mesas.length} mesas del salón`,
      icono: Users,
      color: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
    },
    {
      etiqueta: 'Reservadas',
      valor: String(reservadas),
      detalle: 'Esperando a sus comensales',
      icono: CalendarClock,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    {
      etiqueta: 'Ocupación',
      valor: `${mesas.length ? Math.round((ocupadas.length / mesas.length) * 100) : 0}%`,
      detalle: 'Mesas ocupadas del total',
      icono: ShieldCheck,
      color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    },
  ]

  return (
    <div className="space-y-6 short:space-y-4">
      <EncabezadoPagina titulo="Administración" icono={ShieldCheck} />

      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 short:grid-cols-4 short:gap-2"
      >
        {indicadores.map((tarjeta, i) => (
          <TarjetaIndicador key={tarjeta.etiqueta} indice={i} {...tarjeta} />
        ))}
      </section>

      <CuadriculaMesas />
    </div>
  )
}
