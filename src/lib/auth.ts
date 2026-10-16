export interface CustomJWTPayload {
  sub?: string
  email?: string
  role?: string
  user_role?: 'administrador' | 'supervisor_global' | 'supervisor_cliente' | 'operador' | null
  cliente_id?: number | null
  exp?: number
}

/**
 * Decodifica de forma segura la sección del payload de un token JWT
 */
export function parseJwt(token: string): CustomJWTPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error al decodificar JWT claims:', error)
    return null
  }
}
