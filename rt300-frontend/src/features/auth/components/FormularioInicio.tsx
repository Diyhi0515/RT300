import type { EstadoFormularioInicio } from '../useFormularioInicio'
import { BotonIngreso } from './BotonIngreso'
import { CampoClave } from './CampoClave'
import { CampoUsuario } from './CampoUsuario'
import { UsuarioCarrusel } from './UsuarioCarrusel'

interface FormularioInicioProps {
  formulario: EstadoFormularioInicio
}

export function FormularioInicio({ formulario }: FormularioInicioProps) {
  const f = formulario

  return (
    <form noValidate autoComplete="off" onSubmit={f.alEnviar}>
      <fieldset className="m-0 min-w-0 space-y-4 border-0 p-0 transition-opacity disabled:opacity-50 short:space-y-2">
        <UsuarioCarrusel seleccionado={f.usuarioActual} onSelect={f.seleccionar} />

        <CampoUsuario
          registro={f.register('usuario')}
          valor={f.usuario}
          error={f.errors.usuario?.message}
          onLimpiar={f.limpiar}
        />

        <CampoClave
          registro={f.register('clave')}
          error={f.errors.clave?.message}
          deshabilitado={f.bloqueado}
        />
      </fieldset>

      <BotonIngreso
        cargando={f.cargando}
        enLinea={f.enLinea}
        bloqueado={f.bloqueado}
        restante={f.restante}
        onBloqueado={f.abrirModal}
      />
    </form>
  )
}
