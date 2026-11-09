import { useState } from 'react'
import { Download } from 'lucide-react'
import { useInstalarApp } from '@/shared/hooks/useInstalarApp'
import { ModalInstalacion } from '@/shared/ui/ModalInstalacion'

const ANIO = new Date().getFullYear()

export function PieTarjeta() {
  const [abierto, setAbierto] = useState(false)
  const { modo } = useInstalarApp()

  return (
    <footer className="col-span-full flex flex-wrap items-center justify-center gap-x-2 gap-y-2 whitespace-nowrap border-t border-club-text/10 px-6 py-3 text-xs font-semibold tracking-wide text-club-variant short:hidden">
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="Instalar la aplicación"
        aria-label="AXON: instalar la aplicación"
        className="inline-flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-club-high active:scale-95"
      >
        <img
          src="/logo-icono.webp"
          alt=""
          width={24}
          height={24}
          className="size-6 rounded-full bg-white object-contain p-0.5 ring-1 ring-club-text/10"
        />
        AXON
        {modo === 'instalable' && <Download className="size-3.5 text-club-primary" aria-hidden />}
      </button>
      <span aria-hidden>·</span>
      <span>© {ANIO}</span>
      <ModalInstalacion open={abierto} onClose={() => setAbierto(false)} />
    </footer>
  )
}
