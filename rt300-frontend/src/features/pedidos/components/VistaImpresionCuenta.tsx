import { Printer } from 'lucide-react'
import { useSesion } from '@/features/auth'
import { Modal } from '@/shared/ui/Modal'
import type { Cuenta, MesaDetalle } from '../types'
import { TicketCuenta } from './TicketCuenta'

interface VistaImpresionCuentaProps {
  mesa: MesaDetalle
  cuenta: Cuenta
  alCerrar: () => void
}

export function VistaImpresionCuenta({ mesa, cuenta, alCerrar }: VistaImpresionCuentaProps) {
  const local = useSesion((s) => s.perfil?.local) ?? ''
  return (
    <Modal open onClose={alCerrar} title={`Vista de impresión de la cuenta ${cuenta.numero}`} className="max-w-sm">
      <div className="space-y-3 p-4 pt-12">
        <div className="max-h-[60dvh] overflow-y-auto rounded-xl border border-line bg-white">
          <TicketCuenta mesa={mesa} cuenta={cuenta} local={local} emitido={new Date()} />
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/30 transition hover:brightness-110 active:scale-[0.98]"
        >
          <Printer className="size-4" />
          Imprimir desde este equipo
        </button>
        <p className="text-center text-xs text-muted">
          Se imprime con la impresora que elijas en el navegador (ticket de 80 mm).
        </p>
      </div>
    </Modal>
  )
}
