import { useSyncExternalStore } from 'react'

const suscribir = (callback: () => void) => {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export const useOnlineStatus = () =>
  useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    () => true,
  )
