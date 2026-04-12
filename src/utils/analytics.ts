import ReactGA from 'react-ga4';

/**
 * Safe GA4 event wrapper. Silently no-ops if the GA script is blocked
 * (ad-blocker) or if ReactGA was never initialized.
 */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  try {
    ReactGA.event(name, params);
  } catch {
    // GA blocked by ad-blocker or not yet initialized — fail silently
  }
}
