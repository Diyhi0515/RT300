import { TriangleAlert } from 'lucide-react'
import { Modal } from '@/shared/ui/Modal'

interface ConfirmarAccionProps {
  abierto: boolean
  titulo: string
  mensaje: string
  textoConfirmar: string
  peligro?: boolean
  elevado?: boolean
  alConfirmar: () => void
  alCancelar: () => void
}

export function ConfirmarAccion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  peligro = false,
  elevado = false,
  alConfirmar,
  alCancelar,
}: ConfirmarAccionProps) {
  return (
    <Modal open={abierto} onClose={alCancelar} title={titulo} elevado={elevado}>
      <div className="space-y-4 px-6 pb-6 pt-8 text-center short:space-y-2 short:pb-4 short:pt-4">
        <span
          className={`mx-auto grid size-14 place-items-center rounded-2xl ${
            peligro ? 'bg-danger/12 text-danger' : 'bg-primary/10 text-primary'
          }`}
        >
          <TriangleAlert className="size-7" />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-bold">{titulo}</p>
          <p className="text-sm text-muted">{mensaje}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={alCancelar}
            className="h-12 cursor-pointer rounded-xl border border-line font-semibold transition hover:bg-primary/5 active:scale-[0.98] short:h-10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            className={`h-12 cursor-pointer rounded-xl font-bold text-white transition hover:brightness-110 active:scale-[0.98] short:h-10 ${
              peligro ? 'bg-danger' : 'bg-primary'
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  )
}
