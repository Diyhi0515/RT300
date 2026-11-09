export type AppMode = 'mockup' | 'production'

export const APP_MODE: AppMode = 'mockup'

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1',
}
