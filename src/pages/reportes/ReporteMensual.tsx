import { useState, useEffect, useMemo, useCallback } from 'react'
import Layout from '../../components/ui/Layout'
import { supabase } from '../../lib/supabase'
import { useRol } from '../../hooks/useRol'
import { 
  Building2, 
  Calendar, 
  Printer, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Layers, 
  FileText, 
  BarChart2, 
  Camera, 
  Sparkles, 
  Scale, 
  Edit3,
  X,
  Plus,
  CheckSquare,
  Square
} from 'lucide-react'

interface MetadatosInforme {
  id?: number
  numero_informe?: number
  titulo?: string
  ocupacion_patio_rsu_pct?: number
  ocupacion_patio_rrpp_pct?: number
  tareas_sitio?: string[]
  conclusiones?: string
}

export interface PatioItem {
  patio_id: number
  patio_nombre: string
  patio_codigo: string | null
  patio_tipo: string
  capacidad_nominal: number | null
  unidad_capacidad: string
  descripcion: string | null
  porcentaje_ocupacion: number
  observaciones: string | null
}

export interface TareaItem {
  tarea_id: number
  tarea_nombre: string
  tarea_categoria: string
  orden: number
  completada: boolean
  detalle_adicional: string | null
}

interface ResumenCorriente {
  clasificacion_id: number
  clasificacion_codigo: string
  clasificacion_nombre: string
  clasificacion_color: string
  orden_reporte: number
  tipo_residuo_id: number
  tipo_residuo_nombre: string
  codigo_y: string | null
  codigo_y_nombre: string | null
  unidad_medida_simbolo: string
  cantidad_ingresos: number
  total_bultos: number
  total_peso_kg: number
  total_importe: number
}

interface ResumenSector {
  empresa_contratista: string
  sector_id: number
  sector_nombre: string
  categoria_area_nombre: string
  clasificacion_codigo: string
  clasificacion_color: string
  cantidad_ingresos: number
  total_bultos: number
  total_peso_kg: number
}

interface DesvioItem {
  id: number
  fecha_hora_ingreso: string
  empresa_contratista: string
  sector_nombre: string
  tipo_residuo_nombre: string
  clasificacion_nombre: string
  cantidad_bultos: number | null
  peso_kg: number
  unidad_medida_simbolo: string
  motivo_desvio: string | null
  observaciones: string | null
}

interface AcumuladoMensual {
  periodo_mes: string
  clasificacion_codigo: string
  clasificacion_nombre: string
  clasificacion_color: string
  cantidad_ingresos: number
  total_peso_kg: number
}

interface RetiroItem {
  id: number
  fecha_retiro: string
  numero_remito: string
  tipo_residuo_nombre: string
  clasificacion_nombre: string
  cantidad: number
  unidad_medida_simbolo: string
  lugar_egreso: string | null
  empresa_transportista: string
  autorizado_por: string | null
  responsable_patio: string | null
}

interface FotoEvidencia {
  id: number
  registro_id: number
  storage_path: string
  signedUrl?: string
  created_at: string | null
}

const MESES = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Setiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' }
]

