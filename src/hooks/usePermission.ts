import { getRoles, getPermissions } from '@/utils/auth'

export function usePermission() {
  const roles = getRoles()
  const permissions = getPermissions()

  const hasRole = (role: string) => roles.includes('*:*:*') || roles.includes(role)
  const hasAnyRole = (roleList: string[] = []) => roleList.some(hasRole)

  const hasPermission = (perm: string) => permissions.includes('*:*:*') || permissions.includes(perm)
  const hasAnyPermission = (permList: string[] = []) => permList.some(hasPermission)

  return {
    roles,
    permissions,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
  }
}