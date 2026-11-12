import {
  CircleCheck,
  Download,
  EllipsisVertical,
  ExternalLink,
  Info,
  Share,
  Smartphone,
  SquarePlus,
} from 'lucide-react'
import { useInstalarApp } from '@/shared/hooks/useInstalarApp'
import { Modal } from './Modal'

interface ModalInstalacionProps {
  open: boolean
  onClose: () => void
}

const pasosIos = [
  { icono: Share, texto: 'Toca el botón Compartir de la barra de Safari.' },
  { icono: SquarePlus, texto: 'Elige "Añadir a pantalla de inicio".' },
  { icono: Download, texto: 'Toca "Añadir" para terminar.' },
]

const formasDeAbrir = [
  {
    icono: Smartphone,
    texto: 'Toca su ícono en la pantalla de inicio o en tu lista de aplicaciones.',
  },
  {
    icono: ExternalLink,
    texto:
      'Si abres el enlace desde otra aplicación (WhatsApp, notas), el teléfono suele abrirla directamente.',
  },
  {
    icono: EllipsisVertical,
    texto: 'En el menú del navegador puede aparecer la opción «Abrir en la app».',
  },
]

const botonPrimario =
  'flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-club-pc text-base font-bold text-white shadow-lg shadow-club-pc/30 transition hover:brightness-110 active:scale-[0.98]'

const botonSecundario =
  'flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-club-text/15 text-base font-semibold text-club-text transition hover:bg-club-high active:scale-[0.98]'

export function ModalInstalacion({ open, onClose }: ModalInstalacionProps) {
  const { modo, enApp, seguro, instalar } = useInstalarApp()

  const confirmar = async () => {
    onClose()
    await instalar()
  }

  const Icono = modo === 'instalada' ? CircleCheck : modo === 'instalable' ? Download : Info

  const dosColumnas = modo === 'instalada' && !enApp

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Instalar la aplicación"
      tone="club"
      className={dosColumnas ? 'short:max-w-2xl' : ''}
    >
      <div
        className={`flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center short:gap-2.5 short:px-5 short:pb-4 short:pt-4 ${
          dosColumnas
            ? 'short:grid short:grid-cols-2 short:justify-items-start short:gap-x-6 short:text-left'
            : ''
        }`}
      >
        {modo !== 'ios' && (
          <div className="grid size-16 place-items-center rounded-2xl bg-club-container text-club-primary short:size-11">
            <Icono className="size-9 short:size-6" strokeWidth={1.75} aria-hidden />
          </div>
        )}

        {modo === 'instalable' && (
          <>
            <div className="space-y-1.5">
              <p className="text-xl font-bold tracking-tight text-club-text">
                ¿Instalar RT - AXON?
              </p>
              <p className="max-w-xs text-pretty text-club-variant">
                Se agregará a tu pantalla de inicio y se abrirá como una aplicación, más rápido y
                sin la barra del navegador.
              </p>
            </div>
            <div className="grid w-full gap-2">
              <button type="button" onClick={confirmar} className={botonPrimario}>
                Instalar
              </button>
              <button type="button" onClick={onClose} className={botonSecundario}>
                Ahora no
              </button>
            </div>
          </>
        )}

        {modo === 'instalada' && (
          <>
            <div className="space-y-1.5">
              <p className="text-xl font-bold tracking-tight text-club-text">
                Ya tienes la app instalada
              </p>
              <p className="max-w-xs text-pretty text-club-variant">
                {enApp
                  ? 'Estás usando RT - AXON como aplicación instalada.'
                  : 'RT - AXON ya está instalada en este dispositivo.'}
              </p>
            </div>
            {!enApp && (
              <div className="w-full space-y-3 rounded-xl bg-club-container p-4 text-left short:col-start-2 short:row-span-4 short:row-start-1 short:space-y-2 short:p-3">
                <p className="text-sm font-bold text-club-text">Cómo abrirla</p>
                <ul className="space-y-2.5 short:space-y-1.5">
                  {formasDeAbrir.map(({ icono: FormaIcono, texto }) => (
                    <li
                      key={texto}
                      className="flex items-start gap-3 text-[13px] text-club-variant"
                    >
                      <FormaIcono
                        className="mt-0.5 size-4 shrink-0 text-club-primary"
                        aria-hidden
                      />
                      <span>{texto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" onClick={onClose} className={botonPrimario}>
              Entendido
            </button>
          </>
        )}

        {modo === 'ios' && (
          <>
            <p className="text-xl font-bold tracking-tight text-club-text">Instalar RT - AXON</p>
            <ol className="w-full space-y-3 text-left">
              {pasosIos.map(({ icono: PasoIcono, texto }, i) => (
                <li key={texto} className="flex items-center gap-3 text-club-text">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-club-container text-club-primary">
                    <PasoIcono className="size-5" aria-hidden />
                  </span>
                  <span className="text-[15px]">
                    <strong className="mr-1">{i + 1}.</strong>
                    {texto}
                  </span>
                </li>
              ))}
            </ol>
            <button type="button" onClick={onClose} className={botonPrimario}>
              Entendido
            </button>
          </>
        )}

        {modo === 'no-disponible' && (
          <>
            <div className="space-y-1.5">
              <p className="text-xl font-bold tracking-tight text-club-text">
                Instalación no disponible
              </p>
              <p className="max-w-xs text-pretty text-club-variant">
                {seguro
                  ? 'Si ya la instalaste, ábrela desde tu pantalla de inicio. Si no, abre el menú del navegador y elige «Instalar aplicación».'
                  : 'Para instalar la aplicación se necesita una conexión segura (HTTPS).'}
              </p>
            </div>
            <button type="button" onClick={onClose} className={botonPrimario}>
              Entendido
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
