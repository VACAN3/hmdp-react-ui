import { post, get } from '@/utils/request'
import type { LoginData, LoginResult, VerifyCodeResult, TenantInfo } from './types'

const clientId = (import.meta.env.VITE_APP_CLIENT_ID || 'hmdp-react-ui') as string

export function login(data: LoginData): Promise<LoginResult> {
  const params = {
    ...data,
    clientId: data.clientId || clientId,
    grantType: data.grantType || 'password',
  }
  return post<LoginResult>('/auth/login', params, { headers: { isToken: false, isEncrypt: 'true' } })
}

export function register(data: any) {
  const params = {
    ...data,
    clientId,
    grantType: 'password',
  }
  return post<any>('/auth/register', params, { headers: { isToken: false, isEncrypt: 'true' } })
}

export function logout() {
  return post<any>('/auth/logout')
}

export function getCodeImg(): Promise<VerifyCodeResult> {
  return get<VerifyCodeResult>('/auth/code', { headers: { isToken: false }, timeout: 20000 })
}

export function callback(data: LoginData) {
  const payload = {
    ...data,
    clientId,
    grantType: 'social',
  }
  return post<any>('/auth/social/callback', payload)
}

export function getTenantList(): Promise<TenantInfo> {
  return get<TenantInfo>('/auth/tenant/list', { headers: { isToken: false } })
}