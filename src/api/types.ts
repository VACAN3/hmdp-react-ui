export interface LoginData {
  tenantId?: string
  username?: string
  password?: string
  rememberMe?: boolean
  socialCode?: string
  socialState?: string
  source?: string
  code?: string
  uuid?: string
  clientId: string
  grantType: string
}

export interface LoginResult {
  access_token: string
}

export interface VerifyCodeResult {
  captchaEnabled: boolean
  uuid?: string
  img?: string
}

export interface TenantVO {
  companyName: string
  domain: any
  tenantId: string
}

export interface TenantInfo {
  tenantEnabled: boolean
  voList: TenantVO[]
}

export interface UserSimple {
  userId: string
  userName: string
  nickName: string
  avatar?: string | null
}

export interface UserInfo {
  user: UserSimple
  roles: string[]
  permissions: string[]
}