import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { Lang } from './types';

import common from './common';
import settings from './settings';
import home from './home';
import cpr from './cpr';
import hub from './hub';
import calculators from './calculators';
import references from './references';
import learning from './learning';
import special from './special';
import onboarding from './onboarding';

/*
 * One file per app area, so the per-area sessions never edit the same file.
 * Keys are flat and must be unique across all files – `npm run check:i18n-theme`
 * reports duplicates, and so does the dev-mode check below.
 */
const parts = { common, settings, home, cpr, hub, calculators, references, learning, special, onboarding };

const he = {
  ...common.he, ...settings.he, ...home.he, ...cpr.he, ...hub.he,
  ...calculators.he, ...references.he, ...learning.he, ...special.he, ...onboarding.he,
};
const en = {
  ...common.en, ...settings.en, ...home.en, ...cpr.en, ...hub.en,
  ...calculators.en, ...references.en, ...learning.en, ...special.en, ...onboarding.en,
};

export type TranslationKey = keyof typeof he;
export type TranslationVars = Record<string, string | number>;
export type { Lang };

const dicts: Record<Lang, Record<string, string>> = { he, en };

if (import.meta.env.DEV) {
  const seen = new Map<string, string>();
  for (const [area, d] of Object.entries(parts)) {
    for (const key of Object.keys(d.he)) {
      const prev = seen.get(key);
      if (prev) console.error(`[i18n] duplicate key "${key}" in ${prev}.ts and ${area}.ts`);
      seen.set(key, area);
    }
  }
}

function format(text: string, vars?: TranslationVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** For code outside React components (stores, alerts, TTS). Reads the current language. */
export function translate(key: TranslationKey, vars?: TranslationVars, lang?: Lang): string {
  const l = lang ?? useSettingsStore.getState().language;
  return format(dicts[l][key] ?? dicts.he[key] ?? key, vars);
}

/** `const t = useTranslation(); t('save'); t('appVersion', { version: '2.1' })` */
export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  return useCallback(
    (key: TranslationKey, vars?: TranslationVars) => translate(key, vars, language),
    [language],
  );
}

/** Current language plus helpers, for content that is chosen rather than looked up. */
export function useLanguage() {
  const lang = useSettingsStore((s) => s.language);
  return { lang, isEn: lang === 'en', dir: lang === 'en' ? ('ltr' as const) : ('rtl' as const) };
}
