import { useMemo, useState } from 'react'
import { Armchair, Banknote, LayoutDashboard, ShieldCheck, Users } from 'lucide-react'
import { resumenMesas } from '@/features/pedidos/calculos'
import { useMesas } from '@/features/pedidos/hooks'
import { CuadriculaMesas } from '@/features/salon/components/CuadriculaMesas'
import { DetalleMesaAdmin } from '../components/DetalleMesaAdmin'
import { EncabezadoSeccion } from '../components/EncabezadoSeccion'
import { TarjetaIndicador } from '@/features/salon/components/TarjetaIndicador'
import { formatoMonedaEntera } from '@/features/salon/formato'

export function PanelPage() {
  const consulta = useMesas()
  const [elegida, setElegida] = useState<string | null>(null)
  const mesas = useMemo(() => consulta.data ?? [], [consulta.data])
  const { conteo, comensales, consumo, total, porcentaje } = resumenMesas(mesas)

  const indicadores = [
    {
      etiqueta: 'Mesas ocupadas',
      valor: String(conteo.ocupada),
      detalle: `${comensales} comensales en sala`,
      icono: Armchair,
      color: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    },
    {
      etiqueta: 'Mesas libres',
      valor: String(conteo.libre),
      detalle: `de ${total} mesas del salón`,
      icono: Users,
      color: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
    },
    {
      etiqueta: 'Consumo abierto',
      valor: formatoMonedaEntera(consumo),
      detalle: 'En cuentas sin liquidar',
      icono: Banknote,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    {
      etiqueta: 'Ocupación',
      valor: `${porcentaje}%`,
      detalle: 'Mesas ocupadas del total',
      icono: ShieldCheck,
      color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    },
  ]

  return (
    <div className="space-y-6 short:space-y-4">
      <EncabezadoSeccion titulo="Panel" descripcion="Resumen del salón en este momento." icono={LayoutDashboard} />

      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 short:grid-cols-4 short:gap-2"
      >
        {indicadores.map((tarjeta, i) => (
          <TarjetaIndicador key={tarjeta.etiqueta} indice={i} {...tarjeta} />
        ))}
      </section>

      <CuadriculaMesas ayuda="Toca una mesa para ver su detalle." alElegir={(m) => setElegida(m.codigo)} />
      <DetalleMesaAdmin codigo={elegida} alCerrar={() => setElegida(null)} />
    </div>
  )
}
