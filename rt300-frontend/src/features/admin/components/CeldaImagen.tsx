import { useRef } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useSubirImagenPlato } from '@/features/pedidos/hooks'
import { notificar } from '@/shared/avisos/almacen'
import { motivoImagenInvalida, TIPOS_IMAGEN } from '../imagen'

interface CeldaImagenProps {
  cart: string
  nombre: string
  tieneImagen: boolean
}

export function CeldaImagen({ cart, nombre, tieneImagen }: CeldaImagenProps) {
  const entrada = useRef<HTMLInputElement>(null)
  const subir = useSubirImagenPlato()

  const alElegir = (archivo: File | undefined) => {
    if (entrada.current) entrada.current.value = ''
    if (!archivo) return
    const motivo = motivoImagenInvalida(archivo)
    if (motivo) {
      notificar.advertencia(motivo, 'Imagen no válida')
      return
    }
    subir.mutate(
      { cart, archivo },
      { onSuccess: () => notificar.exito(`Se agregó la imagen de ${nombre}.`, 'Imagen guardada') },
    )
  }

  if (tieneImagen) {
    return (
      <img
        src={`/api/v1/menu/platos/${encodeURIComponent(cart)}/imagen?w=160`}
        alt={`Imagen de ${nombre}`}
        loading="lazy"
        className="size-12 rounded-lg bg-bg object-cover"
      />
    )
  }

  return (
    <>
      <input
        ref={entrada}
        type="file"
        accept={TIPOS_IMAGEN.join(',')}
        aria-label={`Elegir imagen de ${nombre}`}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => alElegir(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={subir.isPending}
        onClick={() => entrada.current?.click()}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-dashed border-line px-2.5 text-xs font-semibold text-muted transition hover:border-primary/60 hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {subir.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
        {subir.isPending ? 'Subiendo...' : 'Subir imagen'}
      </button>
    </>
  )
}
