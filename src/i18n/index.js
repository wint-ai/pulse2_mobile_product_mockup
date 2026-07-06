import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import he from './locales/he.json';

const LANGUAGE_STORAGE_KEY = 'pulse2-language';
const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'he', label: 'עברית', dir: 'rtl' },
];

function detectInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) return saved;
  } catch { /* localStorage unavailable */ }
  return DEFAULT_LANGUAGE;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    lng: detectInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

function applyDirection(lng) {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === lng) || SUPPORTED_LANGUAGES[0];
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
  }
}

applyDirection(i18n.language);

i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lng); } catch { /* ignore */ }
});

export default i18n;
