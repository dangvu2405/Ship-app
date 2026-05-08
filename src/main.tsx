import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/main.scss'
import App from './App.tsx'
import { cleanupLegacyStorageKeys } from '@/lib/storage-migration'

cleanupLegacyStorageKeys()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
