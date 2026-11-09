import { registerSW } from 'virtual:pwa-register'

const CLAVE_VERSION = 'rt300-version-app'
const INTERVALO_REVISION_MS = 60 * 60 * 1000

const leerVersion = () => {
  try {
    return localStorage.getItem(CLAVE_VERSION)
  } catch {
    return null
  }
}

const guardarVersion = () => {
  try {
    localStorage.setItem(CLAVE_VERSION, __APP_VERSION__)
  } catch {
    return
  }
}

const limpiarVersionAnterior = async () => {
  const registros = await navigator.serviceWorker?.getRegistrations()
  await Promise.all((registros ?? []).map((registro) => registro.unregister()))
  if ('caches' in window) {
    const claves = await caches.keys()
    await Promise.all(claves.map((clave) => caches.delete(clave)))
  }
}

export const sincronizarVersion = () => {
  const guardada = leerVersion()
  guardarVersion()

  if (guardada && guardada !== __APP_VERSION__) {
    void limpiarVersionAnterior()
      .catch(() => undefined)
      .finally(() => location.reload())
    return
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_url, registro) {
      if (registro) setInterval(() => void registro.update(), INTERVALO_REVISION_MS)
    },
  })
}
