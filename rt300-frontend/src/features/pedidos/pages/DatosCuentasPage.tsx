import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Hash, Search, Store, UserRoundSearch, UserRoundPen } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useSesion } from '@/features/auth'
import { vibrar } from '@/lib/vibrar'
import { notificar } from '@/shared/avisos/almacen'
import { buscarClientes } from '../api'
import { ListadoClientes } from '../components/ListadoClientes'
import { SelectorCuentas } from '../components/SelectorCuentas'
import { TablaCuentasMesa } from '../components/TablaCuentasMesa'
import { useActualizarCuenta, useMesaDetalle } from '../hooks'
import { mapearCliente } from '../mapeos'
import { usePedidos } from '../store'
import type { ClienteRegistrado, Cuenta, MesaDetalle } from '../types'

type Vista = 'datos' | 'clientes'

const campo =
  'h-12 w-full rounded-xl border border-line bg-surface px-3 text-base font-medium outline-none transition focus:border-club-pc focus:ring-2 focus:ring-club-pc/25 lg:h-11 lg:text-sm'

const etiqueta = 'text-[11px] font-extrabold uppercase tracking-wide text-club-primary'

const botonSecundario =
  'inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold transition hover:border-club-pc/50 hover:bg-club-pc/5 active:scale-95 sm:px-4 lg:h-11'

const botonPrimario =
  'inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(43,83,184,.3)] transition hover:brightness-110 active:scale-95 lg:h-11'

const pestanas: { id: Vista; texto: string; icono: typeof UserRoundPen }[] = [
  { id: 'datos', texto: 'Datos de la cuenta', icono: UserRoundPen },
  { id: 'clientes', texto: 'Clientes', icono: UserRoundSearch },
]

export function DatosCuentasPage() {
  const { codigo } = useParams()
  const { mesa, cargandoMesas, cargandoCuentas } = useMesaDetalle(codigo ?? null)

  if (cargandoMesas || cargandoCuentas) {
    return (
      <p role="status" className="py-16 text-center text-sm text-muted">
        Cargando cuentas...
      </p>
    )
  }
  if (!mesa || mesa.cuentas.length === 0) return <Navigate to="/pedidos" replace />

  return <Contenido key={mesa.folio} mesa={mesa} />
}

interface ContenidoProps {
  mesa: MesaDetalle
}

