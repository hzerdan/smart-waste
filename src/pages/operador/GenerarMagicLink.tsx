import { useState, useEffect } from 'react'
import Layout from '../../components/ui/Layout'
import { supabase } from '../../lib/supabase'
import { useRol } from '../../hooks/useRol'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Link2, 
  Copy, 
  Check, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  ExternalLink
} from 'lucide-react'

interface RegistroOption {
  id: number
  depositante_nombre: string
  created_at: string | null
  estado: string
  clientes?: { razon_social: string } | null
}

export default function GenerarMagicLink() {
  const { isOperadorCliente, isSupervisorCliente, clienteId } = useRol()
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as { registroId?: string } | null

  const [registroId, setRegistroId] = useState(routeState?.registroId || '')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Lista de registros recientes pendientes
  const [recentRegistros, setRecentRegistros] = useState<RegistroOption[]>([])

  const [magicLinkData, setMagicLinkData] = useState<{
    token: string
    url: string
    expires_at: string
  } | null>(null)

  // Cargar registros recientes pendientes para facilitar la selección
  useEffect(() => {
    async function loadRecent() {
      try {
        let query = supabase
          .from('registros_ingreso')
          .select('id, depositante_nombre, created_at, estado, clientes(razon_social)')
          .order('id', { ascending: false })
          .limit(8)

        if ((isOperadorCliente || isSupervisorCliente) && clienteId) {
          query = query.eq('cliente_id', clienteId)
        }

        const { data, error } = await query
        if (!error && data) {
          setRecentRegistros(data as any as RegistroOption[])
        }
      } catch (e) {
        console.error('Error al cargar registros recientes:', e)
      }
    }

    loadRecent()
  }, [isOperadorCliente, isSupervisorCliente, clienteId])

  // Auto-generar link si venimos directamente desde un registro nuevo
  useEffect(() => {
    if (routeState?.registroId) {
      handleGenerate(parseInt(routeState.registroId))
    }
  }, [routeState])

  const handleGenerate = async (idToUse?: number) => {
    const id = idToUse || parseInt(registroId)
    if (!id || isNaN(id)) {
      setErrorMsg('Por favor introduce o selecciona un ID de registro válido.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setMagicLinkData(null)

    try {
      const { data, error } = await (supabase as any).rpc('generate_magic_link', {
        p_registro_id: id
      })

      if (error) throw error

      if (data) {
        const result = data as { token: string; expires_at: string; url: string }
        
        // Armar URL pública para el depositante
        let finalUrl = result.url
        if (import.meta.env.VITE_MAGIC_LINK_BASE_URL) {
          finalUrl = `${import.meta.env.VITE_MAGIC_LINK_BASE_URL}?token=${result.token}`
        } else {
          finalUrl = `${window.location.origin}/subir-fotos?token=${result.token}`
        }

        setMagicLinkData({
          token: result.token,
          expires_at: result.expires_at,
          url: finalUrl
        })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar enlace temporal.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (magicLinkData) {
      navigator.clipboard.writeText(magicLinkData.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl space-y-6 animate-fadeIn">
        <button
          onClick={() => navigate('/operador/nuevo-ingreso')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Nuevo Ingreso
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white">Generar Magic Link</h2>
            <p className="text-sm text-slate-400">Crea un enlace temporal de acceso para que el depositante suba fotos desde su celular.</p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!magicLinkData ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  ID del Registro de Ingreso
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="number"
                    value={registroId}
                    onChange={(e) => setRegistroId(e.target.value)}
                    placeholder="Ej. 12"
                    className="flex-1 py-3 px-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => handleGenerate()}
                    disabled={loading || !registroId}
                    className="py-3 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Generar Enlace'}
                  </button>
                </div>
              </div>

              {/* Selector rápido de ingresos recientes */}
              {recentRegistros.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    O selecciona un ingreso reciente:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {recentRegistros.map((reg) => (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => {
                          setRegistroId(String(reg.id))
                          handleGenerate(reg.id)
                        }}
                        className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                          registroId === String(reg.id)
                            ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Ingreso #{reg.id}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            reg.estado === 'pendiente' 
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          }`}>
                            {reg.estado}
                          </span>
                        </div>
                        <span className="truncate text-slate-400">
                          {reg.depositante_nombre} {reg.clientes?.razon_social ? `• ${reg.clientes.razon_social}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-scaleUp">
              <div className="p-5 rounded-xl bg-violet-500/5 border border-violet-500/15 flex flex-col sm:flex-row items-center gap-6">
                {/* QR Code real */}
                <div className="w-40 h-40 bg-white rounded-xl p-2.5 flex items-center justify-center shadow-xl shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(magicLinkData.url)}`}
                    alt="Código QR para escaneo"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    <Clock className="w-3 h-3" />
                    Válido por 2 horas
                  </span>
                  <h4 className="text-xl font-bold text-white">Enlace generado para el Ingreso #{registroId}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Muestra este código QR al depositante o envíale el enlace temporal para que suba fotos de inmediato desde su navegador móvil.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Vence: {new Date(magicLinkData.expires_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* URL Display */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Enlace Temporal (Depositante)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={magicLinkData.url}
                    readOnly
                    className="flex-1 py-3 px-4 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className={`py-3 px-5 rounded-xl border font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                      copied
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4 animate-scaleUp" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                  <a
                    href={magicLinkData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors"
                    title="Abrir en pestaña nueva para probar"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between">
                <button
                  onClick={() => {
                    setMagicLinkData(null)
                    setRegistroId('')
                  }}
                  className="py-2.5 px-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Generar para Otro Registro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
