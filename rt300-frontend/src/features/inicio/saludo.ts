export const saludoSegunHora = (fecha = new Date()) => {
  const hora = fecha.getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export const primerNombre = (nombre: string) => {
  const palabra = nombre.trim().split(/\s+/)[0] ?? ''
  return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
}

const FECHA = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })

export const fechaLarga = (fecha = new Date()) => {
  const texto = FECHA.format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
