import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCNCommon from '../locales/zh-CN/common.json'
import enUSCommon from '../locales/en-US/common.json'

const resources = {
  'zh-CN': { common: zhCNCommon },
  'en-US': { common: enUSCommon },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: (localStorage.getItem('app.language') || 'zh-CN'),
    fallbackLng: 'zh-CN',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

export default i18n

