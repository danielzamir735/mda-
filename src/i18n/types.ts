export type Lang = 'he' | 'en';

/**
 * Declares one area's dictionary. The Hebrew block defines the keys; the
 * English block must have exactly the same keys (a missing or extra key is a
 * TypeScript error).
 *
 * Values may contain `{name}` placeholders, filled by `t('key', { name })`.
 */
export function defineDict<const H extends Record<string, string>>(dict: {
  he: H;
  en: { [K in keyof H]: string };
}) {
  return dict;
}
