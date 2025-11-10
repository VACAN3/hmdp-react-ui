import axios, { AxiosInstance, AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios'
import { message } from 'antd'

const baseURL = import.meta.env.VITE_APP_BASE_API || '/api'

const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data as any
    const code = data?.code ?? data?.status ?? 200
    if (code !== 200 && code !== 0) {
      const msg = data?.msg || data?.message || '请求失败'
      message.error(msg)
      return Promise.reject(new Error(msg))
    }
    return response
  },
  (error: AxiosError) => {
    const status = error.response?.status
    if (status === 401) {
      message.error('登录已过期，请重新登录')
      // TODO: 跳转到登录页或清理会话
    } else if (status) {
      message.error(`请求错误(${status})`)
    } else {
      message.error('网络异常，请检查连接')
    }
    return Promise.reject(error)
  }
)

export const get = <T = any>(url: string, config?: AxiosRequestConfig) => service.get<T>(url, config).then(r => r.data as any)
export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => service.post<T>(url, data, config).then(r => r.data as any)

export default service
