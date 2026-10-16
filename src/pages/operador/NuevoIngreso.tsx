import React, { useState, useEffect } from 'react'
import Layout from '../../components/ui/Layout'
import { supabase } from '../../lib/supabase'
import { useRol } from '../../hooks/useRol'
import type { Database } from '../../types/database.types'
import { 
  PlusCircle, 
  Building2, 
  MapPin, 
  Trash2, 
  User, 
  FileText, 
  Camera, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Lock,
  X,
  Info,
  Scale,
  DollarSign
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Cliente {
  id: number
  razon_social: string
}

interface Area {
  id: number
  nombre: string
}

interface TipoResiduo {
  id: number
  nombre: string
  requiere_foto: boolean | null
}

export default function NuevoIngreso() {
  const { userId, clienteId, isOperadorCliente, isSupervisorCliente } = useRol()
  const navigate = useNavigate()

  // Determinar si el usuario tiene empresa fijada
  const isClientScoped = isOperadorCliente || isSupervisorCliente

  // Catálogos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [assignedClientName, setAssignedClientName] = useState<string>('')
  const [areas, setAreas] = useState<Area[]>([])
  const [tiposResiduo, setTiposResiduo] = useState<TipoResiduo[]>([])

  // Estado del formulario
  const [selectedCliente, setSelectedCliente] = useState<string>('')
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedTipoResiduo, setSelectedTipoResiduo] = useState<string>('')
  const [depositanteNombre, setDepositanteNombre] = useState('')
  const [depositanteReferencia, setDepositanteReferencia] = useState('')
  const [peso, setPeso] = useState('')
  const [importe, setImporte] = useState('')
  const [observaciones, setObservaciones] = useState('')
  
  // Fotos con previsualización
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  // Carga y feedback
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ id: string } | null>(null)

  // Cargar Catálogos iniciales
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingCatalogos(true)
        setErrorMsg(null)

        // Cargar tipos de residuo activos
        const { data: tiposData, error: tiposErr } = await supabase
          .from('tipos_residuo')
          .select('id, nombre, requiere_foto')
          .eq('activo', true)
          .order('nombre', { ascending: true })

        if (tiposErr) throw tiposErr
        setTiposResiduo(tiposData || [])

        if (isClientScoped && clienteId) {
          // Si el usuario pertenece a una empresa específica, fijar el cliente
          setSelectedCliente(String(clienteId))
          const { data: clienteData, error: clienteErr } = await supabase
            .from('clientes')
            .select('id, razon_social')
            .eq('id', clienteId)
            .single()

          if (!clienteErr && clienteData) {
            setAssignedClientName(clienteData.razon_social)
          }
        } else {
          // Si es rol global (admin, sup. global, op. global), cargar listado de clientes activos
          const { data: clientesData, error: clientesErr } = await supabase
            .from('clientes')
            .select('id, razon_social')
            .eq('activo', true)
            .order('razon_social', { ascending: true })

          if (clientesErr) throw clientesErr
          setClientes(clientesData || [])
        }
      } catch (err: any) {
        setErrorMsg('Error al cargar catálogos iniciales: ' + (err.message || 'Error desconocido'))
      } finally {
        setLoadingCatalogos(false)
      }
    }

    loadInitialData()
  }, [isClientScoped, clienteId])

  // Cargar áreas dinámicamente según el cliente seleccionado
  useEffect(() => {
    setSelectedArea('')
    setAreas([])

    const currentClienteId = isClientScoped && clienteId ? clienteId : (selectedCliente ? parseInt(selectedCliente) : null)

    if (!currentClienteId) return

    async function loadAreasForCliente(cId: number) {
      try {
        setLoadingAreas(true)
        const { data: areasData, error: areasErr } = await supabase
          .from('areas')
          .select('id, nombre')
          .eq('cliente_id', cId)
          .eq('activo', true)
          .order('nombre', { ascending: true })

        if (areasErr) throw areasErr
        setAreas(areasData || [])
      } catch (err: any) {
        setErrorMsg('Error al cargar áreas: ' + err.message)
      } finally {
        setLoadingAreas(false)
      }
    }

    loadAreasForCliente(currentClienteId)
  }, [selectedCliente, isClientScoped, clienteId])

  // Revocar URLs al desmontar o cambiar previews
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  // Selección de archivos con previsualización
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)

      if (selectedFiles.length + newFiles.length > 5) {
        setErrorMsg('Límite superado. Solo puedes adjuntar hasta 5 fotos por registro.')
        return
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      for (const file of newFiles) {
        if (!allowedTypes.includes(file.type)) {
          setErrorMsg(`Tipo de archivo no permitido: ${file.name}. Solo se aceptan JPEG, PNG o WEBP.`)
          return
        }
        if (file.size / (1024 * 1024) > 10) {
          setErrorMsg(`El archivo ${file.name} supera el tamaño máximo permitido de 10MB.`)
          return
        }
      }

      const newUrls = newFiles.map(f => URL.createObjectURL(f))
      setSelectedFiles(prev => [...prev, ...newFiles])
      setPreviewUrls(prev => [...prev, ...newUrls])
    }
  }

  // Eliminar foto seleccionada
  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    const finalClienteId = isClientScoped && clienteId ? clienteId : parseInt(selectedCliente)

    // Validaciones
    if (!finalClienteId) {
      setErrorMsg('Debe seleccionarse un cliente válido.')
      setSubmitting(false)
      return
    }

    if (!selectedArea) {
      setErrorMsg('Debe seleccionarse un área de origen.')
      setSubmitting(false)
      return
    }

    if (!selectedTipoResiduo) {
      setErrorMsg('Debe seleccionarse un tipo de residuo.')
      setSubmitting(false)
      return
    }

    if (!depositanteNombre.trim()) {
      setErrorMsg('El nombre del depositante o chofer es obligatorio.')
      setSubmitting(false)
      return
    }

    const parsedPeso = parseFloat(peso)
    if (!peso.trim() || isNaN(parsedPeso) || parsedPeso <= 0) {
      setErrorMsg('Debes ingresar un peso válido mayor a cero (en kg).')
      setSubmitting(false)
      return
    }

    let parsedImporte: number | null = null
    if (importe.trim()) {
      parsedImporte = parseFloat(importe)
      if (isNaN(parsedImporte) || parsedImporte < 0) {
        setErrorMsg('El importe, si se indica, debe ser un valor numérico mayor o igual a cero.')
        setSubmitting(false)
        return
      }
    }

    const tipoSelected = tiposResiduo.find(t => t.id === parseInt(selectedTipoResiduo))
    if (tipoSelected?.requiere_foto && selectedFiles.length === 0) {
      setErrorMsg(`El residuo "${tipoSelected.nombre}" requiere obligatoriamente al menos una foto de respaldo antes de registrar el ingreso.`)
      setSubmitting(false)
      return
    }

    if (!userId) {
      setErrorMsg('No se detectó un usuario autenticado para registrar el ingreso.')
      setSubmitting(false)
      return
    }

    try {
      // 1. Insertar registro de ingreso
      const insertPayload: Database['public']['Tables']['registros_ingreso']['Insert'] = {
        cliente_id: finalClienteId,
        area_id: parseInt(selectedArea),
        tipo_residuo_id: parseInt(selectedTipoResiduo),
        operador_id: userId,
        depositante_nombre: depositanteNombre.trim(),
        depositante_referencia: depositanteReferencia.trim() || null,
        peso: parsedPeso,
        importe: parsedImporte,
        observaciones: observaciones.trim() || null,
        estado: selectedFiles.length > 0 ? 'completo' : 'pendiente'
      }

      const { data: newReg, error: regErr } = await supabase
        .from('registros_ingreso')
        .insert(insertPayload as any)
        .select('id')
        .single()

      if (regErr) throw regErr
      if (!newReg) throw new Error('No se pudo crear el registro.')

      const registroId = (newReg as { id: number }).id

      // 2. Subir fotos si se seleccionaron
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const timestamp = Date.now()
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const storagePath = `${registroId}/operador/${timestamp}_${sanitizedName}`

          // Subir a Storage
          const { error: uploadErr } = await supabase.storage
            .from('residuos-fotos')
            .upload(storagePath, file, {
              contentType: file.type
            })

          if (uploadErr) throw uploadErr

          // Insertar en la tabla fotos_ingreso
          const fotoPayload: Database['public']['Tables']['fotos_ingreso']['Insert'] = {
            registro_id: registroId,
            storage_path: storagePath,
            subida_por_operador: true,
            magic_link_id: null
          }

          const { error: fotoErr } = await supabase
            .from('fotos_ingreso')
            .insert(fotoPayload as any)

          if (fotoErr) throw fotoErr
        }
      }

      setSuccessData({ id: String(registroId) })
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al guardar el registro.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    if (!isClientScoped) {
      setSelectedCliente('')
    }
    setSelectedArea('')
    setSelectedTipoResiduo('')
    setDepositanteNombre('')
    setDepositanteReferencia('')
    setPeso('')
    setImporte('')
    setObservaciones('')
    setSelectedFiles([])
    setPreviewUrls([])
    setSuccessData(null)
    setErrorMsg(null)
  }

  const selectedTipo = tiposResiduo.find(t => t.id === parseInt(selectedTipoResiduo))

  if (loadingCatalogos) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-violet-500/25 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando catálogos del sistema...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-white">Nuevo Ingreso de Residuos</h2>
            <p className="text-sm text-slate-400">Registra la entrada de material y asocia la evidencia fotográfica correspondiente.</p>
          </div>
        </div>

        {successData ? (
          <div className="rounded-2xl glass-panel p-8 text-center border border-emerald-500/20 relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Ingreso Registrado con Éxito</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
              El ingreso fue registrado como registro N° <strong className="text-slate-200">#{successData.id}</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto py-3 px-6 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition-colors active:scale-[0.98]"
              >
                Registrar Otro Ingreso
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/operador/generar-magic-link', { state: { registroId: successData.id } })}
                className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-violet-500 hover:to-fuchsia-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-600/15"
              >
                Generar Magic Link para Depositante
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6 relative">
            {errorMsg && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Cliente *
                </label>
                {isClientScoped ? (
                  <div className="py-3 px-4 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-200 flex items-center justify-between">
                    <span className="font-semibold">{assignedClientName || `Cliente #${clienteId}`}</span>
                    <span className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                      <Lock className="w-3 h-3" />
                      Asignado
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedCliente}
                    onChange={(e) => setSelectedCliente(e.target.value)}
                    className="w-full py-3 px-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all cursor-pointer"
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.razon_social}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Área de Origen *
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={(!selectedCliente && !isClientScoped) || loadingAreas}
                  required
                >
                  <option value="">
                    {loadingAreas 
                      ? 'Cargando áreas...' 
                      : (!selectedCliente && !isClientScoped) 
                        ? 'Primero selecciona un cliente' 
                        : 'Selecciona un área'}
                  </option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Residuo */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Tipo de Residuo *
                </label>
                <select
                  value={selectedTipoResiduo}
                  onChange={(e) => setSelectedTipoResiduo(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all cursor-pointer"
                  required
                >
                  <option value="">Selecciona tipo de residuo</option>
                  {tiposResiduo.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.requiere_foto ? '(Requiere Foto)' : ''}
                    </option>
                  ))}
                </select>
                {selectedTipo?.requiere_foto && (
                  <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Este tipo de residuo exige al menos una foto de respaldo.
                  </p>
                )}
              </div>

              {/* Depositante Nombre */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Nombre de Depositante (Chofer/Entrega) *
                </label>
                <input
                  type="text"
                  value={depositanteNombre}
                  onChange={(e) => setDepositanteNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full py-3 px-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  required
                />
              </div>

              {/* Depositante Referencia */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Referencia de Depositante (DNI, Patente, Empresa)
                </label>
                <input
                  type="text"
                  value={depositanteReferencia}
                  onChange={(e) => setDepositanteReferencia(e.target.value)}
                  placeholder="Ej. DNI 12.345.678 / Patente AB 123 CD"
                  className="w-full py-3 px-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </div>

              {/* Peso (kg) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  Peso del Material (kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Ej. 450.50"
                    className="w-full py-3 px-4 pr-12 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-mono"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    kg
                  </span>
                </div>
              </div>

              {/* Importe ($) Opcional */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Importe Estimado ($)
                  </span>
                  <span className="text-[10px] text-slate-500 lowercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">opcional</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importe}
                    onChange={(e) => setImporte(e.target.value)}
                    placeholder="Ej. 35000.00"
                    className="w-full py-3 px-4 pl-8 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Subida de Fotos con Previews */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  Fotos de Respaldo {selectedTipo?.requiere_foto && <span className="text-amber-400">*</span>}
                </span>
                <span className="text-xs text-slate-500 lowercase">
                  {selectedFiles.length}/5 fotos
                </span>
              </label>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="operator-photos"
                disabled={submitting || selectedFiles.length >= 5}
              />

              {selectedFiles.length < 5 && (
                <label
                  htmlFor="operator-photos"
                  className="flex items-center justify-center gap-2 w-full py-4 px-4 bg-slate-900/40 border border-dashed border-slate-800 hover:border-violet-500/50 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer text-sm font-medium"
                >
                  <Camera className="w-4 h-4 text-violet-400" />
                  <span>Adjuntar fotos de residuo (JPG, PNG o WEBP - máx. 10MB)</span>
                </label>
              )}

              {/* Grid de Thumbnails */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                  {previewUrls.map((url, idx) => (
                    <div key={url} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-800 bg-slate-950">
                      <img src={url} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={submitting}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-500/90 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-md cursor-pointer"
                        title="Eliminar foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Observaciones adicionales
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles sobre estado del material, precintos, pesaje, etc..."
                rows={3}
                className="w-full py-3 px-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando Ingreso...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>Registrar Ingreso</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </Layout>
  )
}
