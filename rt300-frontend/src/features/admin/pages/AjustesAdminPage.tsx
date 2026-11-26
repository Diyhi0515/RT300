import { useState } from 'react'
import { Settings } from 'lucide-react'
import { notificar } from '@/shared/avisos/almacen'
import { EncabezadoSeccion } from '../components/EncabezadoSeccion'
import { MAXIMO_NOMBRE_NEGOCIO, useAjusteNombre, useCambiarNombre } from '../negocio'

const boton =
  'inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'

export function AjustesAdminPage() {
  const ajuste = useAjusteNombre()
  const cambiar = useCambiarNombre()
  const [escrito, setEscrito] = useState<string | null>(null)

  const actual = ajuste.data?.nombre ?? ''
  const valor = escrito ?? actual
  const sinCambios = !valor.trim() || valor.trim() === actual

  const guardar = (nombre: string, mensaje: string) =>
    cambiar.mutate(nombre, {
      onSuccess: () => {
        setEscrito(null)
        notificar.exito(mensaje, 'Nombre actualizado')
      },
    })

  return (
    <div>
      <EncabezadoSeccion
        titulo="Ajustes"
        descripcion="Datos que muestra la aplicación."
        icono={Settings}
      />

      <section className="max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-5">
        {ajuste.isPending && (
          <p role="status" className="py-6 text-center text-sm text-muted">
            Cargando ajustes...
          </p>
        )}
        {ajuste.isError && (
          <p role="alert" className="py-6 text-center text-sm text-muted">
            No se pudieron cargar los ajustes.{' '}
            <button
              type="button"
              onClick={() => void ajuste.refetch()}
              className="cursor-pointer font-bold text-primary underline"
            >
              Reintentar
            </button>
          </p>
        )}
        {ajuste.isSuccess && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!sinCambios) guardar(valor.trim(), 'Se guardó el nuevo nombre.')
            }}
            className="space-y-3"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
                Nombre del negocio
              </span>
              <input
                value={valor}
                maxLength={MAXIMO_NOMBRE_NEGOCIO}
                onChange={(e) => setEscrito(e.target.value)}
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-base font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <p className="text-xs text-muted">
              Se muestra en la pantalla de ingreso y en la barra superior. El cambio es solo para esta aplicación: la base
              de datos de la empresa no se modifica.
              {ajuste.data.nombre_base && (
                <>
                  {' '}
                  Nombre en la base: <strong className="text-fg">{ajuste.data.nombre_base}</strong>
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={sinCambios || cambiar.isPending}
                className={`${boton} bg-primary text-white shadow-md shadow-primary/30 hover:brightness-110`}
              >
                {cambiar.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              {ajuste.data.personalizado && (
                <button
                  type="button"
                  disabled={cambiar.isPending}
                  onClick={() => guardar('', 'Se vuelve a usar el nombre de la base de datos.')}
                  className={`${boton} border border-line bg-surface hover:border-primary/60`}
                >
                  Usar el de la base
                </button>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
