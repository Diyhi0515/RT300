import { Delete, IdCard } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { estiloEntrada, estiloEtiqueta, estiloIconoCampo, estiloMensajeError } from './estilosCampo'

interface CampoUsuarioProps {
  registro: UseFormRegisterReturn
  valor: string
  error?: string
  onLimpiar: () => void
}

export function CampoUsuario({ registro, valor, error, onLimpiar }: CampoUsuarioProps) {
  return (
    <div>
      <label htmlFor="usuario" className={estiloEtiqueta}>
        Usuario
      </label>
      <div className="relative flex items-center">
        <IdCard className={estiloIconoCampo} aria-hidden />
        <input
          id="usuario"
          placeholder="Ej. GP4 o MCB"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          autoCapitalize="characters"
          maxLength={20}
          enterKeyHint="next"
          aria-invalid={!!error}
          {...registro}
          className={`${estiloEntrada} pl-12 pr-14 uppercase`}
        />
        {!!valor && (
          <button
            type="button"
            onClick={onLimpiar}
            aria-label="Borrar usuario"
            className="absolute right-2 grid size-11 place-items-center rounded-lg text-club-variant transition hover:bg-club-error-c hover:text-club-error short:size-9"
          >
            <Delete className="size-5" />
          </button>
        )}
      </div>
      {error && <p className={estiloMensajeError}>{error}</p>}
    </div>
  )
}
