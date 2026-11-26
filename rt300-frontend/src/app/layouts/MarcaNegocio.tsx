export function MarcaNegocio({ nombre }: { nombre: string }) {
  const palabras = nombre.trim().split(/\s+/)
  const corte = palabras.length >= 3 ? palabras.length - 2 : palabras.length
  const principal = palabras.slice(0, corte).join(' ')
  const secundario = palabras.slice(corte).join(' ')

  return (
    <div
      title={nombre}
      className="flex min-w-0 items-center border-l border-white/20 pl-2.5 sm:pl-4"
    >
      <p className="line-clamp-2 min-w-0 text-[10px] font-extrabold uppercase leading-tight tracking-[0.12em] text-white sm:text-xs lg:text-sm">
        {principal}
        {secundario && (
          <span className="block font-semibold tracking-[0.2em] text-[#4da8ff]">{secundario}</span>
        )}
      </p>
    </div>
  )
}