export default function ReporteMensual() {
  const { clienteId, isAdmin, isSupervisorGlobal } = useRol()

  // Selección de Cliente, Año y Mes
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(clienteId || null)
  const [clientes, setClientes] = useState<{ id: number; razon_social: string; cuit: string }[]>([])
  
  const currentDate = new Date()
  const [selectedAnio, setSelectedAnio] = useState<number>(currentDate.getFullYear())
  const [selectedMes, setSelectedMes] = useState<number>(currentDate.getMonth() + 1)

  // Estados de carga y datos
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Bloques del informe
  const [metadatos, setMetadatos] = useState<MetadatosInforme>({})
  const [patios, setPatios] = useState<PatioItem[]>([])
  const [tareas, setTareas] = useState<TareaItem[]>([])
  const [corrientes, setCorrientes] = useState<ResumenCorriente[]>([])
  const [sectores, setSectores] = useState<ResumenSector[]>([])
  const [desvios, setDesvios] = useState<DesvioItem[]>([])
  const [acumuladoMensual, setAcumuladoMensual] = useState<AcumuladoMensual[]>([])
  const [retiros, setRetiros] = useState<RetiroItem[]>([])
  const [fotos, setFotos] = useState<FotoEvidencia[]>([])

  // Modal para configurar bitácora y patios
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [editNumeroInforme, setEditNumeroInforme] = useState<number>(7)
  const [editConclusiones, setEditConclusiones] = useState<string>('')
  const [editPatios, setEditPatios] = useState<PatioItem[]>([])
  const [editTareas, setEditTareas] = useState<TareaItem[]>([])
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState<string>('')
  const [showAddPatio, setShowAddPatio] = useState(false)
  const [nuevoPatioNombre, setNuevoPatioNombre] = useState('')
  const [nuevoPatioTipo, setNuevoPatioTipo] = useState<'rsu' | 'rrpp' | 'inerte' | 'reciclable' | 'general' | 'mixto'>('general')
  const [nuevoPatioCapacidad, setNuevoPatioCapacidad] = useState<number | ''>('')
  const [nuevoPatioUnidad, setNuevoPatioUnidad] = useState('m2')
  const [savingConfig, setSavingConfig] = useState(false)

  // Cargar lista de clientes si es admin o supervisor global
  useEffect(() => {
    async function loadClientes() {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, razon_social, cuit')
        .eq('activo', true)
        .order('razon_social')

      if (!error && data) {
        setClientes(data)
        if (!selectedClienteId && data.length > 0) {
          setSelectedClienteId(clienteId || data[0].id)
        }
      }
    }

    if (isAdmin || isSupervisorGlobal) {
      loadClientes()
    } else if (clienteId) {
      setSelectedClienteId(clienteId)
    }
  }, [isAdmin, isSupervisorGlobal, clienteId])

  // Cargar informe completo desde RPC
  const fetchInforme = useCallback(async () => {
    if (!selectedClienteId) return

    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Invocar el RPC analítico consolidado
      const { data, error } = await supabase.rpc('get_datos_informe_mensual', {
        p_cliente_id: selectedClienteId,
        p_anio: selectedAnio,
        p_mes: selectedMes
      })

      if (error) throw error

      if (data) {
        const payload = data as {
          metadatos?: MetadatosInforme
          patios?: PatioItem[]
          tareas?: TareaItem[]
          resumen_corrientes?: ResumenCorriente[]
          resumen_sectores?: ResumenSector[]
          desvios?: DesvioItem[]
          acumulado_mensual?: AcumuladoMensual[]
          retiros?: RetiroItem[]
        }

        setMetadatos(payload.metadatos || {})
        setPatios(payload.patios || [])
        setTareas(payload.tareas || [])
        setCorrientes(payload.resumen_corrientes || [])
        setSectores(payload.resumen_sectores || [])
        setDesvios(payload.desvios || [])
        setAcumuladoMensual(payload.acumulado_mensual || [])
        setRetiros(payload.retiros || [])

        // Inicializar formulario de edición
        if (payload.metadatos) {
          setEditNumeroInforme(payload.metadatos.numero_informe || selectedMes)
          setEditConclusiones(payload.metadatos.conclusiones || '')
        }
        setEditPatios(payload.patios || [])
        setEditTareas(payload.tareas || [])
      }

      // 2. Traer fotos de ingresos del mes para la galería de evidencia
      const primerDia = `${selectedAnio}-${String(selectedMes).padStart(2, '0')}-01`
      const ultimoDiaDate = new Date(selectedAnio, selectedMes, 0)
      const ultimoDia = `${selectedAnio}-${String(selectedMes).padStart(2, '0')}-${String(ultimoDiaDate.getDate()).padStart(2, '0')}`

      const { data: regData } = await supabase
        .from('registros_ingreso')
        .select('id')
        .eq('cliente_id', selectedClienteId)
        .gte('fecha_hora_ingreso', `${primerDia}T00:00:00`)
        .lte('fecha_hora_ingreso', `${ultimoDia}T23:59:59`)

      if (regData && regData.length > 0) {
        const ids = regData.map((r) => r.id)
        const { data: fotosData } = await supabase
          .from('fotos_ingreso')
          .select('id, registro_id, storage_path, created_at')
          .in('registro_id', ids)
          .limit(16)

        if (fotosData && fotosData.length > 0) {
          const fotosConUrl = await Promise.all(
            fotosData.map(async (f) => {
              const { data: signed } = await supabase.storage
                .from('residuos-fotos')
                .createSignedUrl(f.storage_path, 3600)
              return { ...f, signedUrl: signed?.signedUrl }
            })
          )
          setFotos(fotosConUrl.filter((f) => f.signedUrl))
        } else {
          setFotos([])
        }
      } else {
        setFotos([])
      }
    } catch (err: unknown) {
      console.error('Error al cargar informe mensual:', err)
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado al generar el informe.')
    } finally {
      setLoading(false)
    }
  }, [selectedClienteId, selectedAnio, selectedMes])

  useEffect(() => {
    if (selectedClienteId) {
      fetchInforme()
    }
  }, [fetchInforme, selectedClienteId])

  // Guardar configuración de bitácora y patios mediante RPC atómico
  const handleGuardarConfig = async () => {
    if (!selectedClienteId) return
    setSavingConfig(true)
    try {
      const patiosPayload = editPatios.map((p) => ({
        patio_id: p.patio_id,
        porcentaje_ocupacion: Number(p.porcentaje_ocupacion) || 0,
        observaciones: p.observaciones || null
      }))

      const tareasPayload = editTareas.map((t) => ({
        tarea_id: t.tarea_id,
        completada: t.completada,
        detalle_adicional: t.detalle_adicional || null
      }))

      const { error } = await supabase.rpc('guardar_auditoria_informe_mensual', {
        p_cliente_id: selectedClienteId,
        p_anio: selectedAnio,
        p_mes: selectedMes,
        p_numero_informe: editNumeroInforme,
        p_titulo: metadatos.titulo || 'Informe Mensual de Gestión de Residuos',
        p_conclusiones: editConclusiones,
        p_patios: patiosPayload,
        p_tareas: tareasPayload
      })

      if (error) throw error
      setIsConfigModalOpen(false)
      fetchInforme()
    } catch (e: unknown) {
      alert('Error al guardar configuración: ' + (e instanceof Error ? e.message : 'Error desconocido'))
    } finally {
      setSavingConfig(false)
    }
  }

  // Agregar nueva tarea al catálogo del cliente
  const handleAgregarTarea = async () => {
    if (!selectedClienteId || !nuevaTareaTexto.trim()) return
    try {
      const { data, error } = await supabase
        .from('tareas_sitio')
        .insert({
          cliente_id: selectedClienteId,
          nombre: nuevaTareaTexto.trim(),
          categoria: 'operacion',
          orden: editTareas.length + 1,
          activo: true
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setEditTareas((prev) => [
          ...prev,
          {
            tarea_id: data.id,
            tarea_nombre: data.nombre,
            tarea_categoria: data.categoria,
            orden: data.orden,
            completada: true,
            detalle_adicional: null
          }
        ])
        setNuevaTareaTexto('')
      }
    } catch (err: unknown) {
      alert('Error al agregar tarea: ' + (err instanceof Error ? err.message : 'Error'))
    }
  }

  // Agregar nuevo patio al catálogo del cliente
  const handleAgregarPatio = async () => {
    if (!selectedClienteId || !nuevoPatioNombre.trim()) return
    try {
      const { data, error } = await supabase
        .from('patios')
        .insert({
          cliente_id: selectedClienteId,
          nombre: nuevoPatioNombre.trim(),
          tipo: nuevoPatioTipo,
          capacidad_nominal: nuevoPatioCapacidad ? Number(nuevoPatioCapacidad) : null,
          unidad_capacidad: nuevoPatioUnidad,
          activo: true
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setEditPatios((prev) => [
          ...prev,
          {
            patio_id: data.id,
            patio_nombre: data.nombre,
            patio_codigo: data.codigo,
            patio_tipo: data.tipo,
            capacidad_nominal: data.capacidad_nominal ? Number(data.capacidad_nominal) : null,
            unidad_capacidad: data.unidad_capacidad,
            descripcion: data.descripcion,
            porcentaje_ocupacion: 0,
            observaciones: null
          }
        ])
        setNuevoPatioNombre('')
        setNuevoPatioCapacidad('')
        setShowAddPatio(false)
      }
    } catch (err: unknown) {
      alert('Error al agregar patio: ' + (err instanceof Error ? err.message : 'Error'))
    }
  }

  // Cálculos de Totales y KPIs
  const clienteActivo = useMemo(() => {
    return clientes.find((c) => c.id === selectedClienteId) || null
  }, [clientes, selectedClienteId])

  const mesNombre = useMemo(() => {
    return MESES.find((m) => m.valor === selectedMes)?.nombre || ''
  }, [selectedMes])

  const totalPesoGeneral = useMemo(() => {
    return corrientes.reduce((acc, c) => acc + (Number(c.total_peso_kg) || 0), 0)
  }, [corrientes])

  const totalBultosGeneral = useMemo(() => {
    return corrientes.reduce((acc, c) => acc + (Number(c.total_bultos) || 0), 0)
  }, [corrientes])

  const kpisPorCorriente = useMemo(() => {
    const mapa: Record<string, { peso: number; bultos: number; ingresos: number; color: string; nombre: string }> = {}
    corrientes.forEach((c) => {
      if (!mapa[c.clasificacion_codigo]) {
        mapa[c.clasificacion_codigo] = {
          peso: 0,
          bultos: 0,
          ingresos: 0,
          color: c.clasificacion_color,
          nombre: c.clasificacion_nombre
        }
      }
      mapa[c.clasificacion_codigo].peso += Number(c.total_peso_kg) || 0
      mapa[c.clasificacion_codigo].bultos += Number(c.total_bultos) || 0
      mapa[c.clasificacion_codigo].ingresos += Number(c.cantidad_ingresos) || 0
    })
    return mapa
  }, [corrientes])

  // Desvío de Relleno (Tasa de Reciclabilidad / Valorización)
  const tasaReciclaje = useMemo(() => {
    if (totalPesoGeneral === 0) return 0
    const pesoReciclable = kpisPorCorriente['RECICLABLE']?.peso || 0
    return ((pesoReciclable / totalPesoGeneral) * 100).toFixed(1)
  }, [totalPesoGeneral, kpisPorCorriente])

  // Imprimir o Guardar PDF
  const handlePrint = () => {
    window.print()
  }

  // Exportar datos a CSV
  const handleExportCSV = () => {
    if (corrientes.length === 0) return
    const headers = ['Corriente', 'Tipo de Residuo', 'Codigo Y', 'Unidad', 'Ingresos', 'Bultos', 'Peso (kg)', 'Importe']
    const rows = corrientes.map((c) => [
      `"${c.clasificacion_nombre}"`,
      `"${c.tipo_residuo_nombre}"`,
      `"${c.codigo_y || ''}"`,
      `"${c.unidad_medida_simbolo}"`,
      c.cantidad_ingresos,
      c.total_bultos,
      c.total_peso_kg,
      c.total_importe
    ])
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `informe_${clienteActivo?.razon_social || 'cliente'}_${selectedAnio}_${selectedMes}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Layout>
      {/* Estilos específicos para impresión @media print */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt;
          }
          nav, aside, header, .no-print, button, .modal-backdrop {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-break-inside {
            page-break-inside: avoid;
          }
          .print-page-break {
            page-break-before: always;
          }
          .card-print {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
        }
      `}</style>

      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Barra de Controles Superiores (Oculta en Impresión) */}
        <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Selector de Cliente */}
            {(isAdmin || isSupervisorGlobal) && (
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
                <Building2 className="w-4 h-4 text-violet-400" />
                <select
                  value={selectedClienteId || ''}
                  onChange={(e) => setSelectedClienteId(Number(e.target.value))}
                  className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                      {c.razon_social}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Período (Mes y Año) */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedMes}
                onChange={(e) => setSelectedMes(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer"
              >
                {MESES.map((m) => (
                  <option key={m.valor} value={m.valor} className="bg-slate-900 text-slate-200">
                    {m.nombre}
                  </option>
                ))}
              </select>
              <select
                value={selectedAnio}
                onChange={(e) => setSelectedAnio(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer border-l border-slate-700 pl-2"
              >
                {[2024, 2025, 2026, 2027].map((a) => (
                  <option key={a} value={a} className="bg-slate-900 text-slate-200">
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Refrescar */}
            <button
              onClick={fetchInforme}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700/60"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Acciones de Exportación e Impresión */}
          <div className="flex items-center gap-3">
            {(isAdmin || isSupervisorGlobal) && (
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-amber-500/30 transition shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>Auditar Patios / Tareas</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-violet-500/25 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>

        {/* Mensaje de error si ocurre */}
        {errorMsg && (
          <div className="no-print bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}

        {/* Encabezado Institucional del Informe (Visible en Pantalla e Impresión) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden card-print">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none no-print" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full">
                  Informe Mensual N° {metadatos.numero_informe || selectedMes}
                </span>
                <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Gestión Ambiental Ley 24.051
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Gestión Integral de Residuos Peligrosos y No Peligrosos
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Cliente: <strong className="text-slate-200 font-semibold">{clienteActivo?.razon_social || 'Cliente'}</strong> | Período: <strong className="text-slate-200 font-semibold">{mesNombre} {selectedAnio}</strong> (01 al {new Date(selectedAnio, selectedMes, 0).getDate()} de {mesNombre})
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Certificación & Trazabilidad</div>
              <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
                SMART WASTE
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Control Digital en Sitio</div>
            </div>
          </div>

          {/* Tarjetas de Métricas Principales (KPIs) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 card-print">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Generación Total</span>
                <Scale className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {totalPesoGeneral >= 1000 
                  ? `${(totalPesoGeneral / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} t`
                  : `${totalPesoGeneral.toLocaleString('es-AR')} kg`}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {totalBultosGeneral > 0 ? `${totalBultosGeneral.toLocaleString('es-AR')} bolsas/bultos` : 'Pesaje consolidado'}
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 card-print">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Tasa Reciclaje</span>
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400">
                {tasaReciclaje}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {((kpisPorCorriente['RECICLABLE']?.peso || 0)).toLocaleString('es-AR')} kg valorizados
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 card-print">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Residuos Peligrosos</span>
                <ShieldCheck className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-black text-red-400">
                {(((kpisPorCorriente['PELIGROSO_SOLIDO']?.peso || 0) + (kpisPorCorriente['PELIGROSO_LIQUIDO']?.peso || 0))).toLocaleString('es-AR')}
                <span className="text-xs text-slate-400 font-normal ml-1">kg/L</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Corrientes Y normadas
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 card-print">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Desvíos Operativos</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                {desvios.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {desvios.length === 0 ? 'Sin no conformidades' : 'Auditorías detectadas'}
              </div>
            </div>
          </div>
        </div>

        {/* Semáforos de Ocupación de Patios (Capacidad Operativa Discriminada por Cliente) */}
        <div>
          <div className="flex items-center justify-between mb-3 no-print">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" />
              Estado y Capacidad de Patios de Acopio en Faena
            </h2>
            <span className="text-xs text-slate-400">
              {patios.length} {patios.length === 1 ? 'patio registrado' : 'patios registrados'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print-break-inside">
            {patios.length > 0 ? (
              patios.map((p) => {
                const pct = Number(p.porcentaje_ocupacion) || 0
                const estadoBadge = pct <= 30 
                  ? { label: 'Baja Ocupación', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500' }
                  : pct <= 70
                  ? { label: 'Media Ocupación', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', bar: 'bg-amber-500' }
                  : { label: 'Alta Ocupación', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', bar: 'bg-rose-500' }

                return (
                  <div key={p.patio_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-print flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {p.patio_tipo.toUpperCase()}
                            </span>
                            {p.capacidad_nominal && (
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                Cap: {p.capacidad_nominal} {p.unidad_capacidad}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-white mt-1 leading-snug">{p.patio_nombre}</h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${estadoBadge.color} shrink-0`}>
                          {estadoBadge.label}
                        </span>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Capacidad en Uso:</span>
                          <strong className="text-white font-mono text-base">{pct}%</strong>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${estadoBadge.bar}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
                      {p.observaciones || (
                        pct <= 30
                          ? `El patio cuenta con un ${100 - pct}% de espacio libre disponible para maniobra de equipos y recambio de contenedores.`
                          : pct <= 70
                          ? `Ocupación moderada. Se recomienda coordinar retiro de corrientes acumuladas para preservar capacidad operativa.`
                          : `Atención: Alta ocupación. Requiere programar retiro urgente de residuos con transportista autorizado.`
                      )}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full py-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
                No hay patios configurados para este cliente. Utilice &quot;Auditar Patios / Tareas&quot; para registrar patios.
              </div>
            )}
          </div>
        </div>

        {/* TABLA 1: Desglose por Corriente y Tipo de Residuo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden card-print print-break-inside">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-400" />
                Tabla 1: Generación de Residuos por Corriente y Material
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Clasificación canónica para auditorías de sostenibilidad y Ley 24.051</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Corriente Troncal</th>
                  <th className="py-3 px-4">Tipo de Material / Residuo</th>
                  <th className="py-3 px-4">Código Legal (Y)</th>
                  <th className="py-3 px-4 text-center">Ingresos (viajes)</th>
                  <th className="py-3 px-4 text-right">Bultos / Bolsas</th>
                  <th className="py-3 px-4 text-right">Pesaje / Volumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {corrientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      No hay ingresos registrados en el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  corrientes.map((c) => (
                    <tr key={c.tipo_residuo_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: c.clasificacion_color }}
                        />
                        <span>{c.clasificacion_nombre}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{c.tipo_residuo_nombre}</td>
                      <td className="py-3 px-4">
                        {c.codigo_y ? (
                          <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 rounded">
                            {c.codigo_y}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">{c.cantidad_ingresos}</td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {c.total_bultos > 0 ? c.total_bultos.toLocaleString('es-AR') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {Number(c.total_peso_kg).toLocaleString('es-AR')} {c.unidad_medida_simbolo}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {corrientes.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-white">
                    <td colSpan={3} className="py-3.5 px-4 text-right uppercase text-xs tracking-wider">
                      Total Acumulado del Mes:
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {corrientes.reduce((a, b) => a + Number(b.cantidad_ingresos), 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {totalBultosGeneral.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 text-base">
                      {totalPesoGeneral.toLocaleString('es-AR')} kg
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* TABLA 2: Evolución Multimensual Acumulativa del Año */}
        {acumuladoMensual.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden card-print print-break-inside">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-violet-400" />
                  Tabla 2: Evolución Histórica de Generación por Corriente ({selectedAnio})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Seguimiento acumulativo mensual de peso por tipo de corriente</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Mes / Período</th>
                    <th className="py-3 px-4">Corriente</th>
                    <th className="py-3 px-4 text-center">Ingresos</th>
                    <th className="py-3 px-4 text-right">Peso Total (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {acumuladoMensual.map((item, idx) => (
                    <tr key={`${item.periodo_mes}-${item.clasificacion_codigo}-${idx}`} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">{item.periodo_mes}</td>
                      <td className="py-3 px-4 flex items-center gap-2 text-slate-300">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: item.clasificacion_color }}
                        />
                        <span>{item.clasificacion_nombre}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">{item.cantidad_ingresos}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {Number(item.total_peso_kg).toLocaleString('es-AR')} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLA 3: Generación por Sector y Contratistas (Pareto) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden card-print print-break-inside">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
                Tabla 3: Generación por Empresa Contratista y Sector Operativo
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Control de centros de costos y focos generadores en faena minera</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Contratista / Empresa</th>
                  <th className="py-3 px-4">Sector / Instalación</th>
                  <th className="py-3 px-4">Categoría Global</th>
                  <th className="py-3 px-4 text-center">Ingresos</th>
                  <th className="py-3 px-4 text-right">Bolsas/Bultos</th>
                  <th className="py-3 px-4 text-right">Peso (kg)</th>
                  <th className="py-3 px-4 text-right">% Relativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sectores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                      No hay registros de sectores en el período.
                    </td>
                  </tr>
                ) : (
                  sectores.map((s, idx) => {
                    const pct = totalPesoGeneral > 0 ? ((Number(s.total_peso_kg) / totalPesoGeneral) * 100).toFixed(1) : '0'
                    return (
                      <tr key={`${s.empresa_contratista}-${s.sector_id}-${idx}`} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-200">{s.empresa_contratista}</td>
                        <td className="py-3 px-4 text-slate-300">{s.sector_nombre}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-md border border-slate-700">
                            {s.categoria_area_nombre}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">{s.cantidad_ingresos}</td>
                        <td className="py-3 px-4 text-right text-slate-300">{s.total_bultos || '-'}</td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {Number(s.total_peso_kg).toLocaleString('es-AR')} kg
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs font-semibold text-slate-400">{pct}%</span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA 3: Desvíos Detectados (No Conformidades Operativas) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden card-print print-break-inside">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Tabla 3: Registro de Desvíos Operativos y No Conformidades
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Detección temprana de segregación errónea en patio de transferencia</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {desvios.length} {desvios.length === 1 ? 'Desvío' : 'Desvíos'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Sector Responsable</th>
                  <th className="py-3 px-4">Contratista</th>
                  <th className="py-3 px-4">Residuo Afectado</th>
                  <th className="py-3 px-4 text-right">Pesaje Afectado</th>
                  <th className="py-3 px-4">Motivo del Desvío</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {desvios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-emerald-400 font-medium">
                      ✓ No se detectaron desvíos ni no conformidades en este período. Excelente segregación.
                    </td>
                  </tr>
                ) : (
                  desvios.map((d) => (
                    <tr key={d.id} className="hover:bg-amber-500/5 transition">
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(d.fecha_hora_ingreso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{d.sector_nombre}</td>
                      <td className="py-3 px-4 text-slate-300">{d.empresa_contratista}</td>
                      <td className="py-3 px-4 text-slate-300">{d.tipo_residuo_nombre}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        {Number(d.peso_kg).toLocaleString('es-AR')} {d.unidad_medida_simbolo}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                          {d.motivo_desvio || 'Mezcla indebida'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA 4: Salida / Retiro de Residuos de Sitio (Logística Inversa) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden card-print print-break-inside">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Tabla 4: Salidas y Retiros de Residuos de Sitio (Disposición Final / Reciclaje)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Control de manifiestos y remitos oficiales de egreso de faena</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Fecha Retiro</th>
                  <th className="py-3 px-4">N° Remito / Manifiesto</th>
                  <th className="py-3 px-4">Corriente / Residuo</th>
                  <th className="py-3 px-4 text-right">Cantidad</th>
                  <th className="py-3 px-4">Lugar Egreso</th>
                  <th className="py-3 px-4">Transportista Habilitado</th>
                  <th className="py-3 px-4">Autorizado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {retiros.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                      No se registraron salidas de residuos en este mes.
                    </td>
                  </tr>
                ) : (
                  retiros.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {new Date(r.fecha_retiro).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{r.numero_remito}</td>
                      <td className="py-3 px-4 text-slate-200">{r.tipo_residuo_nombre}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {Number(r.cantidad).toLocaleString('es-AR')} {r.unidad_medida_simbolo}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{r.lugar_egreso || 'Patio Central'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{r.empresa_transportista}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{r.autorizado_por || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mosaico de Evidencias Fotográficas */}
        {fotos.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-print print-break-inside">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-violet-400" />
                Evidencia Fotográfica de Operaciones y Estado de Patios
              </h3>
              <span className="text-xs text-slate-400">{fotos.length} fotografías auditadas</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fotos.map((f, i) => (
                <div key={f.id} className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video">
                  <img
                    src={f.signedUrl}
                    alt={`Evidencia ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 opacity-90">
                    <span className="text-[10px] text-slate-300 font-mono">
                      Foto #{i + 1} {f.created_at ? `- ${new Date(f.created_at).toLocaleDateString('es-AR')}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bitácora de Tareas en Sitio y Conclusiones Ejecutivas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-break-inside">
          {/* Tareas en Sitio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-print">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Bitácora de Tareas y Actividades en Sitio
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {tareas.filter((t) => t.completada).length} / {tareas.length} realizadas
              </span>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {tareas.length > 0 ? (
                tareas.map((t) => (
                  <li key={t.tarea_id} className="flex items-start gap-2.5">
                    {t.completada ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0 mt-0.5 inline-block" />
                    )}
                    <div className={t.completada ? 'text-slate-200' : 'text-slate-500 line-through'}>
                      <span>{t.tarea_nombre}</span>
                      {t.detalle_adicional && (
                        <p className="text-xs text-slate-400 font-normal italic mt-0.5">
                          Nota: {t.detalle_adicional}
                        </p>
                      )}
                    </div>
                  </li>
                ))
              ) : (metadatos.tareas_sitio && metadatos.tareas_sitio.length > 0) ? (
                metadatos.tareas_sitio.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500 italic py-2">
                  No hay tareas registradas para este cliente. Utilice &quot;Auditar Patios / Tareas&quot; para registrar actividades.
                </li>
              )}
            </ul>
          </div>

          {/* Conclusiones Oficiales */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 card-print">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Conclusiones y Dictamen de Gestión
            </h3>
            <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
              {metadatos.conclusiones ? (
                <p className="whitespace-pre-line">{metadatos.conclusiones}</p>
              ) : (
                <>
                  <p>
                    ➢ Durante el período <strong>{mesNombre} {selectedAnio}</strong> se procesaron exitosamente un total de <strong>{totalPesoGeneral.toLocaleString('es-AR')} kg</strong> de residuos en el proyecto.
                  </p>
                  <p>
                    ➢ Se logró una tasa de desvío de reciclabilidad del <strong>{tasaReciclaje}%</strong>, evitando su disposición en relleno.
                  </p>
                  <p>
                    ➢ Se registraron <strong>{desvios.length} desvíos operativos</strong>, los cuales fueron identificados y aislados para readecuar su segregación.
                  </p>
                  <p>
                    ➢ Los patios de acopio permanecen en estado óptimo con <strong>baja ocupación operativa</strong>, garantizando capacidad receptiva para los próximos turnos de trabajo.
                  </p>
                </>
              )}
            </div>

            {/* Firma al pie para la versión impresa */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-end text-xs text-slate-500">
              <div>
                <div>Emitido por: <strong>Smart Waste - Gestión Ambiental</strong></div>
                <div>Fecha de emisión: {new Date().toLocaleDateString('es-AR')}</div>
              </div>
              <div className="text-right">
                <div className="w-36 border-b border-slate-600 mb-1"></div>
                <div>Firma Responsable Técnico</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA CONFIGURAR BITÁCORA Y PATIOS (Solo Admin y Sup Global) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  Auditoría Mensual: Patios y Bitácora de Faena
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cliente: <strong className="text-slate-200">{clienteActivo?.razon_social}</strong> | Período: {mesNombre} {selectedAnio}
                </p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Datos Generales del Informe */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                1. Identificación y Conclusiones del Período
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-slate-400 text-xs block mb-1">N° Informe</label>
                  <input
                    type="number"
                    value={editNumeroInforme}
                    onChange={(e) => setEditNumeroInforme(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-slate-400 text-xs block mb-1">Conclusiones y Dictamen Ambiental</label>
                  <textarea
                    rows={3}
                    value={editConclusiones}
                    onChange={(e) => setEditConclusiones(e.target.value)}
                    placeholder="Conclusiones ejecutivas y dictamen del mes..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Patios de Acopio del Cliente */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Ocupación de Patios de Acopio ({editPatios.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddPatio(!showAddPatio)}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddPatio ? 'Cancelar' : 'Nuevo Patio'}</span>
                </button>
              </div>

              {/* Formulario para agregar patio */}
              {showAddPatio && (
                <div className="p-3 bg-slate-900 border border-violet-500/30 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del patio (ej: Patio RSU)"
                      value={nuevoPatioNombre}
                      onChange={(e) => setNuevoPatioNombre(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <select
                      value={nuevoPatioTipo}
                      onChange={(e) => setNuevoPatioTipo(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="rsu">RSU</option>
                      <option value="rrpp">RRPP</option>
                      <option value="reciclable">Reciclable</option>
                      <option value="inerte">Inerte</option>
                      <option value="general">General</option>
                    </select>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="Capacidad"
                        value={nuevoPatioCapacidad}
                        onChange={(e) => setNuevoPatioCapacidad(e.target.value ? Number(e.target.value) : '')}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white w-2/3"
                      />
                      <input
                        type="text"
                        placeholder="Unidad (m2/m3)"
                        value={nuevoPatioUnidad}
                        onChange={(e) => setNuevoPatioUnidad(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white w-1/3"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAgregarPatio}
                      className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg"
                    >
                      Guardar Nuevo Patio
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de patios editables */}
              <div className="space-y-3">
                {editPatios.map((p, idx) => (
                  <div key={p.patio_id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span>{p.patio_nombre}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {p.patio_tipo}
                        </span>
                      </span>
                      <span className="font-mono font-bold text-violet-400 text-sm">
                        {p.porcentaje_ocupacion}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={p.porcentaje_ocupacion}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setEditPatios((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, porcentaje_ocupacion: val } : item))
                            )
                          }}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={p.porcentaje_ocupacion}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)))
                            setEditPatios((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, porcentaje_ocupacion: val } : item))
                            )
                          }}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Observaciones de auditoría..."
                          value={p.observaciones || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setEditPatios((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, observaciones: val } : item))
                            )
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Tareas Operativas de Faena */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Bitácora de Tareas en Sitio ({editTareas.filter((t) => t.completada).length} / {editTareas.length})
                </span>
              </div>

              {/* Input para agregar tarea rápida */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva tarea de faena para este cliente..."
                  value={nuevaTareaTexto}
                  onChange={(e) => setNuevaTareaTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAgregarTarea()
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAgregarTarea}
                  disabled={!nuevaTareaTexto.trim()}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Lista de tareas con checkboxes */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/60">
                {editTareas.map((t, idx) => (
                  <div
                    key={t.tarea_id}
                    onClick={() => {
                      setEditTareas((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, completada: !item.completada } : item))
                      )
                    }}
                    className="flex items-start gap-2.5 pt-2 cursor-pointer group"
                  >
                    <div className="mt-0.5 text-slate-400 group-hover:text-violet-400">
                      {t.completada ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <span className={`text-xs ${t.completada ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                      {t.tarea_nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones de Modal */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarConfig}
                disabled={savingConfig}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition text-sm"
              >
                {savingConfig ? 'Guardando...' : 'Guardar Bitácora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
