import { useAuth } from './useAuth'

export function useRol() {
  const { role, clienteId, loading, userId, email } = useAuth()

  const isAdmin = role === 'administrador'
  const isSupervisorGlobal = role === 'supervisor_global'
  const isSupervisorCliente = role === 'supervisor_cliente'
  const isOperadorGlobal = role === 'operador_global'
  const isOperadorCliente = role === 'operador'
  const isOperador = isOperadorGlobal || isOperadorCliente

  const canRegisterIngreso = isAdmin || isSupervisorGlobal || isSupervisorCliente || isOperador
  const canManageAreas = isAdmin || isSupervisorCliente

  return {
    role,
    clienteId,
    userId,
    email,
    loading,
    isAdmin,
    isSupervisorGlobal,
    isSupervisorCliente,
    isOperadorGlobal,
    isOperadorCliente,
    isOperador,
    canRegisterIngreso,
    canManageAreas,
  }
}
