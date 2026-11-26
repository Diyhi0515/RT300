export const MAXIMO_MB_IMAGEN = 5
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

export const motivoImagenInvalida = (archivo: File): string | null => {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return 'Elige una imagen JPG, PNG, WEBP, GIF o BMP.'
  if (archivo.size > MAXIMO_MB_IMAGEN * 1024 * 1024) return `La imagen supera ${MAXIMO_MB_IMAGEN} MB.`
  return null
}
