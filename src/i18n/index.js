import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import fr from './locales/fr.json'

const messages = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  fr
}

// Get saved language from localStorage or default to 'en'
const savedLang = localStorage.getItem('erp-language') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'en',
  messages
})

export default i18n
