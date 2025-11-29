import axios, { AxiosInstance, AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios'
import { message } from 'antd'
import i18n from '@/i18n'
import { TOKEN_KEY, removeToken } from '@/utils/auth'
import { encrypt as rsaEncrypt, decrypt as rsaDecrypt } from '@/utils/jsencrypt'
import { generateAesKey, encryptBase64, decryptBase64, encryptWithAes, decryptWithAes } from '@/utils/crypto'
import { HttpStatus, isSuccess, needRelogin } from '@/enums/RespEnum'

const baseURL = import.meta.env.VITE_APP_BASE_API || '/api'
const encryptHeader = 'encrypt-key'

const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'clientid': import.meta.env.VITE_APP_CLIENT_ID,
  },
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    console.log("🚀 ~ token:", token)
    const isTokenDisabled = (config.headers as any)?.isToken === false
    console.log("🚀 ~ isTokenDisabled:", isTokenDisabled)
    if (!isTokenDisabled && token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    // 是否启用前端加密，仅对 POST/PUT 的 body 加密
    const method = (config.method || 'get').toLowerCase()
    const isEncryptHeader = (config.headers as any)?.isEncrypt
    const isEncrypt = isEncryptHeader === true || isEncryptHeader === 'true'
    if (isEncrypt && (method === 'post' || method === 'put')) {
      const aesKey = generateAesKey()
      const aesKeyBase64 = encryptBase64(aesKey)
      const encryptedKey = rsaEncrypt(aesKeyBase64)
      config.headers = {
        ...config.headers,
        [encryptHeader]: encryptedKey,
      }
      const payload = typeof config.data === 'object' ? JSON.stringify(config.data) : String(config.data ?? '')
      config.data = encryptWithAes(payload, aesKey)
      // 后端通常以纯文本接收加密体
      if (!config.headers['Content-Type']) {
        (config.headers as any)['Content-Type'] = 'application/json;charset=utf-8'
      }
    }
    // 仅清理 isToken，保留 isEncrypt 与 encrypt-key 由后端识别
    if ((config.headers as any)?.isToken !== undefined) delete (config.headers as any).isToken
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  async (response: AxiosResponse) => {
    // 响应解密：当后端返回加密数据且附带 encrypt-key 头时处理
    try {
      const keyStr = (response.headers as any)?.[encryptHeader]
      if (keyStr && typeof response.data === 'string') {
        // hmdp-ui 响应约定：encrypt-key 为 AES 密钥的 Base64 字符串（无需 RSA 解密）
        const aesKey = decryptBase64(String(keyStr))
        const decrypted = decryptWithAes(response.data, aesKey)
        response.data = JSON.parse(decrypted)
      }
    } catch (e) {
      // 解密失败时不影响后续错误处理，提示一次
      console.warn('[decrypt] 响应解密失败：', e)
    }

    // 文件下载与 Blob 错误处理（与 hmdp-ui 思路一致）
    const respType = response.config.responseType
    if (respType === 'blob' || respType === 'arraybuffer') {
      const contentType = String((response.headers as any)['content-type'] || '')
      // 当后端以 JSON 的 blob 返回错误信息时，解析后进行统一错误提示
      if (contentType.includes('application/json') && response.data) {
        try {
          const text = await (response.data as Blob).text()
          const json = JSON.parse(text)
          const code = json?.code ?? json?.status
          const msg = json?.msg || json?.message || i18n.t('request.fail')
          if (!isSuccess(code)) {
            if (needRelogin(code)) {
              removeToken()
              const base = (import.meta.env.VITE_APP_CONTEXT_PATH || '/').replace(/\/?$/, '/')
              setTimeout(() => {
                window.location.href = `${base}login`
              }, 1000)
            }
            return Promise.reject(new Error(msg))
          }
          // 将成功的 JSON blob 透传（少数场景）
          response.data = json
          return response
        } catch {
          // 无法解析时按普通 blob 返回
          return response
        }
      }
      return response
    }

    // 常规 JSON 响应统一处理
    const data = response.data as any
    const code = data?.code ?? data?.status ?? HttpStatus.SUCCESS
    if (!isSuccess(code)) {
      const msg = data?.msg || data?.message || i18n.t('request.fail')
      // 未授权需重定向登录
      if (needRelogin(code)) {
        message.error(i18n.t('request.sessionExpired'))
        removeToken()
        const base = (import.meta.env.VITE_APP_CONTEXT_PATH || '/').replace(/\/?$/, '/')
        setTimeout(() => {
          window.location.href = `${base}login`
        }, 1000)
        return Promise.reject(new Error('Unauthorized'))
      }
      // 其他错误统一提示
      message.error(msg)
      return Promise.reject(new Error(msg))
    }
    return response
  },
  (error: AxiosError) => {
    const status = error.response?.status
    if (status === 401) {
      message.error(i18n.t('request.sessionExpired'))
      removeToken()
      const base = (import.meta.env.VITE_APP_CONTEXT_PATH || '/').replace(/\/?$/, '/')
      setTimeout(() => {
        window.location.href = `${base}login`
      }, 1000)
    } else if (status) {
      message.error(i18n.t('request.error', { status }))
    } else {
      message.error(i18n.t('request.networkError'))
    }
    return Promise.reject(error)
  }
)

// 统一返回体：优先返回 data.data，其次返回 data
export const get = <T = any>(url: string, config?: AxiosRequestConfig) =>
  service.get<T>(url, config).then(r => ((r.data as any)?.data ?? (r.data as any)))

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  service.post<T>(url, data, config).then(r => ((r.data as any)?.data ?? (r.data as any)))

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  service.put<T>(url, data, config).then(r => ((r.data as any)?.data ?? (r.data as any)))
export default service
