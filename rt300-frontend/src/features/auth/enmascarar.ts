export const PUNTO = '•'

export const aplicarCambioEnmascarado = (
  real: string,
  previoMostrado: string,
  nuevoMostrado: string,
) => {
  const maximo = Math.min(previoMostrado.length, nuevoMostrado.length)
  let inicio = 0
  while (inicio < maximo && previoMostrado[inicio] === nuevoMostrado[inicio]) inicio++
  let fin = 0
  while (
    fin < maximo - inicio &&
    previoMostrado[previoMostrado.length - 1 - fin] ===
      nuevoMostrado[nuevoMostrado.length - 1 - fin]
  ) {
    fin++
  }
  const insertado = nuevoMostrado.slice(inicio, nuevoMostrado.length - fin)
  return {
    valor: real.slice(0, inicio) + insertado + real.slice(real.length - fin),
    cursor: inicio + insertado.length,
  }
}
