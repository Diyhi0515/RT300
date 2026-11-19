let bloqueos = 0

export const bloquearScroll = () => {
  bloqueos += 1
  document.body.style.overflow = 'hidden'
  let liberado = false
  return () => {
    if (liberado) return
    liberado = true
    bloqueos = Math.max(0, bloqueos - 1)
    if (bloqueos === 0) document.body.style.overflow = ''
  }
}
