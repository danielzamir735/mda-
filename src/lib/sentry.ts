/**
 * Error tracking (Sentry). Fully optional and lazily loaded: unless
 * VITE_SENTRY_DSN is set AND this is a real production build, the
 * `@sentry/react` package is never even fetched/parsed, so there's no
 * bundle-size or startup cost for local dev or a fork that hasn't
 * configured it.
 *
 * Create a free project at https://sentry.io, grab its DSN, and set
 * VITE_SENTRY_DSN in .env.local / your Vercel project env vars.
 */

type SentryModule = typeof import('@sentry/react')

// The single source of truth for "is Sentry actually doing anything".
// Computed synchronously so callers (e.g. the crash screen) can check it
// immediately, even before the lazy SDK import below has resolved.
let sentryEnabled = false
let sentryModule: SentryModule | null = null
const pendingErrors: Array<{ error: unknown; info?: unknown }> = []

export function isSentryEnabled() {
  return sentryEnabled
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  sentryEnabled = !!dsn && import.meta.env.PROD
  if (!sentryEnabled) return

  import('@sentry/react')
    .then((Sentry) => {
      sentryModule = Sentry
      Sentry.init({
        dsn,
        // Vite's MODE/PROD can't tell a Vercel preview deploy apart from the
        // real production one (both are plain `vite build`) — key off the
        // production hostname instead so preview-branch errors don't get
        // mixed in with real user-facing production errors.
        environment: window.location.hostname === 'hovesh-plus.vercel.app' ? 'production' : 'preview',
        integrations: [Sentry.browserTracingIntegration()],
        // Small sample of transactions to keep volume/cost low. (Sentry is
        // disabled outside prod entirely, so there's no separate dev rate.)
        tracesSampleRate: 0.1,
      })

      for (const { error, info } of pendingErrors) {
        Sentry.captureException(error, info ? { extra: info as Record<string, unknown> } : undefined)
      }
      pendingErrors.length = 0
    })
    .catch(() => {
      // Failing to load/init the Sentry SDK must never break the app.
    })
}

/**
 * Report an error to Sentry, if enabled. Safe to call before the lazy
 * import above has resolved — the error is queued and flushed once it has.
 */
export function reportError(error: unknown, info?: unknown) {
  if (!sentryEnabled) return
  if (sentryModule) {
    sentryModule.captureException(error, info ? { extra: info as Record<string, unknown> } : undefined)
  } else {
    pendingErrors.push({ error, info })
  }
}
