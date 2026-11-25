import { Armchair, ReceiptText, Users, Wallet } from 'lucide-react'
import { createPortal } from 'react-dom'
import { formatoMonedaEntera } from '@/features/salon/formato'
import { totalMesa } from '../calculos'
import type { MesaPlano } from '../types'
import { estilosMesa } from './estilosMesa'

interface InfoMesaFlotanteProps {
  mesa: MesaPlano
  ancla: DOMRect
}

const ANCHO = 224
const MARGEN = 8
const ALTO_ESTIMADO = 150

const posicion = (ancla: DOMRect) => {
  const izquierda = Math.min(
    Math.max(MARGEN, ancla.left + ancla.width / 2 - ANCHO / 2),
    window.innerWidth - ANCHO - MARGEN,
  )
  const arriba = ancla.top > ALTO_ESTIMADO + MARGEN * 2
  return arriba
    ? { left: izquierda, bottom: window.innerHeight - ancla.top + MARGEN }
    : { left: izquierda, top: ancla.bottom + MARGEN }
}

const fila = (Icono: typeof Users, texto: string) => (
  <li className="flex items-center gap-2 text-sm font-semibold">
    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-club-pc/10 text-club-primary">
      <Icono className="size-4" aria-hidden />
    </span>
    {texto}
  </li>
)

export function InfoMesaFlotante({ mesa, ancla }: InfoMesaFlotanteProps) {
  const estilo = estilosMesa[mesa.estado]
  const ocupada = mesa.estado === 'ocupada'

  return createPortal(
    <div
      role="tooltip"
      style={{ ...posicion(ancla), width: ANCHO }}
      className="pointer-events-none fixed z-[75] animate-[pop_0.14s_ease-out] rounded-2xl border border-line border-t-4 border-t-club-pc bg-surface p-3 text-fg shadow-[0_18px_44px_rgba(1,21,38,.28)]"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <strong className="text-base font-extrabold">Mesa {mesa.codigo.slice(-2)}</strong>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${estilo.insignia}`}
        >
          {estilo.etiqueta}
        </span>
      </div>
      <ul className="space-y-2">
        {ocupada ? (
          <>
            {fila(Users, `${mesa.comensales} ${mesa.comensales === 1 ? 'comensal' : 'comensales'}`)}
            {fila(
              ReceiptText,
              `${mesa.numeroCuentas} ${mesa.numeroCuentas === 1 ? 'cuenta' : 'cuentas'}`,
            )}
            {fila(Wallet, `Consumo ${formatoMonedaEntera(totalMesa(mesa))}`)}
          </>
        ) : (
          fila(Armchair, `${mesa.capacidad} ${mesa.capacidad === 1 ? 'silla' : 'sillas'}`)
        )}
      </ul>
    </div>,
    document.body,
  )
}
