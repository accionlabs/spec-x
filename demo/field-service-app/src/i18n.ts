import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './i18n/en.json'
import es from './i18n/es.json'
import pt from './i18n/pt.json'

const savedLanguage = localStorage.getItem('language') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
