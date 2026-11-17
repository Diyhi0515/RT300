import { useEffect, useRef, useState } from 'react'
import { Check, Pencil, Search } from 'lucide-react'
import { notificar } from '@/shared/avisos/almacen'
import { Modal } from '@/shared/ui/Modal'
import { buscarClientes } from '../api'
import { mapearCliente } from '../mapeos'
import type { Cuenta, DatosCuenta } from '../types'

interface EditarCuentaModalProps {
  cuenta: Cuenta
  alCerrar: () => void
  alGuardar: (datos: DatosCuenta) => Promise<boolean>
}

type EstadoBusqueda = 'reposo' | 'buscando' | 'encontrado' | 'inexistente'

const CODIGO_SIN_CLIENTE = '0'
const MAXIMO_DIGITOS_CODIGO = 9
const MAXIMO_DIGITOS_BUSQUEDA = 15
const ESPERA_BUSQUEDA_MS = 600

const etiqueta = 'text-[10px] font-extrabold uppercase tracking-wide text-club-primary'

const campo =
  'h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium outline-none transition focus:border-club-pc focus:ring-2 focus:ring-club-pc/25 disabled:cursor-not-allowed disabled:opacity-50 short:h-10'

const mensajes: Record<Exclude<EstadoBusqueda, 'reposo'>, { texto: string; clase: string }> = {
  buscando: { texto: 'Buscando cliente...', clase: 'text-muted' },
  encontrado: {
    texto: 'Se cargaron el código, el nombre y el NIT del cliente.',
    clase: 'text-success',
  },
  inexistente: { texto: 'No existe un cliente con ese código.', clase: 'text-danger' },
}

