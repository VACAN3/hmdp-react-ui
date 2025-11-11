import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '@/utils/auth'
import { usePermission } from '@/hooks/usePermission'

type Props = {
  children: React.ReactNode
  roles?: string[]
  permissions?: string[]
}

export default function RequireAuth({ children, roles, permissions }: Props) {
  const token = getToken()
  const location = useLocation()
  const { hasAnyRole, hasAnyPermission } = usePermission()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/403" replace />
  }

  if (permissions && permissions.length > 0 && !hasAnyPermission(permissions)) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}