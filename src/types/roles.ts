export type UserRole =
  | 'administrador'
  | 'supervisor_global'
  | 'supervisor_cliente'
  | 'operador'
  | 'operador_global'

export interface UserSessionState {
  userId: string | null
  email: string | null
  role: UserRole | null
  clienteId: number | null
  loading: boolean
}

export function isValidRole(role: string | null | undefined): role is UserRole {
  return (
    role === 'administrador' ||
    role === 'supervisor_global' ||
    role === 'supervisor_cliente' ||
    role === 'operador' ||
    role === 'operador_global'
  )
}
