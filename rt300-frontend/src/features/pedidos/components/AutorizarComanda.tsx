import { useState, type FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Modal } from '@/shared/ui/Modal'
import type { MotivoComanda } from '../types'

export type AccionComanda = 'reimprimir' | 'eliminar'

export interface AutorizacionComanda {
  uaut: string
  cont: string
  mtvo: number
}

interface AutorizarComandaProps {
  accion: AccionComanda
  cantidad: number
  motivos: MotivoComanda[]
  enviando: boolean
  alConfirmar: (autorizacion: AutorizacionComanda) => void
  alCancelar: () => void
}

const campo =
  'h-12 w-full rounded-xl border border-line bg-surface px-3 text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 short:h-10'

export function AutorizarComanda({
  accion,
  cantidad,
  motivos,
  enviando,
  alConfirmar,
  alCancelar,
}: AutorizarComandaProps) {
  const eliminar = accion === 'eliminar'
  const [uaut, setUaut] = useState('')
  const [cont, setCont] = useState('')
  const [motivo, setMotivo] = useState('')

  const valido = uaut.trim().length > 0 && motivo !== '' && (!eliminar || cont.length > 0)

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!valido || enviando) return
    alConfirmar({
      uaut: uaut.trim().toUpperCase(),
      cont: eliminar ? cont : '',
      mtvo: Number(motivo),
    })
  }

  const titulo = eliminar ? 'Eliminar productos' : 'Reimprimir productos'

  return (
    <Modal open onClose={enviando ? () => undefined : alCancelar} title={titulo} capa="z-[90]">
      <form
        onSubmit={enviar}
        autoComplete="off"
        className="space-y-4 p-6 short:space-y-3 short:p-4"
      >
        <div className="flex items-center gap-3 pr-10">
          <span
            className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
              eliminar ? 'bg-danger/12 text-danger' : 'bg-primary/10 text-primary'
            }`}
          >
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-extrabold leading-tight">{titulo}</h3>
            <p className="text-xs text-muted">
              {cantidad} {cantidad === 1 ? 'producto' : 'productos'} · requiere un autorizador
            </p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-muted">Motivo</span>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className={campo}
            required
          >
            <option value="">Elige un motivo</option>
            {motivos.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.descripcion}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-muted">Usuario autorizador</span>
          <input
            type="text"
            value={uaut}
            onChange={(e) => setUaut(e.target.value.toUpperCase())}
            maxLength={30}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={`${campo} uppercase`}
            required
          />
        </label>

        {eliminar && (
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-muted">Clave del autorizador</span>
            <input
              type="password"
              value={cont}
              onChange={(e) => setCont(e.target.value)}
              maxLength={64}
              autoComplete="new-password"
              spellCheck={false}
              className={campo}
              required
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={alCancelar}
            disabled={enviando}
            className="h-12 cursor-pointer rounded-xl border border-line font-semibold transition hover:bg-primary/5 active:scale-[0.98] disabled:opacity-40 short:h-10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!valido || enviando}
            className={`h-12 cursor-pointer rounded-xl font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 short:h-10 ${
              eliminar ? 'bg-danger' : 'bg-primary'
            }`}
          >
            {enviando ? 'Procesando...' : eliminar ? 'Eliminar' : 'Reimprimir'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
