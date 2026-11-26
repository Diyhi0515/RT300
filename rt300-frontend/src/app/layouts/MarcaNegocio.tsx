/**
 * Insignia con el nombre del negocio para la barra superior (siempre oscura).
 * Borde de color en movimiento y un destello cada pocos segundos; las animaciones
 * se detienen con "reducir movimiento" (regla global de index.css).
 */
export function MarcaNegocio({ nombre }: { nombre: string }) {
  return (
    <div
      title={nombre}
      className="min-w-0 animate-[marca-borde_6s_linear_infinite] rounded-2xl bg-[linear-gradient(110deg,#1b8ef2,#5ef2e0,#9b7bff,#1b8ef2)] bg-[length:300%_100%] p-[1.5px] shadow-[0_0_22px_rgba(27,142,242,0.45)]"
    >
      <div className="relative min-w-0 overflow-hidden rounded-[calc(1rem-1.5px)] bg-[#071634] px-2 py-1.5 sm:px-4 sm:py-2 short:py-1">
        <p className="line-clamp-2 min-w-0 bg-gradient-to-r from-white via-[#a9dcff] to-[#5ef2e0] bg-clip-text text-[10px] font-black uppercase leading-tight text-transparent sm:text-sm sm:tracking-[0.08em] lg:text-base short:lg:text-sm">
          {nombre}
        </p>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-[-40%] w-1/3 animate-[marca-destello_5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
      </div>
    </div>
  )
}
