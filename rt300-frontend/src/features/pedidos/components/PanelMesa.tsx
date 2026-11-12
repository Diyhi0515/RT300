import { usePedidos } from '../store'
import { CabeceraMesa } from './CabeceraMesa'
import { FormularioOcupar } from './FormularioOcupar'
import { ResumenMesa } from './ResumenMesa'

interface PanelMesaProps {
  cerrable?: boolean
}

export function PanelMesa({ cerrable = false }: PanelMesaProps) {
  const mesa = usePedidos((s) => s.mesas.find((m) => m.codigo === s.seleccionada) ?? null)

  if (!mesa) return null

  const ocupada = mesa.estado === 'ocupada' || mesa.estado === 'cobro'

  return (
    <div key={mesa.codigo} className="animate-[entrar-lado_0.3s_ease-out]">
      <CabeceraMesa mesa={mesa} cerrable={cerrable} />
      {ocupada ? (
        <ResumenMesa key={mesa.estado === 'cobro' ? 'cobro' : 'ocupada'} mesa={mesa} />
      ) : (
        <FormularioOcupar key={mesa.estado} mesa={mesa} />
      )}
    </div>
  )
}
