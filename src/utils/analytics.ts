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

/**
 * Centralized interaction tracker. Fires a `feature_interaction` event with
 * standardized `feature_name` and `feature_category` parameters so every
 * button/card in the app can be compared in a single GA4 report.
 *
 * @param featureName   Snake-case identifier, e.g. "burn_calculator"
 * @param category      Logical group, e.g. "calculators"
 */
export function trackInteraction(featureName: string, category: string) {
  trackEvent('feature_interaction', {
    feature_name: featureName,
    feature_category: category,
  });
}
