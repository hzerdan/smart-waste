import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Camera, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw, Trash2, ArrowUpCircle } from 'lucide-react'

export default function SubirFotos() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  // Estados de carga e info de validación
  const [validating, setValidating] = useState(true)
  const [valido, setValido] = useState(false)
  const [registroId, setRegistroId] = useState<number | null>(null)
  const [validationMsg, setValidationMsg] = useState('Verificando código de acceso...')

  // Estados de subida y archivos
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validar token al cargar la página
  useEffect(() => {
    if (!token) {
      setValido(false)
      setValidating(false)
      setValidationMsg('Falta el token de acceso en la dirección URL.')
      return
    }

    async function validateToken() {
      try {
        setValidating(true)
        const { data, error } = await (supabase as any).rpc('validate_magic_link', {
          p_token: token || ''
        }).single()

        if (error) throw error

        if (data) {
          const result = data as { valido: boolean; registro_id: number | null; mensaje: string }
          setValido(result.valido)
          setRegistroId(result.registro_id)
          setValidationMsg(result.mensaje)
        }
      } catch (err: any) {
        setValido(false)
        setValidationMsg('Error al validar el enlace: ' + (err.message || 'Error del servidor.'))
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  // Limpiar urls de previsualización al desmontar
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [previews])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      
      // Validar cantidad máxima
      if (files.length + selected.length > 5) {
        setErrorMsg('Límite superado. Solo puedes subir hasta 5 fotos en total.')
        e.target.value = ''
        return
      }

      // Validar tipo y peso de cada archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      for (const file of selected) {
        if (!allowedTypes.includes(file.type)) {
          setErrorMsg(`Tipo de archivo no soportado: ${file.name}. Solo se aceptan JPEG, PNG y WEBP.`)
          e.target.value = ''
          return
        }
        if (file.size / (1024 * 1024) > 10) {
          setErrorMsg(`El archivo ${file.name} es demasiado grande. Máximo 10MB por foto.`)
          e.target.value = ''
          return
        }
      }

      const newPreviews = selected.map(file => URL.createObjectURL(file))
      setFiles(prev => [...prev, ...selected])
      setPreviews(prev => [...prev, ...newPreviews])
      e.target.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMsg('Por favor selecciona al menos una foto de respaldo.')
      return
    }

    setUploading(true)
    setErrorMsg(null)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/upload-via-magic-link`

      const formData = new FormData()
      formData.append('token', token || '')
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Ocurrió un error al subir las fotos.')
      }

      setSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de red al intentar conectarse al servidor de subidas.')
    } finally {
      setUploading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-slate-300">
          <RefreshCw className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-sm font-medium">Validando token de acceso temporal...</p>
        </div>
      </div>
    )
  }

  if (!valido) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center border border-slate-800">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Expirado o Inválido</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {validationMsg}
          </p>
          <p className="text-xs text-slate-600">
            Si el problema persiste, solicita un nuevo enlace temporal al operador del puesto de control.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 md:p-8">
      {/* Background decorations */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/10 via-slate-950 to-slate-950 pointer-events-none -z-10" />

      {/* Main Card */}
      <div className="max-w-xl w-full mx-auto my-auto glass-panel rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        
        {success ? (
          <div className="p-8 text-center animate-scaleUp">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Fotos Subidas Exitosamente</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
              La evidencia fotográfica fue asociada correctamente al Registro de Ingreso de Residuos <strong className="text-slate-200">#{registroId}</strong>.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-500">
              Este enlace de subida ha sido desactivado automáticamente por motivos de seguridad. Ya puedes cerrar esta pestaña.
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-1">
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Puesto de Ingreso
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">Subir Fotos de Respaldo</h2>
              <p className="text-slate-400 text-xs md:text-sm">
                Asocia fotos de los residuos para el ingreso de material <strong className="text-slate-200">#{registroId}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Photo Selection Area */}
            <div className="space-y-4">
              {/* Input exclusivo para abrir la cámara de fotos directamente en smartphones */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="camera-capture-input"
                disabled={uploading || files.length >= 5}
              />

              {/* Input para elegir de la galería o archivos */}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="gallery-picker-input"
                disabled={uploading || files.length >= 5}
              />
              
              {files.length < 5 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    htmlFor="camera-capture-input"
                    className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-violet-500/40 hover:border-violet-400 bg-violet-500/5 hover:bg-violet-500/10 rounded-2xl cursor-pointer transition-all text-violet-300 hover:text-white text-center shadow-inner"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm">Tomar Foto con Cámara</span>
                    <span className="text-[11px] text-slate-400">Abre la cámara del celular al instante</span>
                  </label>

                  <label
                    htmlFor="gallery-picker-input"
                    className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-2xl cursor-pointer transition-all text-slate-400 hover:text-white text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm">Elegir de Galería</span>
                    <span className="text-[11px] text-slate-500">Selecciona imágenes ya guardadas</span>
                  </label>
                </div>
              )}

              {/* Previews List */}
              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {previews.map((url, idx) => (
                    <div key={url} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-800">
                      <img src={url} alt="Vista previa" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={uploading}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500/90 text-white rounded-lg hover:bg-rose-600 transition-colors cursor-pointer opacity-90 md:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Subiendo Fotos ({files.length})...</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5" />
                  <span>Enviar Evidencia Fotográfica</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[10px] text-slate-600 mt-6 uppercase tracking-widest font-semibold">
        Smart Waste Colectora • Seguridad de Datos
      </div>
    </div>
  )
}
