import { useNavigate } from 'react-router-dom'
import { notificar } from '@/shared/avisos/almacen'
import { TarjetaModulo } from '../components/TarjetaModulo'
import { modulos } from '../modulos'

export function InicioPage() {
  const navegar = useNavigate()

  return (
    <section aria-label="Módulos" className="mx-auto max-w-3xl">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
        {modulos.map((m, i) => (
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
