import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    debug: import.meta.env.DEV,
    
    // 命名空间配置
    // 注意：只有 'common' 会被预加载。其他命名空间（如 downloadCenter, profile）将在组件中通过 useTranslation(['ns']) 懒加载
    ns: ['common'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React 已经处理了 XSS
    },

    // 后端加载配置
    backend: {
      // 添加版本号 ?v=... 以解决生产环境浏览器缓存问题
      loadPath: `${(import.meta.env.VITE_APP_CONTEXT_PATH || '/').replace(/\/$/, '')}/locales/{{lng}}/{{ns}}.json?v=${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    },

    // 语言检测配置
    detection: {
      // 检测顺序：查询参数 > 本地存储 > 浏览器设置
      order: ['querystring', 'localStorage', 'navigator'],
      // 查询参数键，例如 ?lang=en-US
      lookupQuerystring: 'lang',
      // 本地存储键，与项目现有保持一致
      lookupLocalStorage: 'app.language',
      // 缓存到本地存储
      caches: ['localStorage'],
    },
  })

export default i18n
