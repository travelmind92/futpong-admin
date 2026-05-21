import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  persistLanguage,
  type SupportedLanguage,
} from '../bootstrapI18n';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const current = (i18n.language.startsWith('en') ? 'en' : 'es') as SupportedLanguage;

  const setLanguage = (lng: SupportedLanguage) => {
    if (lng === current) {
      return;
    }
    persistLanguage(lng);
    void i18n.changeLanguage(lng).then(() => {
      document.documentElement.lang = lng;
    });
  };

  return (
    <div className="language-switcher" role="group" aria-label={t('common.language')}>
      <button
        type="button"
        className={`language-switcher__btn${current === 'es' ? ' is-active' : ''}`}
        aria-pressed={current === 'es'}
        onClick={() => setLanguage('es')}
      >
        {t('common.languageEs')}
      </button>
      <button
        type="button"
        className={`language-switcher__btn${current === 'en' ? ' is-active' : ''}`}
        aria-pressed={current === 'en'}
        onClick={() => setLanguage('en')}
      >
        {t('common.languageEn')}
      </button>
    </div>
  );
}
