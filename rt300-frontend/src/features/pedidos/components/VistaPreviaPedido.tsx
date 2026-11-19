import { Modal } from '@/shared/ui/Modal'

interface VistaPreviaPedidoProps {
  texto: string
  alCerrar: () => void
}

export function VistaPreviaPedido({ texto, alCerrar }: VistaPreviaPedidoProps) {
  return (
    <Modal open onClose={alCerrar} title="Vista previa del pedido" className="max-w-md!">
      <div className="flex max-h-[88dvh] flex-col short:max-h-[94dvh]">
        <div className="shrink-0 border-b border-line bg-gradient-to-r from-club-pc/15 via-club-pc/5 to-transparent px-5 py-4 pr-14 short:py-2.5">
          <h3 className="text-lg font-extrabold leading-tight">Vista previa del pedido</h3>
          <p className="text-xs text-muted">Así se verá el pedido de la mesa.</p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-primary/[0.04] p-4 short:p-3">
          <pre
            aria-label="Texto del pedido"
            className="mx-auto w-fit max-w-full overflow-x-auto whitespace-pre rounded-lg border border-line bg-white px-3 py-4 font-mono text-[11px] leading-relaxed text-neutral-900 shadow-[0_8px_24px_rgba(1,21,38,.08)] min-[400px]:px-4 min-[400px]:text-[12px] sm:text-[13px]"
          >
            {texto}
          </pre>
        </div>

        <div className="shrink-0 border-t border-line bg-surface p-4 short:p-3">
          <button
            type="button"
            onClick={alCerrar}
            className="h-12 w-full cursor-pointer rounded-xl bg-primary font-bold text-white transition hover:brightness-110 active:scale-[0.98] short:h-10"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}