function Contenido({ mesa }: ContenidoProps) {
  const perfil = useSesion((s) => s.perfil)
  const cuentaActiva = usePedidos((s) => s.cuentaActiva)
  const { abrirCuenta, mostrarMesa } = usePedidos.getState()
  const actualizar = useActualizarCuenta()

  const inicial = mesa?.cuentas.find((c) => c.numero === cuentaActiva) ?? mesa?.cuentas[0]
  const [numero, setNumero] = useState(inicial?.numero ?? 1)
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [codigoCliente, setCodigoCliente] = useState(inicial?.codigoCliente ?? '')
  const [nit, setNit] = useState(inicial?.nit ?? '')
  const [vista, setVista] = useState<Vista>('datos')
  const [clienteCargado, setClienteCargado] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const elegirCuenta = (c: Cuenta) => {
    setNumero(c.numero)
    setNombre(c.nombre.toUpperCase())
    setCodigoCliente(c.codigoCliente ?? '')
    setNit(c.nit ?? '')
    setClienteCargado(null)
  }

  const aplicarCliente = (cliente: ClienteRegistrado) => {
    setCodigoCliente(cliente.codigo)
    setNombre(cliente.nombre.toUpperCase())
    setNit(cliente.nit)
    setClienteCargado(cliente.nombre.toUpperCase())
    setVista('datos')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    vibrar('toque')
  }

  const buscarCodigo = async () => {
    const buscado = Number(codigoCliente.trim())
    if (!buscado) {
      notificar.advertencia('Escribe el código del cliente.', 'Falta el código')
      return
    }
    try {
      const [cliente] = await buscarClientes({ codigo: buscado })
      if (cliente) aplicarCliente(mapearCliente(cliente))
    } catch {
      notificar.advertencia('No existe un cliente con ese código.', 'Cliente no encontrado')
    }
  }

  const modificar = async () => {
    const limpio = nombre.trim().toUpperCase()
    if (!limpio) {
      notificar.advertencia('Escribe el nombre de la cuenta.', 'Falta el nombre')
      return
    }
    try {
      await actualizar.mutateAsync({
        folio: mesa.folio,
        cuenta: numero,
        mesa: mesa.codigo,
        cage: Number(codigoCliente.trim()) || 0,
        nruc: nit.trim(),
        nomb: limpio,
      })
    } catch {
      return
    }
    setClienteCargado(null)
    vibrar('exito')
    notificar.exito(`Se actualizó la cuenta ${numero}.`, `Mesa ${mesa.codigo}`)
  }

  return (
    <div className="space-y-4 sm:space-y-5 short:space-y-3">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <Link
            to="/pedidos"
            onClick={() => {
              mostrarMesa(mesa.codigo, mesa.areaId)
              abrirCuenta(numero)
            }}
            aria-label="Volver a pedidos"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:border-club-pc/50 hover:text-fg active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-tight tracking-[-0.02em] sm:text-[28px] short:text-xl">
              Datos cuentas
            </h1>
            <p className="text-xs text-muted sm:text-sm">Cliente, NIT y nombre de cada cuenta</p>
          </div>
          <div className="hidden flex-wrap gap-2 text-xs font-bold md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-club-pc/10 px-2.5 py-1.5 text-club-primary">
              <Store className="size-3.5" aria-hidden />
              {perfil?.local ?? 'Local'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-club-pc/10 px-2.5 py-1.5 text-club-primary">
              <Hash className="size-3.5" aria-hidden />
              Mesa {mesa.codigo}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold md:hidden">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-club-pc/10 px-2.5 py-1.5 text-club-primary">
            <Store className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{perfil?.local ?? 'Local'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-club-pc/10 px-2.5 py-1.5 text-club-primary">
            <Hash className="size-3.5" aria-hidden />
            Mesa {mesa.codigo}
          </span>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Secciones"
        className="grid grid-cols-2 gap-1 rounded-2xl bg-bg p-1 md:hidden"
      >
        {pestanas.map(({ id, texto, icono: Icono }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={vista === id}
            onClick={() => setVista(id)}
            className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold transition active:scale-95 ${
              vista === id
                ? 'bg-gradient-to-r from-club-pc to-club-tertiary text-white shadow-[0_4px_12px_rgba(43,83,184,.3)]'
                : 'text-muted hover:text-fg'
            }`}
          >
            <Icono className="size-4" aria-hidden />
            {texto}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div
          className={`min-w-0 space-y-4 ${vista === 'datos' ? '' : 'hidden md:block md:space-y-4'}`}
        >
          <div className="lg:hidden">
            <SelectorCuentas cuentas={mesa.cuentas} seleccionada={numero} alElegir={elegirCuenta} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void modificar()
            }}
            className="space-y-4 rounded-3xl border border-line bg-surface p-4 shadow-[0_12px_32px_rgba(1,21,38,.06)] sm:p-5"
          >
            {clienteCargado && (
              <p
                role="status"
                className="rounded-xl bg-success/12 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
              >
                Se cargó {clienteCargado} en la cuenta {numero}. Revisa y pulsa Modificar para
                guardar.
              </p>
            )}
            <div className="grid gap-3 lg:grid-cols-[8rem_minmax(0,1fr)]">
              <label className="hidden space-y-1.5 lg:block">
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
              <div className="space-y-1.5">
                <label htmlFor="datos-cuenta-codigo" className={etiqueta}>
                  Código cliente
                </label>
                <div className="flex gap-2">
                  <input
                    id="datos-cuenta-codigo"
                    value={codigoCliente}
                    onChange={(e) => {
                      setCodigoCliente(e.target.value)
                      setClienteCargado(null)
                    }}
                    className={campo}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => void buscarCodigo()}
                    aria-label="Buscar cliente por código"
                    className={botonSecundario}
                  >
                    <Search className="size-4" />
                    <span className="hidden sm:inline">Buscar</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <div className="space-y-1.5">
                <label htmlFor="datos-cuenta-nit" className={etiqueta}>
                  NIT / CI
                </label>
                <input
                  id="datos-cuenta-nit"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className={campo}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="datos-cuenta-nombre" className={etiqueta}>
                  Nombre
                </label>
                <input
                  id="datos-cuenta-nombre"
                  value={nombre}
                  maxLength={40}
                  onChange={(e) => setNombre(e.target.value.toUpperCase())}
                  className={campo}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="grid gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setVista('clientes')}
                className={`${botonSecundario} md:hidden`}
              >
                <UserRoundSearch className="size-4" />
                Buscar en la lista de clientes
              </button>
              <button
                type="submit"
                disabled={actualizar.isPending}
                className={`${botonPrimario} w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
              >
                <Check className="size-4" />
                {actualizar.isPending ? 'Guardando...' : 'Modificar'}
              </button>
            </div>
          </form>

          <div className="hidden lg:block">
            <TablaCuentasMesa
              cuentas={mesa.cuentas}
              seleccionada={numero}
              alElegir={elegirCuenta}
            />
          </div>
        </div>

        <div className={`min-w-0 ${vista === 'clientes' ? '' : 'hidden md:block'}`}>
          <ListadoClientes seleccionado={codigoCliente} alElegir={aplicarCliente} />
        </div>
      </div>
    </div>
  )
}
