import { createElement } from 'react'
import { iconoDeSeccion } from '../iconosMenu'

interface IconoSeccionProps {
  nombre: string
  className?: string
}

export function IconoSeccion({ nombre, className }: IconoSeccionProps) {
  return createElement(iconoDeSeccion(nombre), { className, 'aria-hidden': true })
}
