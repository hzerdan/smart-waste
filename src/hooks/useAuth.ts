import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { parseJwt } from '../lib/auth'
import { isValidRole, type UserSessionState } from '../types/roles'

export function useAuth() {
  const [state, setState] = useState<UserSessionState>({
    userId: null,
    email: null,
    role: null,
    clienteId: null,
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session) {
        const payload = parseJwt(session.access_token)
        const userRole = payload?.user_role && isValidRole(payload.user_role) ? payload.user_role : null
        setState({
          userId: session.user.id,
          email: session.user.email ?? null,
          role: userRole,
          clienteId: payload?.cliente_id ?? null,
          loading: false,
        })
      } else {
        setState({
          userId: null,
          email: null,
          role: null,
          clienteId: null,
          loading: false,
        })
      }
    })

    // Escuchar cambios en la sesión de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session) {
        const payload = parseJwt(session.access_token)
        const userRole = payload?.user_role && isValidRole(payload.user_role) ? payload.user_role : null
        setState({
          userId: session.user.id,
          email: session.user.email ?? null,
          role: userRole,
          clienteId: payload?.cliente_id ?? null,
          loading: false,
        })
      } else {
        setState({
          userId: null,
          email: null,
          role: null,
          clienteId: null,
          loading: false,
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
