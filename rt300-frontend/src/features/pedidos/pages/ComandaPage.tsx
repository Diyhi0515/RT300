import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronUp, Hash, Send, Store } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSesion } from '@/features/auth'
import { formatoMoneda } from '@/features/salon/formato'
import { vibrar } from '@/lib/vibrar'
import { notificar } from '@/shared/avisos/almacen'
import { HojaInferior } from '@/shared/ui/HojaInferior'
import { borrarBorrador, guardarBorrador, leerBorrador } from '../borradorComanda'
import { cantidadItems, textoVistaPrevia, totalItems } from '../calculos'
import { MAXIMO_CANTIDAD_PRODUCTO, MAXIMO_PRODUCTOS_COMANDA } from '../limites'
import { CategoriasComanda } from '../components/CategoriasComanda'
import { CentroProduccionModal } from '../components/CentroProduccionModal'
import { ConfirmarAccion } from '../components/ConfirmarAccion'
import { ExtrasProductoModal } from '../components/ExtrasProductoModal'
import { NotaProductoModal } from '../components/NotaProductoModal'
import { ProductosComanda } from '../components/ProductosComanda'
import { ResumenComanda, type TipoEdicion } from '../components/ResumenComanda'
import { VistaPreviaPedido } from '../components/VistaPreviaPedido'
import { useEnviarComanda, useMesaDetalle, useModoImpresion, useSecciones } from '../hooks'
import { usePedidos } from '../store'
import type { ItemComanda, MesaDetalle, Plato, SeccionMenu } from '../types'

export function ComandaPage() {
  const { codigo, cuenta } = useParams()
  const { mesa, cargandoMesas, cargandoCuentas } = useMesaDetalle(codigo ?? null)
  const numero = Number(cuenta)

  if (cargandoMesas || cargandoCuentas) {
    return (
      <p role="status" className="py-16 text-center text-sm text-muted">
        Cargando la mesa...
      </p>
    )
  }
  if (!mesa || !Number.isInteger(numero) || !mesa.cuentas.some((c) => c.numero === numero)) {
    return <Navigate to="/pedidos" replace />
  }

  return <Contenido key={`${mesa.folio}-${numero}`} mesa={mesa} numero={numero} />
}

interface ContenidoProps {
  mesa: MesaDetalle
  numero: number
}

