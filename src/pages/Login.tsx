import { Navigate } from 'react-router-dom'
import { useRol } from '../hooks/useRol'
import LoginForm from '../components/auth/LoginForm'

export default function Login() {
  const { userId, loading } = useRol()

  // Si ya tiene sesión activa, redirigir al Dashboard principal
  if (!loading && userId) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/20 via-slate-950 to-slate-950 pointer-events-none" />
      <LoginForm />
    </div>
  )
}
