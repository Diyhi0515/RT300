const MINIMO_LETRAS = 2

export const filtroDeBusqueda = (texto: string) => {
  const limpio = texto.trim()
  if (/^\d+$/.test(limpio)) return { codigo: Number(limpio) }
  if (limpio.length >= MINIMO_LETRAS) return { nombre: limpio }
  return null
}