function Contenido({ mesa, numero }: ContenidoProps) {
  const perfil = useSesion((s) => s.perfil)
  const navigate = useNavigate()
  const { abrirCuenta, mostrarMesa } = usePedidos.getState()
  const secciones = useSecciones()
  const envio = useEnviarComanda()
  const modoServicio = useModoImpresion()
  const [seccionElegida, setSeccionElegida] = useState<SeccionMenu | null>(null)
  const [subseccion, setSubseccion] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [elegidos, setElegidos] = useState<Record<string, ItemComanda>>(() =>
    leerBorrador(mesa.folio, numero),
  )
  const [resumenAbierto, setResumenAbierto] = useState(false)
  const [confirmandoEnvio, setConfirmandoEnvio] = useState(false)
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)
  const [confirmandoVaciar, setConfirmandoVaciar] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const [edicion, setEdicion] = useState<{ id: string; tipo: TipoEdicion } | null>(null)
  const registrando = useRef(false)

  useEffect(() => {
    guardarBorrador(mesa.folio, numero, elegidos)
  }, [mesa.folio, numero, elegidos])

  const items = Object.values(elegidos).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const itemEditado = edicion ? elegidos[edicion.id] : undefined
  const total = totalItems(items)
  const cantidad = cantidadItems(items)
  const etiquetaCantidad = `${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`

  const volverALaMesa = () => {
    mostrarMesa(mesa.codigo, mesa.areaId)
    abrirCuenta(numero)
    navigate('/pedidos')
  }

  const cambiarCantidad = (plato: Plato, delta: number) => {
    if (registrando.current) return
    const actualCantidad = elegidos[plato.id]?.cantidad ?? 0
    if (delta > 0 && actualCantidad >= MAXIMO_CANTIDAD_PRODUCTO) {
      notificar.advertencia(`Máximo ${MAXIMO_CANTIDAD_PRODUCTO} por producto.`)
      return
    }
    if (
      delta > 0 &&
      actualCantidad === 0 &&
      Object.keys(elegidos).length >= MAXIMO_PRODUCTOS_COMANDA
    ) {
      notificar.advertencia(`Máximo ${MAXIMO_PRODUCTOS_COMANDA} productos por comanda.`)
      return
    }
    vibrar('toque')
    setElegidos((actual) => {
      const nueva = Math.min(
        MAXIMO_CANTIDAD_PRODUCTO,
        Math.max(0, (actual[plato.id]?.cantidad ?? 0) + Math.sign(delta)),
      )
      const copia = { ...actual }
      if (nueva === 0) delete copia[plato.id]
      else {
        const previo = actual[plato.id]
        const ultimo = Math.max(0, ...Object.values(actual).map((i) => i.orden ?? 0))
        copia[plato.id] = {
          ...previo,
          plato,
          cantidad: nueva,
          seccion: previo?.seccion ?? seccionElegida?.codigo,
          categoria: previo?.categoria ?? seccionElegida?.nombre,
          subcategoria:
            previo?.subcategoria ??
            seccionElegida?.subsecciones.find((s) => s.codigo === plato.subseccion)?.nombre,
          orden: previo?.orden ?? ultimo + 1,
        }
      }
      return copia
    })
  }

  const eliminarProducto = (id: string) => {
    if (registrando.current) return
    vibrar('toque')
    setElegidos((actual) => {
      const copia = { ...actual }
      delete copia[id]
      return copia
    })
  }

  const vaciarComanda = () => {
    if (registrando.current) return
    setElegidos({})
    setResumenAbierto(false)
  }

  const cambiarItem = (id: string, cambio: Partial<ItemComanda>) => {
    if (registrando.current) return
    setElegidos((actual) =>
      actual[id] ? { ...actual, [id]: { ...actual[id], ...cambio } } : actual,
    )
    setEdicion(null)
  }

  const elegirSeccion = (seccion: SeccionMenu) => {
    setBusqueda('')
    setSubseccion(0)
    setSeccionElegida(seccion)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const enviar = async () => {
    if (!items.length || registrando.current || envio.isPending) return
    registrando.current = true
    try {
      await envio.mutateAsync({
        folio: mesa.folio,
        cuenta: numero,
        glos: '',
        items: items.map((i) => ({
          cart: i.plato.id,
          cant: i.cantidad,
          ...(i.nota ? { glos: i.nota } : {}),
          ...(i.centro ? { ccpd: i.centro.codigo } : {}),
          ...(i.extras?.length
            ? { extras: i.extras.map((e) => ({ cart: e.codigo, cant: e.cantidad })) }
            : {}),
        })),
      })
    } catch {
      registrando.current = false
      return
    }
    borrarBorrador(mesa.folio, numero)
    vibrar('exito')
    if (modoServicio.data === 'simulada') {
      notificar.advertencia(
        `${etiquetaCantidad} por ${formatoMoneda(total)}. El servidor está en modo de prueba: la comanda quedó registrada, pero no llega a cocina ni aparece en el consumo de la cuenta.`,
        'Comanda registrada (modo de prueba)',
      )
    } else {
      notificar.exito(`${etiquetaCantidad} por ${formatoMoneda(total)}.`, 'Comanda registrada')
    }
    volverALaMesa()
  }

  const pedirEnvio = () => {
    if (!items.length || registrando.current) return
    setResumenAbierto(false)
    setConfirmandoEnvio(true)
  }

  const resumenLateral = (
    <aside
      aria-label="Resumen de la comanda"
      className={`hidden overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_12px_32px_rgba(1,21,38,.06)] md:flex md:flex-col max-lg:short:md:hidden! ${
        seccionElegida === null
          ? 'md:sticky md:top-[11.25rem] md:h-[calc(var(--alto-app,100dvh)-11.25rem-var(--pie))] [--pie:calc(env(safe-area-inset-bottom)+7.5rem)] escritorio:[--pie:2rem] short:md:top-[8.5rem] short:md:h-[calc(var(--alto-app,100dvh)-8.5rem-var(--pie))] short:[--pie:calc(env(safe-area-inset-bottom)+5rem)] short:escritorio:[--pie:1rem]'
          : 'md:max-h-full md:self-stretch'
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-gradient-to-r from-club-pc/10 to-transparent px-4 py-3 short:py-2">
        <h2 className="text-sm font-extrabold">Resumen de la comanda</h2>
        {cantidad > 0 && (
          <span className="rounded-lg bg-primary px-2 py-1 text-[11px] font-bold text-white">
            {etiquetaCantidad}
          </span>
        )}
      </div>
      <ResumenComanda
        items={items}
        total={total}
        enviando={envio.isPending}
        deshabilitado={!items.length}
        alEnviar={pedirEnvio}
        alVistaPrevia={() => setVistaPrevia(true)}
        alCambiarCantidad={cambiarCantidad}
        alEliminar={eliminarProducto}
        alVaciar={() => setConfirmandoVaciar(true)}
        alEditar={(id, tipo) => setEdicion({ id, tipo })}
      />
    </aside>
  )

  return (
    <div className="space-y-4 pb-28 sm:space-y-5 md:pb-0 short:space-y-3">
      <header className="shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          <Link
            to="/pedidos"
            onClick={(evento) => {
              if (!items.length) {
                mostrarMesa(mesa.codigo, mesa.areaId)
                abrirCuenta(numero)
                return
              }
              evento.preventDefault()
              setConfirmandoSalida(true)
            }}
            aria-label="Volver a la mesa"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:border-club-pc/50 hover:text-fg active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-tight tracking-[-0.02em] sm:text-[28px] short:text-xl">
              Nueva comanda
            </h1>
            <p className="text-xs text-muted sm:text-sm">
              Mesa {mesa.codigo} · Cuenta {numero}
            </p>
          </div>
          <div className="hidden flex-wrap gap-2 text-xs font-bold md:flex max-lg:short:md:hidden!">
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
      </header>

      <div
        className={
          seccionElegida === null
            ? 'grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_380px] min-[1400px]:grid-cols-[minmax(0,1fr)_420px] max-lg:short:md:grid-cols-[minmax(0,1fr)]!'
            : ''
        }
      >
        <div className="min-w-0">
          {seccionElegida === null ? (
            <CategoriasComanda
              secciones={secciones.data ?? []}
              cargando={secciones.isPending}
              alElegir={elegirSeccion}
            />
          ) : (
            <ProductosComanda
              seccion={seccionElegida}
              subseccion={subseccion}
              busqueda={busqueda}
              elegidos={elegidos}
              alCambiarSubseccion={(codigo) => {
                setBusqueda('')
                setSubseccion(codigo)
              }}
              alCambiarBusqueda={setBusqueda}
              alCambiarCantidad={cambiarCantidad}
              alVolver={() => setSeccionElegida(null)}
              lateral={resumenLateral}
            />
          )}
        </div>

        {seccionElegida === null && resumenLateral}
      </div>

      {cantidad > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-30 animate-[subir_0.18s_ease-out] px-3 short:bottom-[calc(env(safe-area-inset-bottom)+56px)] md:hidden max-lg:short:md:block!">
          <div className="mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-[0_10px_30px_rgba(1,21,38,.22)]">
            <button
              type="button"
              onClick={() => setResumenAbierto(true)}
              aria-label="Ver el resumen de la comanda"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-1 text-left"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary short:size-9">
                <ChevronUp className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] text-muted">{etiquetaCantidad}</span>
                <strong className="block text-lg font-extrabold leading-tight tabular-nums">
                  {formatoMoneda(total)}
                </strong>
              </span>
            </button>
            <button
              type="button"
              disabled={envio.isPending}
              onClick={pedirEnvio}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-club-pc to-club-tertiary px-5 font-bold text-white shadow-[0_10px_24px_rgba(43,83,184,.35)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 short:h-10"
            >
              <Send className="size-[18px]" aria-hidden />
              Registrar
            </button>
          </div>
        </div>
      )}

      <HojaInferior
        abierta={resumenAbierto}
        alCerrar={() => setResumenAbierto(false)}
        titulo="Resumen de la comanda"
      >
        <div className="pb-2">
          <h2 className="px-5 pb-2 text-lg font-extrabold">Resumen de la comanda</h2>
          <ResumenComanda
            items={items}
            total={total}
            enviando={envio.isPending}
            deshabilitado={!items.length}
            alEnviar={pedirEnvio}
            alVistaPrevia={() => setVistaPrevia(true)}
            alCambiarCantidad={cambiarCantidad}
            alEliminar={eliminarProducto}
            alVaciar={() => setConfirmandoVaciar(true)}
            alEditar={(id, tipo) => setEdicion({ id, tipo })}
          />
        </div>
      </HojaInferior>

      <ConfirmarAccion
        abierto={confirmandoEnvio}
        titulo="¿Registrar la comanda?"
        mensaje={`${etiquetaCantidad} por ${formatoMoneda(total)} para la cuenta ${numero} de la mesa ${mesa.codigo}.`}
        textoConfirmar="Sí, registrar"
        alConfirmar={() => {
          setConfirmandoEnvio(false)
          void enviar()
        }}
        alCancelar={() => setConfirmandoEnvio(false)}
      />
      {vistaPrevia && items.length > 0 && (
        <VistaPreviaPedido
          texto={textoVistaPrevia({
            mesa: mesa.codigo,
            cuenta: numero,
            cliente: mesa.cuentas.find((c) => c.numero === numero)?.nombre ?? '',
            items,
          })}
          alCerrar={() => setVistaPrevia(false)}
        />
      )}
      <ConfirmarAccion
        abierto={confirmandoVaciar}
        peligro
        titulo="¿Vaciar la comanda?"
        mensaje={`Se quitarán ${etiquetaCantidad} de la comanda. Aún no se ha registrado nada.`}
        textoConfirmar="Sí, vaciar"
        alConfirmar={() => {
          setConfirmandoVaciar(false)
          vaciarComanda()
        }}
        alCancelar={() => setConfirmandoVaciar(false)}
      />
      {itemEditado && edicion?.tipo === 'nota' && (
        <NotaProductoModal
          key={itemEditado.plato.id}
          producto={itemEditado.plato.nombre}
          valor={itemEditado.nota ?? ''}
          alGuardar={(nota) => cambiarItem(itemEditado.plato.id, { nota: nota || undefined })}
          alCerrar={() => setEdicion(null)}
        />
      )}
      {itemEditado && edicion?.tipo === 'centro' && (
        <CentroProduccionModal
          key={itemEditado.plato.id}
          cart={itemEditado.plato.id}
          producto={itemEditado.plato.nombre}
          actual={itemEditado.centro}
          alGuardar={(centro) => cambiarItem(itemEditado.plato.id, { centro })}
          alCerrar={() => setEdicion(null)}
        />
      )}
      {itemEditado && edicion?.tipo === 'extras' && (
        <ExtrasProductoModal
          key={itemEditado.plato.id}
          producto={itemEditado.plato.nombre}
          seccion={itemEditado.seccion}
          subseccion={itemEditado.plato.subseccion}
          actual={itemEditado.extras}
          alGuardar={(extras) =>
            cambiarItem(itemEditado.plato.id, { extras: extras.length ? extras : undefined })
          }
          alCerrar={() => setEdicion(null)}
        />
      )}
      <ConfirmarAccion
        abierto={confirmandoSalida}
        peligro
        titulo="¿Salir sin registrar?"
        mensaje={`Hay ${etiquetaCantidad} sin registrar. Si sales, se pierde la comanda.`}
        textoConfirmar="Salir"
        alConfirmar={() => {
          setConfirmandoSalida(false)
          borrarBorrador(mesa.folio, numero)
          volverALaMesa()
        }}
        alCancelar={() => setConfirmandoSalida(false)}
      />
    </div>
  )
}
