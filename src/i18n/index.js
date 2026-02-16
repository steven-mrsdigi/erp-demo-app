import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import zhCN from './locales/zh-CN.js'
import zhTW from './locales/zh-TW.js'
import fr from './locales/fr.js'

const messages = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  fr,
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('erp-language') || 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n
