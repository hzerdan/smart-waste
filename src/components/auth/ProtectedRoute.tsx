import React from 'react'
import { Navigate } from 'react-router-dom'
import { useRol } from '../../hooks/useRol'
import type { UserRole } from '../../types/roles'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { role, loading, userId } = useRol()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-violet-500/25 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Cargando privilegios...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
