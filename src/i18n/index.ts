import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCNCommon from '../locales/zh-CN/common.json'
import enUSCommon from '../locales/en-US/common.json'
import zhCNDownloadCenter from '../locales/zh-CN/downloadCenter.json'
import enUSDownloadCenter from '../locales/en-US/downloadCenter.json'
import zhCNProfile from '../locales/zh-CN/profile.json'
import enUSProfile from '../locales/en-US/profile.json'

const resources = {
  'zh-CN': { common: zhCNCommon, downloadCenter: zhCNDownloadCenter, profile: zhCNProfile },
  'en-US': { common: enUSCommon, downloadCenter: enUSDownloadCenter, profile: enUSProfile },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: (localStorage.getItem('app.language') || 'zh-CN'),
    fallbackLng: 'zh-CN',
    ns: ['common', 'downloadCenter', 'profile'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

export default i18n
