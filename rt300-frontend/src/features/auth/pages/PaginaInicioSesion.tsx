import { FondoInicio } from '../components/FondoInicio'
import { FormularioInicio } from '../components/FormularioInicio'
import { MarcaCabecera } from '../components/MarcaCabecera'
import { ModalBloqueo } from '../components/ModalBloqueo'
import { PieTarjeta } from '../components/PieTarjeta'
import { UsuarioPanel } from '../components/UsuarioPanel'
import { useFormularioInicio } from '../useFormularioInicio'

export function PaginaInicioSesion() {
  const formulario = useFormularioInicio()

  return (
    <div className="relative isolate grid min-h-[var(--alto-app,100dvh)] place-items-center overflow-hidden bg-club-bg dark:bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(53,99,233,0.25),transparent_70%)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[calc(env(safe-area-inset-top)+1.5rem)] md:py-6 short:pb-2 short:pt-2">
      <title>RT - Login</title>
      <FondoInicio />

      <div className="grid w-full max-w-md grid-cols-[minmax(0,1fr)] animate-[rise_0.5s_ease-out] overflow-hidden rounded-2xl bg-club-card shadow-2xl shadow-club-pc/15 ring-1 ring-club-text/5 dark:bg-[linear-gradient(160deg,#18284b_0%,#111c35_55%,#0e1830_100%)] dark:shadow-[0_0_90px_-25px_rgba(79,124,255,0.55)] dark:ring-white/12 md:max-h-[calc(var(--alto-app,100dvh)-3rem)] md:min-h-[min(40rem,calc(var(--alto-app,100dvh)-3rem))] md:max-w-4xl md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-[minmax(0,1fr)_auto] lg:max-w-6xl 2xl:max-w-[1360px] short:md:max-h-[calc(var(--alto-app,100dvh)-1rem)] short:md:min-h-0">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden p-6 sm:p-8 short:p-3">
          <MarcaCabecera />

          <div className="-mx-6 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 short:-mx-3 short:px-3 [&::-webkit-scrollbar]:hidden">
            <div className="flex min-h-full flex-col justify-center">
              <div className="mb-6 short:mb-1.5">
                <h1 className="text-[clamp(1.5rem,1.25rem+0.9vw,2.25rem)] font-bold leading-tight text-club-text short:text-lg">
                  Ingreso
                </h1>
                <p className="mt-1 text-[15px] text-club-variant short:hidden">
                  Sistema de Usuarios - Pedidos & Mesas
                </p>
              </div>

              <FormularioInicio formulario={formulario} />
            </div>
          </div>
        </section>

        <UsuarioPanel seleccionado={formulario.usuarioActual} onSelect={formulario.seleccionar} />

        <PieTarjeta />
      </div>

      <ModalBloqueo
        open={formulario.modalAbierto}
        usuario={formulario.usuarioActual}
        restante={formulario.restante}
        total={formulario.total}
        onClose={formulario.cerrarModal}
      />
    </div>
  )
}
