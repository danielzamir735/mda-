// react-ga4 is initialized asynchronously in main.tsx after a 3-second delay.
// We hold a reference here so feature modules never statically bundle GA code.
let _ga: typeof import('react-ga4')['default'] | null = null;

export function registerGA(instance: typeof import('react-ga4')['default']) {
  _ga = instance;
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  try {
    _ga?.event(name, params);
  } catch {
    // GA blocked or not yet initialized — fail silently
  }
}

export function trackInteraction(featureName: string, category: string) {
  trackEvent('feature_interaction', {
    feature_name: featureName,
    feature_category: category,
  });
}
