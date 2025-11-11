export const TOKEN_KEY = 'User-Token'
const ROLES_KEY = 'User-Roles'
const PERMS_KEY = 'User-Permissions'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  // 与 hmdp-ui 保持一致，清理旧 token
  localStorage.removeItem('oldAdminToken')
}

export function setAuthInfo(roles?: string[], permissions?: string[]) {
  if (roles) localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
  else localStorage.removeItem(ROLES_KEY)
  if (permissions) localStorage.setItem(PERMS_KEY, JSON.stringify(permissions))
  else localStorage.removeItem(PERMS_KEY)
}

export function getRoles(): string[] {
  const raw = localStorage.getItem(ROLES_KEY)
  try {
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function getPermissions(): string[] {
  const raw = localStorage.getItem(PERMS_KEY)
  try {
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}