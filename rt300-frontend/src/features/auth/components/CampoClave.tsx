import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { estiloEntrada, estiloEtiqueta, estiloIconoCampo, estiloMensajeError } from './estilosCampo'

interface CampoClaveProps {
  registro: UseFormRegisterReturn
  error?: string
  deshabilitado: boolean
}

export function CampoClave({ registro, error, deshabilitado }: CampoClaveProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor="clave" className={estiloEtiqueta}>
        Contraseña
      </label>
      <div className="relative flex items-center">
        <LockKeyhole className={estiloIconoCampo} aria-hidden />
        <input
          id="clave"
          type={visible ? 'text' : 'password'}
          placeholder="••••"
          autoComplete="current-password"
          maxLength={64}
          enterKeyHint="go"
          aria-invalid={!!error}
          disabled={deshabilitado}
          {...registro}
          className={`${estiloEntrada} pl-12 pr-14 tracking-widest disabled:cursor-not-allowed disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-2 grid size-11 place-items-center rounded-lg text-club-variant transition hover:bg-club-high hover:text-club-text short:size-9"
        >
          {visible ? <EyeOff className="size-[22px]" /> : <Eye className="size-[22px]" />}
        </button>
      </div>
      {error && <p className={estiloMensajeError}>{error}</p>}
    </div>
  )
}
