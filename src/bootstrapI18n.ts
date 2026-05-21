import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/locales/en/translation.json';
import es from './i18n/locales/es/translation.json';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'futpong-admin-lang';

function readStoredLanguage(): SupportedLanguage | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function persistLanguage(lng: SupportedLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
}

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: readStoredLanguage() ?? 'es',
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = readStoredLanguage() ?? 'es';

export default i18next;
