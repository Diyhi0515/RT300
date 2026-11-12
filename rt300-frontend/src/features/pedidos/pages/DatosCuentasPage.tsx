import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Hash, Search, Store, UserRoundSearch, Users } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useSesion } from '@/features/auth'
import { formatoMoneda } from '@/features/salon/formato'
import { vibrar } from '@/lib/vibrar'
import { notificar } from '@/shared/avisos/almacen'
import { clientes } from '@/simulados/pedidos'
import { totalCuenta } from '../calculos'
import { usePedidos } from '../store'
import type { ClienteRegistrado, Cuenta } from '../types'

const campo =
  'h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium outline-none transition focus:border-club-pc focus:ring-2 focus:ring-club-pc/25'

const etiqueta = 'text-[11px] font-extrabold uppercase tracking-wide text-club-primary'

const botonSecundario =
  'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold transition hover:border-club-pc/50 hover:bg-club-pc/5 active:scale-95'

const botonPrimario =
  'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(43,83,184,.3)] transition hover:brightness-110 active:scale-95'

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function DatosCuentasPage() {
  const { codigo } = useParams()
  const perfil = useSesion((s) => s.perfil)
  const mesa = usePedidos((s) => s.mesas.find((m) => m.codigo === codigo))
  const cuentaActiva = usePedidos((s) => s.cuentaActiva)
  const { actualizarCuenta, abrirCuenta, seleccionar } = usePedidos.getState()

  const inicial = mesa?.cuentas.find((c) => c.numero === cuentaActiva) ?? mesa?.cuentas[0]
  const [numero, setNumero] = useState(inicial?.numero ?? 1)
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [codigoCliente, setCodigoCliente] = useState(inicial?.codigoCliente ?? '')
  const [nit, setNit] = useState(inicial?.nit ?? '')
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroCodigo, setFiltroCodigo] = useState('')
  const [aplicado, setAplicado] = useState({ nombre: '', codigo: '' })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!mesa || mesa.cuentas.length === 0) return <Navigate to="/pedidos" replace />

  const elegirCuenta = (c: Cuenta) => {
    setNumero(c.numero)
    setNombre(c.nombre)
    setCodigoCliente(c.codigoCliente ?? '')
    setNit(c.nit ?? '')
  }

  const aplicarCliente = (cliente: ClienteRegistrado) => {
    setCodigoCliente(cliente.codigo)
    setNombre(cliente.nombre)
    setNit(cliente.nit)
    vibrar('toque')
  }

  const buscarCodigo = () => {
    const cliente = clientes.find((c) => normalizar(c.codigo) === normalizar(codigoCliente))
    if (cliente) aplicarCliente(cliente)
    else notificar.advertencia('No existe un cliente con ese código.', 'Cliente no encontrado')
  }

  const modificar = () => {
    const limpio = nombre.trim()
    if (!limpio) {
      notificar.advertencia('Escribe el nombre de la cuenta.', 'Falta el nombre')
      return
    }
    actualizarCuenta(mesa.codigo, numero, {
      nombre: limpio,
      codigoCliente: codigoCliente.trim(),
      nit: nit.trim(),
    })
    vibrar('exito')
    notificar.exito(`Se actualizó la cuenta ${numero}.`, `Mesa ${mesa.codigo}`)
  }

  const listado = clientes.filter(
    (c) =>
      normalizar(c.nombre).includes(normalizar(aplicado.nombre)) &&
      normalizar(c.codigo).includes(normalizar(aplicado.codigo)),
  )

  return (
    <div className="space-y-5 short:space-y-3">
      <header className="flex flex-wrap items-center gap-3">
        <Link
          to="/pedidos"
          onClick={() => {
            seleccionar(mesa.codigo)
            abrirCuenta(numero)
          }}
          aria-label="Volver a pedidos"
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:border-club-pc/50 hover:text-fg active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-[28px] short:text-xl">
            Datos cuentas
          </h1>
          <p className="text-sm text-muted">Edita el cliente, el NIT y el nombre de cada cuenta.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-club-pc/10 px-2.5 py-1.5 text-club-primary">
            <Store className="size-3.5" aria-hidden />
            {perfil?.local ?? 'Local'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-club-pc/10 px-2.5 py-1.5 text-club-primary">
            <Hash className="size-3.5" aria-hidden />
            Mesa {mesa.codigo}
          </span>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              modificar()
            }}
            className="space-y-4 rounded-3xl border border-line bg-surface p-4 shadow-[0_12px_32px_rgba(1,21,38,.06)] sm:p-5"
          >
            <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <label className="space-y-1.5">
                <span className={etiqueta}>No. cuenta</span>
                <select
                  value={numero}
                  onChange={(e) => {
                    const c = mesa.cuentas.find((x) => x.numero === Number(e.target.value))
                    if (c) elegirCuenta(c)
                  }}
                  className={`${campo} cursor-pointer`}
                >
                  {mesa.cuentas.map((c) => (
                    <option key={c.numero} value={c.numero}>
                      {c.numero}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={etiqueta}>Código cliente</span>
                <span className="flex gap-2">
                  <input
                    value={codigoCliente}
                    onChange={(e) => setCodigoCliente(e.target.value)}
                    className={campo}
                    inputMode="text"
                    autoComplete="off"
                  />
                  <button type="button" onClick={buscarCodigo} className={botonSecundario}>
                    <Search className="size-4" />
                    Buscar
                  </button>
                </span>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <label className="space-y-1.5">
                <span className={etiqueta}>NIT / CI</span>
                <input
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className={campo}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </label>
              <label className="space-y-1.5">
                <span className={etiqueta}>Nombre</span>
                <input
                  value={nombre}
                  maxLength={40}
                  onChange={(e) => setNombre(e.target.value)}
                  className={campo}
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="submit" className={`${botonPrimario} w-full sm:w-auto`}>
                <Check className="size-4" />
                Modificar
              </button>
            </div>
          </form>

          <section
            aria-label="Cuentas de la mesa"
            className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_12px_32px_rgba(1,21,38,.06)]"
          >
            <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4 sm:px-5">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Users className="size-4 text-club-primary" aria-hidden />
                Cuentas de la mesa
              </h2>
              <span className="rounded-md bg-line/60 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-muted">
                {mesa.cuentas.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[34rem]">
                <div className="grid grid-cols-[3.5rem_minmax(0,1.4fr)_5rem_6.5rem_5rem] gap-x-3 bg-club-pc/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide text-club-primary sm:px-5">
                  <span>Cuenta</span>
                  <span>Nombre</span>
                  <span>Cliente</span>
                  <span>NIT / CI</span>
                  <span className="text-right">Total</span>
                </div>
                <ul className="max-h-[min(40dvh,22rem)] divide-y divide-line overflow-y-auto overscroll-contain">
                  {mesa.cuentas.map((c) => {
                    const activa = c.numero === numero
                    return (
                      <li key={c.numero}>
                        <button
                          type="button"
                          onClick={() => elegirCuenta(c)}
                          aria-pressed={activa}
                          className={`grid w-full cursor-pointer grid-cols-[3.5rem_minmax(0,1.4fr)_5rem_6.5rem_5rem] items-center gap-x-3 px-4 py-2.5 text-left text-sm transition sm:px-5 ${
                            activa ? 'bg-club-pc/10' : 'hover:bg-club-pc/5'
                          }`}
                        >
                          <span
                            className={`grid size-8 place-items-center rounded-lg text-sm font-extrabold tabular-nums ${
                              activa
                                ? 'bg-gradient-to-br from-club-pc to-club-tertiary text-white'
                                : 'bg-line/60 text-muted'
                            }`}
                          >
                            {c.numero}
                          </span>
                          <span className="truncate font-semibold">{c.nombre}</span>
                          <span className="truncate text-muted">{c.codigoCliente || '-'}</span>
                          <span className="truncate tabular-nums text-muted">{c.nit || '-'}</span>
                          <span className="text-right font-bold tabular-nums">
                            {formatoMoneda(totalCuenta(c))}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <section
          aria-label="Listado de clientes"
          className="space-y-3 rounded-3xl border border-line bg-surface p-4 shadow-[0_12px_32px_rgba(1,21,38,.06)] sm:p-5 lg:sticky lg:top-[88px]"
        >
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <UserRoundSearch className="size-4 text-club-primary" aria-hidden />
            Listado de clientes
          </h2>
          <form
            className="space-y-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              setAplicado({ nombre: filtroNombre, codigo: filtroCodigo })
            }}
          >
            <label className="block space-y-1.5">
              <span className={etiqueta}>Nombre</span>
              <input
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                className={campo}
                autoComplete="off"
              />
            </label>
            <label className="block space-y-1.5">
              <span className={etiqueta}>Código</span>
              <input
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
                className={campo}
                autoComplete="off"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" className={botonPrimario}>
                <Search className="size-4" />
                Buscar
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroNombre('')
                  setFiltroCodigo('')
                  setAplicado({ nombre: '', codigo: '' })
                }}
                className={botonSecundario}
              >
                Limpiar
              </button>
            </div>
          </form>
          <div className="overflow-hidden rounded-2xl border border-line">
            <div className="grid grid-cols-[minmax(0,1fr)_4rem] gap-x-2 bg-club-pc/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-club-primary">
              <span>Nombre</span>
              <span className="text-right">Código</span>
            </div>
            {listado.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Sin resultados.</p>
            ) : (
              <ul className="max-h-[min(36dvh,16rem)] divide-y divide-line overflow-y-auto overscroll-contain">
                {listado.map((c) => (
                  <li key={c.codigo}>
                    <button
                      type="button"
                      onClick={() => aplicarCliente(c)}
                      className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_4rem] items-center gap-x-2 px-3 py-2.5 text-left text-sm transition hover:bg-club-pc/5 active:bg-club-pc/10"
                    >
                      <span className="min-w-0">
                        <strong className="block truncate font-semibold">{c.nombre}</strong>
                        <small className="text-[11px] text-muted">NIT {c.nit}</small>
                      </span>
                      <span className="text-right text-xs font-bold tabular-nums text-club-primary">
                        {c.codigo}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
