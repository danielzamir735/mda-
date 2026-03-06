import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import posthog from 'posthog-js'
import './index.css'
import App from './App.tsx'

posthog.init('phc_NHYgGJLq95b4ImZloo1QT9kE3AqhrLjZzkguFEol1mG', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
})

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
