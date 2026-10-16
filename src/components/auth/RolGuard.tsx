import React from 'react'
import { useRol } from '../../hooks/useRol'
import type { UserRole } from '../../types/roles'

interface RolGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

export default function RolGuard({ children, allowedRoles, fallback = null }: RolGuardProps) {
  const { role, loading } = useRol()

  if (loading || !role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
