interface BandaAxonProps {
  className?: string
  tamano?: 'sm' | 'md'
}

export function BandaAxon({ className = '', tamano = 'md' }: BandaAxonProps) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-[linear-gradient(160deg,#0a1a3d_0%,#12306e_100%)] dark:bg-[linear-gradient(160deg,#070e1d_0%,#0e2257_100%)] ${className}`}
    >
      <div
        aria-hidden
        className="rejilla-fondo pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <img
        src="/logo-software.png"
        alt="AXON Software Inteligente"
        width={180}
        height={60}
        className={`relative w-auto ${tamano === 'sm' ? 'h-8' : 'h-10 short:h-9'}`}
      />
    </div>
  )
}