export function EditarCuentaModal({ cuenta, alCerrar, alGuardar }: EditarCuentaModalProps) {
  const inicial = cuenta.codigoCliente || CODIGO_SIN_CLIENTE
  const [codigo, setCodigo] = useState(inicial)
  const [nit, setNit] = useState(cuenta.nit ?? '')
  const [nombre, setNombre] = useState(cuenta.nombre.toUpperCase())
  const [desdeBarra, setDesdeBarra] = useState(false)
  const [consulta, setConsulta] = useState('')
  const [estado, setEstado] = useState<EstadoBusqueda>('reposo')
  const [guardando, setGuardando] = useState(false)
  const peticion = useRef(0)
  const consultado = useRef(inicial)

  const buscar = async (valor: string) => {
    const numero = Number(valor)
    const id = ++peticion.current
    consultado.current = valor
    if (!numero) {
      setEstado('reposo')
      return
    }
    setEstado('buscando')
    try {
      const [cliente] = await buscarClientes({ codigo: numero })
      if (peticion.current !== id) return
      if (!cliente) {
        setEstado('inexistente')
        return
      }
      const datos = mapearCliente(cliente)
      setCodigo(datos.codigo)
      setNombre(datos.nombre.toUpperCase())
      setNit(datos.nit)
      setEstado('encontrado')
    } catch {
      if (peticion.current === id) setEstado('inexistente')
    }
  }

  const buscarRef = useRef(buscar)
  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
    if (codigo === consultado.current) return
    const temporizador = window.setTimeout(() => void buscarRef.current(codigo), ESPERA_BUSQUEDA_MS)
    return () => window.clearTimeout(temporizador)
  }, [codigo])

  const soloDigitos = (valor: string, maximo = MAXIMO_DIGITOS_CODIGO) =>
    valor.replace(/\D/g, '').slice(0, maximo)

  const cambiarCodigo = (valor: string) => {
    peticion.current += 1
    setEstado('reposo')
    setDesdeBarra(false)
    setCodigo(soloDigitos(valor))
  }

  const buscarDesdeBarra = () => {
    const valor = soloDigitos(consulta, MAXIMO_DIGITOS_BUSQUEDA)
    if (!Number(valor)) {
      notificar.advertencia('Escribe el código o el NIT / CI del cliente.', 'Falta el dato')
      return
    }
    peticion.current += 1
    setDesdeBarra(true)
    void buscarDesdeBarraConDocumento(valor)
  }

  const buscarDesdeBarraConDocumento = async (valor: string) => {
    const id = ++peticion.current
    consultado.current = valor
    setEstado('buscando')
    try {
      const porCodigo =
        valor.length <= MAXIMO_DIGITOS_CODIGO ? await buscarClientes({ codigo: Number(valor) }) : []
      const [cliente] = porCodigo.length ? porCodigo : await buscarClientes({ documento: valor })
      if (peticion.current !== id) return
      if (!cliente) {
        setEstado('inexistente')
        return
      }
      const datos = mapearCliente(cliente)
      setCodigo(datos.codigo)
      consultado.current = datos.codigo
      setNombre(datos.nombre.toUpperCase())
      setNit(datos.nit)
      setEstado('encontrado')
    } catch {
      if (peticion.current === id) setEstado('inexistente')
    }
  }

  const guardar = async () => {
    const limpio = nombre.trim().toUpperCase()
    if (!limpio) {
      notificar.advertencia('Escribe el nombre de la cuenta.', 'Falta el nombre')
      return
    }
    setGuardando(true)
    const hecho = await alGuardar({
      nombre: limpio,
      codigoCliente: codigo || CODIGO_SIN_CLIENTE,
      nit: nit.trim(),
    })
    setGuardando(false)
    if (hecho) alCerrar()
  }

  const aviso =
    estado === 'inexistente' && desdeBarra
      ? {
          texto:
            'No hay un cliente con ese código, NIT ni CI.',
          clase: 'text-danger',
        }
      : estado === 'reposo'
        ? null
        : mensajes[estado]

  return (
    <Modal
      open
      onClose={alCerrar}
      title={`Editar cuenta ${cuenta.numero}`}
      dismissible={!guardando}
      className="sm:max-w-2xl"
    >
      <form
        className="space-y-4 p-5 short:space-y-2.5 short:p-4"
        onSubmit={(e) => {
          e.preventDefault()
          void guardar()
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pr-10">
          <div className="flex min-w-0 items-center gap-3 pr-10 sm:pr-0">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-club-pc to-club-tertiary text-white shadow-md shadow-club-pc/30 short:size-10">
              <Pencil className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-extrabold leading-tight short:text-base">
                Editar cuenta {cuenta.numero}
              </h3>
              <p className="text-xs text-muted">Datos del cliente de la cuenta</p>
            </div>
          </div>

          <div className="space-y-1.5 sm:w-72 sm:shrink-0">
            <div className="flex gap-2">
              <input
                value={consulta}
                inputMode="numeric"
                autoComplete="off"
                aria-label="Buscar cliente"
                placeholder="Código o NIT / CI"
                onChange={(e) => setConsulta(soloDigitos(e.target.value, MAXIMO_DIGITOS_BUSQUEDA))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    buscarDesdeBarra()
                  }
                }}
                className={campo}
              />
              <button
                type="button"
                onClick={buscarDesdeBarra}
                aria-label="Buscar"
                className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-club-pc text-white transition hover:brightness-110 active:scale-95 short:size-10"
              >
                <Search className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {aviso && (
          <p role="status" className={`text-xs font-medium ${aviso.clase}`}>
            {aviso.texto}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 short:gap-2.5">
          <div className="space-y-1.5">
            <label htmlFor="editar-cuenta-codigo" className={etiqueta}>
              Código cliente
            </label>
            <input
              id="editar-cuenta-codigo"
              value={codigo}
              inputMode="numeric"
              autoComplete="off"
              onChange={(e) => cambiarCodigo(e.target.value)}
              onBlur={() => {
                if (!codigo) setCodigo(CODIGO_SIN_CLIENTE)
              }}
              className={campo}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="editar-cuenta-nit" className={etiqueta}>
              NIT / CI
            </label>
            <input
              id="editar-cuenta-nit"
              value={nit}
              inputMode="numeric"
              autoComplete="off"
              onChange={(e) => setNit(e.target.value)}
              className={campo}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="editar-cuenta-nombre" className={etiqueta}>
              Nombre
            </label>
            <input
              id="editar-cuenta-nombre"
              value={nombre}
              maxLength={40}
              autoComplete="off"
              onChange={(e) => setNombre(e.target.value.toUpperCase())}
              className={campo}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={guardando}
            onClick={alCerrar}
            className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold transition hover:border-club-pc/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 short:h-10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary text-sm font-bold text-white shadow-[0_8px_20px_rgba(43,83,184,.3)] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 short:h-10"
          >
            <Check className="size-4" />
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  )
}
