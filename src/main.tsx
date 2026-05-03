import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerGA } from './utils/analytics'

// Defer GA4 init to avoid blocking the main thread during first render
setTimeout(() => {
  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  if (gaMeasurementId) {
    import('react-ga4').then(({ default: ReactGA }) => {
      ReactGA.initialize(gaMeasurementId)
      registerGA(ReactGA)
    })
  }
}, 3000)

// When a new Service Worker takes control (after skipWaiting + clientsClaim),
// reload the page so users get the latest assets.
// window.location.reload() NEVER clears localStorage or IndexedDB —
// all saved data (metrics, CPR sessions, settings) is fully preserved.
if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
