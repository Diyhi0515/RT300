import { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { useClientes } from '@/features/pedidos/hooks'
import { EmptyState } from '@/shared/ui/EmptyState'
import { EncabezadoSeccion } from '../components/EncabezadoSeccion'
import { filtroDeBusqueda } from '../busqueda'

const ESPERA_MS = 350

export function ClientesAdminPage() {
  const [texto, setTexto] = useState('')
  const [aplicado, setAplicado] = useState('')

  useEffect(() => {
    const espera = setTimeout(() => setAplicado(texto), ESPERA_MS)
    return () => clearTimeout(espera)
  }, [texto])

  const filtro = filtroDeBusqueda(aplicado)
  const consulta = useClientes(filtro)
  const clientes = consulta.data ?? []

  return (
    <div>
      <EncabezadoSeccion
        titulo="Clientes"
        descripcion="Busca por nombre (mínimo 2 letras) o por código. Solo lectura."
        icono={Users}
      />

      <label className="relative block">
        <span className="sr-only">Buscar cliente</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nombre o código del cliente"
          className="h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-base outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
        />
      </label>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        {!filtro && (
          <EmptyState
            icon={<Users className="size-8" />}
            title="Busca un cliente"
            description="Escribe al menos 2 letras del nombre o el código."
          />
        )}
        {filtro && consulta.isFetching && clientes.length === 0 && (
          <p role="status" className="py-10 text-center text-sm text-muted">
            Buscando...
          </p>
        )}
        {filtro && consulta.isError && (
          <p role="alert" className="py-10 text-center text-sm text-muted">
            No se pudo buscar.{' '}
            <button
              type="button"
              onClick={() => void consulta.refetch()}
              className="cursor-pointer font-bold text-primary underline"
            >
              Reintentar
            </button>
          </p>
        )}
        {filtro && consulta.isSuccess && clientes.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">No hay clientes que coincidan.</p>
        )}
        {clientes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <caption className="sr-only">Clientes encontrados</caption>
              <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Código</th>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">NIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {clientes.map((c) => (
                  <tr key={c.codigo} className="transition hover:bg-primary/5">
                    <td className="px-4 py-3 tabular-nums text-muted">{c.codigo}</td>
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 tabular-nums">{c.nit || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
