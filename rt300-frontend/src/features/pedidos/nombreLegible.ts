export const nombreLegible = (nombre: string) =>
  nombre.replace(/\s*([,;])\s*/g, '$1 ').replace(/\s{2,}/g, ' ').trim()
