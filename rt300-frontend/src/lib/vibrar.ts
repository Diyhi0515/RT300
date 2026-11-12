const PATRONES = {
  toque: 8,
  exito: [14, 40, 14],
  error: [40, 50, 40],
} as const

export const vibrar = (tipo: keyof typeof PATRONES) => {
  try {
    navigator.vibrate?.(PATRONES[tipo] as number | number[])
  } catch {
    return
  }
}
