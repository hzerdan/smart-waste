import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { Shield, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

export default function EstablecerPassword() {
  const navigate = useNavigate()
  const toast = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifyingSession, setVerifyingSession] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si hay sesión activa procedente de la invitación
    const checkSession = async () => {
      // Si la URL contiene un hash o un código, Supabase procesa la sesión
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setUserEmail(session.user.email ?? null)
        setVerifyingSession(false)
      } else {
        // Escuchar por si el evento onAuthStateChange termina de procesar el token del hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            setUserEmail(newSession.user.email ?? null)
            setVerifyingSession(false)
          }
        })

        // Timeout preventivo de 3 segundos
        const timer = setTimeout(() => {
          setVerifyingSession(false)
        }, 3000)

        return () => {
          subscription.unsubscribe()
          clearTimeout(timer)
        }
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        toast.success('¡Contraseña configurada exitosamente! Bienvenido a Smart Waste.')
        navigate('/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar la contraseña.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  if (verifyingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-sm font-medium">Validando invitación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-all duration-700 pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl group-hover:bg-fuchsia-600/20 transition-all duration-700 pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 text-center">
            Activar Cuenta
          </h2>
          <p className="text-sm text-slate-400 mt-2 text-center">
            {userEmail ? (
              <>
                Bienvenido, <span className="text-slate-200 font-medium">{userEmail}</span>.
                <br />
                Configura tu contraseña para completar el registro.
              </>
            ) : (
              'Ingresa tu nueva contraseña para acceder al sistema.'
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Nueva Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Key className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-300"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Key className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-300"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Guardar Contraseña y Acceder
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
