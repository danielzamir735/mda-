import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import ReactGA from 'react-ga4'
import './index.css'
import App from './App.tsx'

const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
if (gaMeasurementId) {
  ReactGA.initialize(gaMeasurementId)
}

posthog.init(import.meta.env.VITE_POSTHOG_KEY as string ?? 'phc_NHYgGJLq95b4ImZloo1QT9kE3AqhrLjZzkguFEol1mG', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
})

// When a new Service Worker takes control (after skipWaiting + clientsClaim),
// reload the page so users get the latest assets.
// window.location.reload() NEVER clears localStorage or IndexedDB —
// all saved data (metrics, CPR sessions, settings) is fully preserved.
if ('serviceWorker' in navigator) {
  // Only reload when an existing SW is *replaced* by a new version.
  // If there was no previous controller (first install / cleared cache),
  // the page already loaded correctly from the network — no reload needed.
  const hadController = !!navigator.serviceWorker.controller
  const bootTime = Date.now()
  let reloading = false
  const doReload = () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    // A controllerchange firing within the first seconds after launch means the
    // new SW activated mid cold-start — reloading right now (before the app has
    // even painted) is what produces the black-screen-until-manual-refresh bug
    // on installed/home-screen launches. Defer: reload silently the next time
    // the app is backgrounded instead of interrupting the launch in progress.
    if (Date.now() - bootTime > 15_000) {
      doReload()
      return
    }
    document.addEventListener('visibilitychange', function onHide() {
      if (document.visibilityState !== 'hidden') return
      document.removeEventListener('visibilitychange', onHide)
      doReload()
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
