const moneda = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
})

export const formatoMoneda = (valor: number) => moneda.format(valor)

export const formatoHora = (marca: number) =>
  new Date(marca).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })

export const tiempoTranscurrido = (marca: number) => {
  const minutos = Math.max(0, Math.round((Date.now() - marca) / 60_000))
  if (minutos < 1) return 'Recién abierta'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `${horas} h ${minutos % 60} min`
}

const monedaEntera = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const formatoMonedaEntera = (valor: number) => monedaEntera.format(valor)

const numero = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatoNumero = (valor: number) => numero.format(valor)
