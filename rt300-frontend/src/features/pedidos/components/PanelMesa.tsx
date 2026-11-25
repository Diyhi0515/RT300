import { useMesaDetalle } from '../hooks'
import { usePedidos } from '../store'
import { CabeceraMesa } from './CabeceraMesa'
import { FormularioOcupar } from './FormularioOcupar'
import { ResumenMesa } from './ResumenMesa'
import { CargadorDiferido } from '@/shared/ui/Cargador'

interface PanelMesaProps {
  cerrable?: boolean
}

export function PanelMesa({ cerrable = false }: PanelMesaProps) {
  const seleccionada = usePedidos((s) => s.seleccionada)
  const { mesa, cargandoCuentas } = useMesaDetalle(seleccionada)

  if (!mesa) return null

  const ocupada = mesa.estado === 'ocupada'

  return (
    <div
      key={mesa.codigo}
      className="flex min-h-full animate-[entrar-lado_0.18s_ease-out] flex-col"
    >
      <CabeceraMesa mesa={mesa} cerrable={cerrable} />
      {!ocupada ? (
        <FormularioOcupar key={mesa.estado} mesa={mesa} />
      ) : cargandoCuentas ? (
        <CargadorDiferido size="sm" label="Cargando cuentas..." className="py-10" />
      ) : (
        <ResumenMesa key={`${mesa.folio}-${mesa.comensales}`} mesa={mesa} />
      )}
    </div>
  )
}
