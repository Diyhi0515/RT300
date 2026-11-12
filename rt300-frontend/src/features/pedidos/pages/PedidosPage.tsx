import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { EncabezadoPagina } from '@/features/salon/components/EncabezadoPagina'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { HojaInferior } from '@/shared/ui/HojaInferior'
import { ComandaNueva } from '../components/ComandaNueva'
import { PanelMesa } from '../components/PanelMesa'
import { PlanoMesas } from '../components/PlanoMesas'
import { usePedidos } from '../store'

export function PedidosPage() {
  const dockeado = useMediaQuery('(min-width: 768px)')
  const seleccionada = usePedidos((s) => s.seleccionada)
  const seleccionar = usePedidos((s) => s.seleccionar)
  const [, refrescar] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => refrescar((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="space-y-5 short:space-y-3">
      <EncabezadoPagina titulo="Pedidos" icono={ClipboardList} />

      <div
        className={`grid gap-4 md:items-start ${
          dockeado && seleccionada
            ? 'md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[minmax(0,1fr)_400px]'
            : ''
        }`}
      >
        <PlanoMesas />
        {dockeado && seleccionada && (
          <aside
            aria-label="Detalle de la mesa"
            className="sticky top-[88px] max-h-[calc(var(--alto-app,100dvh)-176px)] overflow-y-auto overscroll-contain rounded-3xl border border-line bg-surface pb-[72px] shadow-[0_12px_32px_rgba(1,21,38,.08)] escritorio:max-h-[calc(var(--alto-app,100dvh)-104px)] escritorio:pb-0 short:top-[72px] short:max-h-[calc(var(--alto-app,100dvh)-148px)] short:escritorio:max-h-[calc(var(--alto-app,100dvh)-88px)]"
          >
            <PanelMesa cerrable={!!seleccionada} />
          </aside>
        )}
      </div>

      {!dockeado && (
        <HojaInferior
          abierta={!!seleccionada}
          alCerrar={() => seleccionar(null)}
          titulo="Detalle de la mesa"
        >
          <PanelMesa />
        </HojaInferior>
      )}

      <ComandaNueva />
    </div>
  )
}
