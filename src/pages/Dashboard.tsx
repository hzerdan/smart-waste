import { Navigate } from 'react-router-dom'
import { useRol } from '../hooks/useRol'
import { useProfile } from '../hooks/useProfile'
import { LogOut, UserX } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { userId, role, loading: loadingRol } = useRol()
  const { profile, loading: loadingProfile } = useProfile(userId)

  if (loadingRol || loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-violet-500/25 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return <Navigate to="/login" replace />
  }

  // Si el perfil no está activo o no tiene rol asignado en JWT
  if (!profile || !profile.activo || !role) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl" />
          
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
            <UserX className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Cuenta inactiva</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Tu registro se completó correctamente. Tu cuenta se encuentra inactiva hasta que un Administrador asigne tu rol y habilite el acceso.
          </p>

          <div className="space-y-4">
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-500 text-left space-y-1">
              <div><strong>ID:</strong> {userId}</div>
              <div><strong>Email:</strong> {profile?.email || 'N/D'}</div>
            </div>
            
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Redirección automática según el rol asignado
  switch (role) {
    case 'administrador':
      return <Navigate to="/admin/usuarios" replace />
    case 'supervisor_global':
      return <Navigate to="/supervisor-global" replace />
    case 'supervisor_cliente':
      return <Navigate to="/supervisor-cliente" replace />
    case 'operador':
      return <Navigate to="/operador/nuevo-ingreso" replace />
    default:
      return <Navigate to="/login" replace />
  }
}
