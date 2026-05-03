import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerGA } from './utils/analytics'

// Load GA4 only after LCP fires so it never competes with critical rendering.
// Falls back to a 5-second timer if PerformanceObserver isn't available.
function _loadGA() {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  if (!id) return
  import('react-ga4').then(({ default: ReactGA }) => {
    ReactGA.initialize(id)
    registerGA(ReactGA)
  })
}

;(function deferGA() {
  let fired = false
  const run = () => { if (!fired) { fired = true; _loadGA() } }

  if (
    typeof PerformanceObserver !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')
  ) {
    const po = new PerformanceObserver(() => { po.disconnect(); setTimeout(run, 500) })
    try { po.observe({ type: 'largest-contentful-paint', buffered: true }) } catch { /* ignore */ }
    setTimeout(run, 5000) // safety net
  } else {
    setTimeout(run, 5000)
  }
})()

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
