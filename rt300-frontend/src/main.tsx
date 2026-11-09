import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './styles/index.css'
import '@/shared/hooks/useTema'
import '@/shared/hooks/useInstalarApp'
import { sincronizarVersion } from '@/lib/versionApp'
import { App } from './app/App'

sincronizarVersion()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
