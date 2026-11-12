import { create } from 'zustand'
import { useSesion } from '@/features/auth'
import { areas, crearMesasPlano } from '@/simulados/pedidos'
import type { Cuenta, DatosCuenta, ItemComanda, MesaPlano } from './types'

interface EstadoPedidos {
  mesas: MesaPlano[]
  areaId: string
  seleccionada: string | null
  cuentaActiva: number | null
  comandaEn: number | null
  elegirArea: (id: string) => void
  seleccionar: (codigo: string | null) => void
  abrirCuenta: (numero: number | null) => void
  abrirComanda: (numero: number | null) => void
  ocupar: (codigo: string, comensales: number, cuentas: number, mozo: string) => void
  modificar: (codigo: string, comensales: number, cuentas: number) => void
  agregarCuenta: (codigo: string) => void
  eliminarCuenta: (codigo: string, numero: number) => void
  renombrarCuenta: (codigo: string, numero: number, nombre: string) => void
  actualizarCuenta: (codigo: string, numero: number, datos: DatosCuenta) => void
  liberar: (codigo: string) => void
  reservar: (codigo: string) => void
  habilitar: (codigo: string) => void
  enviarComanda: (codigo: string, numero: number, items: ItemComanda[]) => void
  pedirCuenta: (codigo: string) => void
  liquidarCuenta: (codigo: string, numero: number) => void
}

let contadorFolio = 1200

const cuentasNuevas = (cantidad: number, existentes: Cuenta[] = []): Cuenta[] =>
  Array.from(
    { length: cantidad },
    (_, i) =>
      existentes[i] ?? { numero: i + 1, nombre: `Cuenta ${i + 1}`, liquidada: false, lineas: [] },
  )

const cambiar = (
  mesas: MesaPlano[],
  codigo: string,
  cambios: (m: MesaPlano) => Partial<MesaPlano>,
) => mesas.map((m) => (m.codigo === codigo ? { ...m, ...cambios(m) } : m))

const estadoInicial = () => ({
  mesas: crearMesasPlano(),
  areaId: areas[0].id,
  seleccionada: null,
  cuentaActiva: null,
  comandaEn: null,
})

export const usePedidos = create<EstadoPedidos>((set) => ({
  ...estadoInicial(),
  elegirArea: (id) => set({ areaId: id, seleccionada: null, cuentaActiva: null, comandaEn: null }),
  seleccionar: (codigo) => set({ seleccionada: codigo, cuentaActiva: null, comandaEn: null }),
  abrirCuenta: (numero) => set({ cuentaActiva: numero }),
  abrirComanda: (numero) => set({ comandaEn: numero }),
  ocupar: (codigo, comensales, cuentas, mozo) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, () => ({
        estado: 'ocupada',
        comensales,
        apertura: Date.now(),
        mozo,
        folio: contadorFolio++,
        cuentas: cuentasNuevas(cuentas),
      })),
      cuentaActiva: null,
    })),
  modificar: (codigo, comensales, cuentas) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, (m) => ({
        comensales,
        cuentas: cuentasNuevas(cuentas, m.cuentas),
      })),
    })),
  agregarCuenta: (codigo) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, (m) => ({
        cuentas: [
          ...m.cuentas,
          {
            numero: m.cuentas.length + 1,
            nombre: `Cuenta ${m.cuentas.length + 1}`,
            liquidada: false,
            lineas: [],
          },
        ],
      })),
    })),
  eliminarCuenta: (codigo, numero) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, (m) => ({
        cuentas: m.cuentas
          .filter((c) => c.numero !== numero)
          .map((c, i) => ({
            ...c,
            numero: i + 1,
            nombre: /^Cuenta \d+$/.test(c.nombre) ? `Cuenta ${i + 1}` : c.nombre,
          })),
      })),
      cuentaActiva: null,
      comandaEn: null,
    })),
  actualizarCuenta: (codigo, numero, datos) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, (m) => ({
        cuentas: m.cuentas.map((c) => (c.numero === numero ? { ...c, ...datos } : c)),
      })),
    })),
  renombrarCuenta: (codigo, numero, nombre) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, (m) => ({
        cuentas: m.cuentas.map((c) => (c.numero === numero ? { ...c, nombre } : c)),
      })),
    })),
  liberar: (codigo) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, () => ({
        estado: 'libre',
        comensales: 0,
        apertura: null,
        mozo: null,
        folio: 0,
        cuentas: [],
      })),
      seleccionada: null,
      cuentaActiva: null,
      comandaEn: null,
    })),
  reservar: (codigo) =>
    set((s) => ({ mesas: cambiar(s.mesas, codigo, () => ({ estado: 'reservada' })) })),
  habilitar: (codigo) =>
    set((s) => ({ mesas: cambiar(s.mesas, codigo, () => ({ estado: 'libre' })) })),
  enviarComanda: (codigo, numero, items) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, (m) => ({
        estado: m.estado === 'cobro' ? 'ocupada' : m.estado,
        cuentas: m.cuentas.map((c) => {
          if (c.numero !== numero) return c
          const lineas = [...c.lineas]
          for (const { plato, cantidad } of items) {
            const indice = lineas.findIndex((l) => l.platoId === plato.id)
            if (indice >= 0) {
              lineas[indice] = { ...lineas[indice], cantidad: lineas[indice].cantidad + cantidad }
            } else {
              lineas.push({
                id: `${numero}-${plato.id}-${Date.now()}`,
                platoId: plato.id,
                nombre: plato.nombre,
                cantidad,
                precio: plato.precio,
              })
            }
          }
          return { ...c, lineas }
        }),
      })),
      comandaEn: null,
    })),
  pedirCuenta: (codigo) =>
    set((s) => ({ mesas: cambiar(s.mesas, codigo, () => ({ estado: 'cobro' })) })),
  liquidarCuenta: (codigo, numero) =>
    set((s) => ({
      mesas: cambiar(s.mesas, codigo, (m) => ({
        cuentas: m.cuentas.map((c) => (c.numero === numero ? { ...c, liquidada: true } : c)),
      })),
      cuentaActiva: null,
    })),
}))

useSesion.subscribe((estado, previo) => {
  if (previo.perfil && !estado.perfil) usePedidos.setState(estadoInicial())
})
