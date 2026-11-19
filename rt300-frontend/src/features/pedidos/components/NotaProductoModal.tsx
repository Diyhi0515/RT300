import { useState, type FormEvent } from 'react'
import { NotebookPen } from 'lucide-react'
import { Modal } from '@/shared/ui/Modal'
import { MAXIMO_NOTA_PRODUCTO } from '../limites'

interface NotaProductoModalProps {
  producto: string
  valor: string
  alGuardar: (nota: string) => void
  alCerrar: () => void
}

export function NotaProductoModal({
  producto,
  valor,
  alGuardar,
  alCerrar,
}: NotaProductoModalProps) {
  const [nota, setNota] = useState(valor)

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    alGuardar(nota.trim())
  }

  return (
    <Modal open onClose={alCerrar} title={`Nota para ${producto}`} className="max-w-md!">
      <form onSubmit={guardar} className="space-y-4 p-5 short:space-y-3 short:p-4">
        <div className="flex items-center gap-3 pr-10">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-lg shadow-club-pc/30">
            <NotebookPen className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold leading-tight">Nota del producto</h3>
            <p className="line-clamp-2 text-xs font-semibold uppercase text-muted [overflow-wrap:anywhere]">
              {producto}
            </p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-muted">Indicación para cocina</span>
          <textarea
            aria-label="Indicación para cocina"
            value={nota}
            onChange={(e) => setNota(e.target.value.toUpperCase().slice(0, MAXIMO_NOTA_PRODUCTO))}
            maxLength={MAXIMO_NOTA_PRODUCTO}
            rows={3}
            placeholder="EJ: SIN CEBOLLA, BIEN COCIDO"
            spellCheck={false}
            className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-base uppercase outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <span className="block text-right text-[11px] tabular-nums text-muted">
            {nota.length}/{MAXIMO_NOTA_PRODUCTO}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {valor ? (
            <button
              type="button"
              onClick={() => alGuardar('')}
              className="h-12 cursor-pointer rounded-xl border border-danger/40 font-semibold text-danger transition hover:bg-danger/10 active:scale-[0.98] short:h-10"
            >
              Quitar nota
            </button>
          ) : (
            <button
              type="button"
              onClick={alCerrar}
              className="h-12 cursor-pointer rounded-xl border border-line font-semibold transition hover:bg-primary/5 active:scale-[0.98] short:h-10"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="h-12 cursor-pointer rounded-xl bg-primary font-bold text-white transition hover:brightness-110 active:scale-[0.98] short:h-10"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}
