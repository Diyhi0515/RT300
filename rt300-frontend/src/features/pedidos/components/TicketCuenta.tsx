import { formatoMoneda } from '@/features/salon/formato'
import { totalCuenta } from '../calculos'
import type { Cuenta, MesaDetalle } from '../types'

interface TicketCuentaProps {
  mesa: MesaDetalle
  cuenta: Cuenta
  local: string
  emitido: Date
}

const fecha = (valor: Date) =>
  valor.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })

export function TicketCuenta({ mesa, cuenta, local, emitido }: TicketCuentaProps) {
  const unidades = cuenta.lineas.reduce((suma, l) => suma + l.cantidad, 0)
  return (
    <article
      id="ticket-impresion"
      aria-label={`Estado de cuenta ${cuenta.numero}`}
      className="mx-auto w-full max-w-[80mm] bg-white p-3 font-mono text-[12px] leading-snug text-black"
    >
      <header className="space-y-0.5 text-center">
        <h3 className="text-sm font-bold uppercase">{local}</h3>
        <p className="font-bold">ESTADO DE CUENTA</p>
        <p>{fecha(emitido)}</p>
      </header>
      <dl className="my-2 space-y-0.5 border-y border-dashed border-black py-2">
        <div className="flex justify-between gap-2">
          <dt>Mesa</dt>
          <dd className="font-bold">{mesa.codigo}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Cuenta</dt>
          <dd className="truncate text-right">
            {cuenta.numero} · {cuenta.nombre}
          </dd>
        </div>
        {mesa.mozo && (
          <div className="flex justify-between gap-2">
            <dt>Atiende</dt>
            <dd className="truncate text-right">{mesa.mozo}</dd>
          </div>
        )}
        {cuenta.nit && cuenta.nit !== '0' && (
          <div className="flex justify-between gap-2">
            <dt>NIT / CI</dt>
            <dd>{cuenta.nit}</dd>
          </div>
        )}
      </dl>
      <table className="w-full">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="w-8 py-0.5 font-bold">Cant</th>
            <th className="py-0.5 font-bold">Detalle</th>
            <th className="py-0.5 text-right font-bold">Importe</th>
          </tr>
        </thead>
        <tbody>
          {cuenta.lineas.map((linea) => (
            <tr key={linea.id} className="align-top">
              <td className="py-0.5 tabular-nums">{linea.cantidad}</td>
              <td className="py-0.5 pr-1 break-words">{linea.nombre}</td>
              <td className="py-0.5 text-right tabular-nums">
                {formatoMoneda(linea.cantidad * linea.precio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="mt-2 space-y-0.5 border-t border-dashed border-black pt-2">
        <div className="flex justify-between">
          <span>Productos</span>
          <span className="tabular-nums">{unidades}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatoMoneda(totalCuenta(cuenta))}</span>
        </div>
        <p className="pt-2 text-center text-[10px]">Documento informativo. No es una factura.</p>
      </footer>
    </article>
  )
}
