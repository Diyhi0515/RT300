import { useMesaDetalle } from '../hooks'
import { usePedidos } from '../store'
import { CabeceraMesa } from './CabeceraMesa'
import { FormularioOcupar } from './FormularioOcupar'
import { ResumenMesa } from './ResumenMesa'

interface PanelMesaProps {
  cerrable?: boolean
}

export function PanelMesa({ cerrable = false }: PanelMesaProps) {
  const seleccionada = usePedidos((s) => s.seleccionada)
  const { mesa, cargandoCuentas } = useMesaDetalle(seleccionada)

  if (!mesa) return null

  const ocupada = mesa.estado === 'ocupada'

  return (
    <div key={mesa.codigo} className="animate-[entrar-lado_0.3s_ease-out]">
      <CabeceraMesa mesa={mesa} cerrable={cerrable} />
      {!ocupada ? (
        <FormularioOcupar key={mesa.estado} mesa={mesa} />
      ) : cargandoCuentas ? (
        <p role="status" className="p-6 text-center text-sm text-muted">
          Cargando cuentas...
        </p>
      ) : (
        <ResumenMesa
          key={`${mesa.folio}-${mesa.comensales}-${mesa.cuentas.length}`}
          mesa={mesa}
        />
      )}
    </div>
  )
}
