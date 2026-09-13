import * as Sentry from '@sentry/react'

/**
 * Error tracking (Sentry). Fully optional: if VITE_SENTRY_DSN isn't set
 * (e.g. local dev), this is a no-op and nothing is sent anywhere.
 *
 * Create a free project at https://sentry.io, grab its DSN, and set
 * VITE_SENTRY_DSN in .env.local / your Vercel project env vars.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    // Trace a small sample of transactions in prod to keep volume/cost low.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Don't leak build-time noise from local dev into Sentry.
    enabled: import.meta.env.PROD,
  })
}

export const SentryErrorBoundary = Sentry.ErrorBoundary
