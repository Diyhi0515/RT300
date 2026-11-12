import { useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { PUNTO, aplicarCambioEnmascarado } from '../enmascarar'
import { estiloEntrada, estiloEtiqueta, estiloIconoCampo, estiloMensajeError } from './estilosCampo'

const enmascaraConCss = typeof CSS !== 'undefined' && CSS.supports('-webkit-text-security', 'disc')

interface CampoClaveProps {
  registro: UseFormRegisterReturn
  error?: string
  deshabilitado: boolean
}

export function CampoClave({ registro, error, deshabilitado }: CampoClaveProps) {
  const [visible, setVisible] = useState(false)
  const [real, setReal] = useState('')
  const entrada = useRef<HTMLInputElement | null>(null)
  const cursor = useRef<number | null>(null)
  const mostrado = visible ? real : PUNTO.repeat(real.length)

  useLayoutEffect(() => {
    if (cursor.current !== null && entrada.current) {
      entrada.current.setSelectionRange(cursor.current, cursor.current)
      cursor.current = null
    }
  })

  const alCambiarManual = (evento: ChangeEvent<HTMLInputElement>) => {
    const { valor, cursor: posicion } = aplicarCambioEnmascarado(
      real,
      mostrado,
      evento.target.value,
    )
    cursor.current = posicion
    setReal(valor)
    void registro.onChange({ target: { name: registro.name, value: valor }, type: 'change' })
  }

  const propiedadesManuales = enmascaraConCss
    ? {}
    : {
        value: mostrado,
        onChange: alCambiarManual,
        ref: (elemento: HTMLInputElement | null) => {
          registro.ref(elemento)
          entrada.current = elemento
        },
      }

  const claseEnmascarado = enmascaraConCss
    ? visible
      ? '[-webkit-text-security:none]'
      : '[-webkit-text-security:disc]'
    : ''

  return (
    <div>
      <label htmlFor="clave" className={estiloEtiqueta}>
        Contraseña
      </label>
      <div className="relative flex items-center">
        <LockKeyhole className={estiloIconoCampo} aria-hidden />
        <input
          id="clave"
          type="text"
          placeholder="••••"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          maxLength={64}
          enterKeyHint="go"
          aria-invalid={!!error}
          disabled={deshabilitado}
          {...registro}
          {...propiedadesManuales}
          className={`${estiloEntrada} pl-12 pr-14 tracking-widest disabled:cursor-not-allowed disabled:opacity-50 ${claseEnmascarado}`}
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
