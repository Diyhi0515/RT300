import { useNavigate } from 'react-router-dom'
import { useSesion } from '@/features/auth'
import { notificar } from '@/shared/avisos/almacen'
import { TarjetaModulo } from '../components/TarjetaModulo'
import { modulosDelRol } from '../modulos'

export function InicioPage() {
  const navegar = useNavigate()
  const rol = useSesion((s) => s.perfil?.rol)
  const visibles = rol ? modulosDelRol(rol) : []

  return (
    <section aria-label="Módulos" className="mx-auto max-w-3xl">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
        {visibles.map((m, i) => (
          <TarjetaModulo
            key={m.clave}
            titulo={m.etiqueta}
            descripcion={m.descripcion}
            icono={m.icono}
            tono={m.tono}
            disponible={!!m.ruta}
            indice={i}
            alAbrir={() =>
              m.ruta
                ? navegar(m.ruta)
                : notificar.informacion('Este módulo estará disponible pronto.', m.etiqueta)
            }
          />
        ))}
      </div>
    </section>
  )
}
