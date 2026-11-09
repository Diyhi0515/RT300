import { useSyncExternalStore } from 'react'

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface EstadoInstalacion {
  evento: EventoInstalacion | null
  instalada: boolean
  enApp: boolean
}

export type ModoInstalacion = 'instalable' | 'instalada' | 'ios' | 'no-disponible'

const CLAVE_MARCA = 'rt300-app-instalada'

const leerMarca = () => {
  try {
    return localStorage.getItem(CLAVE_MARCA) === '1'
  } catch {
    return false
  }
}

const guardarMarca = (valor: boolean) => {
  try {
    if (valor) localStorage.setItem(CLAVE_MARCA, '1')
    else localStorage.removeItem(CLAVE_MARCA)
  } catch {
    return
  }
}

const consultaModoApp = matchMedia('(display-mode: standalone)')

const enModoApp = () =>
  consultaModoApp.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const abiertaComoApp = enModoApp()
if (abiertaComoApp) guardarMarca(true)

let estado: EstadoInstalacion = {
  evento: null,
  enApp: abiertaComoApp,
  instalada: abiertaComoApp || leerMarca(),
}

const oyentes = new Set<() => void>()

const actualizar = (parcial: Partial<EstadoInstalacion>) => {
  estado = { ...estado, ...parcial }
  oyentes.forEach((oyente) => oyente())
}

window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault()
  guardarMarca(false)
  actualizar({ evento: evento as EventoInstalacion, instalada: false })
})

window.addEventListener('appinstalled', () => {
  guardarMarca(true)
  actualizar({ evento: null, instalada: true })
})

consultaModoApp.addEventListener('change', () => {
  const enApp = enModoApp()
  if (enApp) guardarMarca(true)
  actualizar({ enApp, instalada: enApp || estado.instalada })
})

const verificarInstalacion = async () => {
  const navegador = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<{ platform: string }[]>
  }
  if (!navegador.getInstalledRelatedApps || estado.enApp) return
  try {
    const apps = await navegador.getInstalledRelatedApps()
    const instalada = apps.some((app) => app.platform === 'webapp')
    if (instalada === estado.instalada) return
    guardarMarca(instalada)
    actualizar({ instalada, evento: instalada ? null : estado.evento })
  } catch {
    return
  }
}

verificarInstalacion()
window.addEventListener('focus', verificarInstalacion)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') verificarInstalacion()
})

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

const instantanea = () => estado

const esIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const useInstalarApp = () => {
  const { evento, instalada, enApp } = useSyncExternalStore(suscribir, instantanea, instantanea)

  const instalar = async () => {
    if (!evento) return
    await evento.prompt()
    const { outcome } = await evento.userChoice
    if (outcome === 'accepted') guardarMarca(true)
    actualizar({ evento: null, instalada: outcome === 'accepted' ? true : estado.instalada })
  }

  const modo: ModoInstalacion = instalada
    ? 'instalada'
    : evento
      ? 'instalable'
      : esIos()
        ? 'ios'
        : 'no-disponible'

  return { modo, enApp, seguro: window.isSecureContext, instalar }
}
