import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../../components/ui/Layout'
import { supabase } from '../../lib/supabase'
import { 
  BarChart3, 
  Building2, 
  Calendar, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Camera, 
  ShieldAlert, 
  Layers, 
  Trash2, 
  RefreshCw, 
  X, 
  Eye, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  Scale,
  DollarSign
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

interface Cliente {
  id: number
  razon_social: string
}

interface TipoResiduo {
  id: number
  nombre: string
  requiere_foto: boolean | null
}

interface RegistroRaw {
  id: number
  fecha_hora_ingreso: string
  depositante_nombre: string
  depositante_referencia: string | null
  peso: number
  importe: number | null
  observaciones: string | null
  estado: string
  cliente_id: number
  clientes: { id: number; razon_social: string } | null
  area_id: number
  areas: { 
    id: number
    nombre: string
    categoria_area_id: number | null
    categorias_area: { id: number; nombre: string } | null 
  } | null
  tipo_residuo_id: number
  tipos_residuo: { id: number; nombre: string; requiere_foto: boolean | null } | null
}

type MetricMode = 'ingresos' | 'peso' | 'importe'

export default function DashboardGlobal() {
  const navigate = useNavigate()

  // Filtros
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('30d')
  const [selectedCliente, setSelectedCliente] = useState<string>('all')
  const [selectedTipo, setSelectedTipo] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [metricMode, setMetricMode] = useState<MetricMode>('peso')

  // Catálogos y datos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tiposResiduo, setTiposResiduo] = useState<TipoResiduo[]>([])
  const [registros, setRegistros] = useState<RegistroRaw[]>([])
  const [unalignedAreasCount, setUnalignedAreasCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Paginación de la tabla
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Modal para ver fotos de un registro
  const [modalFotos, setModalFotos] = useState<{
    open: boolean
    registroId: number | null
    urls: string[]
    loading: boolean
  }>({
    open: false,
    registroId: null,
    urls: [],
    loading: false
  })

  // Cargar datos
  const fetchData = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      // 1. Cargar clientes activos
      const { data: clientesData, error: clientesErr } = await supabase
        .from('clientes')
        .select('id, razon_social')
        .eq('activo', true)
        .order('razon_social', { ascending: true })

      if (clientesErr) throw clientesErr
      setClientes(clientesData || [])

      // 2. Cargar tipos de residuo activos
      const { data: tiposData, error: tiposErr } = await supabase
        .from('tipos_residuo')
        .select('id, nombre, requiere_foto')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (tiposErr) throw tiposErr
      setTiposResiduo(tiposData || [])

      // 3. Chequear áreas activas sin alinear
      const { data: unalignedData, error: unalignedErr } = await supabase
        .from('areas')
        .select('id')
        .eq('activo', true)
        .is('categoria_area_id', null)

      if (!unalignedErr && unalignedData) {
        setUnalignedAreasCount(unalignedData.length)
      }

      // 4. Cargar registros de ingreso con peso, importe y relaciones
      const { data: regData, error: regErr } = await supabase
        .from('registros_ingreso')
        .select(`
          id,
          fecha_hora_ingreso,
          depositante_nombre,
          depositante_referencia,
          peso,
          importe,
          observaciones,
          estado,
          cliente_id,
          clientes ( id, razon_social ),
          area_id,
          areas ( id, nombre, categoria_area_id, categorias_area ( id, nombre ) ),
          tipo_residuo_id,
          tipos_residuo ( id, nombre, requiere_foto )
        `)
        .order('fecha_hora_ingreso', { ascending: false })

      if (regErr) throw regErr
      setRegistros((regData as any) || [])
    } catch (err: any) {
      setErrorMsg('Error al sincronizar datos del dashboard: ' + (err.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtrado de registros en memoria según los selectores
  const filteredRegistros = useMemo(() => {
    const now = new Date().getTime()

    return registros.filter((reg) => {
      // Filtro de tiempo
      if (timeRange !== 'all') {
        const regDate = new Date(reg.fecha_hora_ingreso).getTime()
        const daysDiff = (now - regDate) / (1000 * 60 * 60 * 24)
        if (timeRange === '7d' && daysDiff > 7) return false
        if (timeRange === '14d' && daysDiff > 14) return false
        if (timeRange === '30d' && daysDiff > 30) return false
      }

      // Filtro de cliente
      if (selectedCliente !== 'all' && reg.cliente_id !== parseInt(selectedCliente)) {
        return false
      }

      // Filtro de tipo de residuo
      if (selectedTipo !== 'all' && reg.tipo_residuo_id !== parseInt(selectedTipo)) {
        return false
      }

      // Filtro de búsqueda textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchCliente = reg.clientes?.razon_social.toLowerCase().includes(query)
        const matchArea = reg.areas?.nombre.toLowerCase().includes(query)
        const matchResiduo = reg.tipos_residuo?.nombre.toLowerCase().includes(query)
        const matchDepositante = reg.depositante_nombre.toLowerCase().includes(query)
        const matchId = String(reg.id).includes(query)
        if (!matchCliente && !matchArea && !matchResiduo && !matchDepositante && !matchId) {
          return false
        }
      }

      return true
    })
  }, [registros, timeRange, selectedCliente, selectedTipo, searchQuery])

  // Resetear paginación al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [timeRange, selectedCliente, selectedTipo, searchQuery])

  // KPIs Calculados
  const totalIngresos = filteredRegistros.length
  const totalPesoKg = filteredRegistros.reduce((acc, r) => acc + (Number(r.peso) || 0), 0)
  const totalImporte = filteredRegistros.reduce((acc, r) => acc + (Number(r.importe) || 0), 0)
  const completosCount = filteredRegistros.filter(r => r.estado === 'completo').length
  const pendientesCount = filteredRegistros.filter(r => r.estado === 'pendiente').length
  const pctCompletos = totalIngresos > 0 ? Math.round((completosCount / totalIngresos) * 100) : 0
  const residuosPeligrososCount = filteredRegistros.filter(r => r.tipos_residuo?.requiere_foto === true).length
  const activeClientesCount = new Set(filteredRegistros.map(r => r.cliente_id)).size

  // Helper de valor de métrica
  const getMetricValue = (ingresos: number, peso: number, importe: number) => {
    if (metricMode === 'peso') return peso
    if (metricMode === 'importe') return importe
    return ingresos
  }

  const grandTotalMetric = getMetricValue(totalIngresos, totalPesoKg, totalImporte)

  const formatMetricDisplay = (val: number) => {
    if (metricMode === 'peso') {
      return val >= 1000
        ? `${(val / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} tn`
        : `${Math.round(val).toLocaleString()} kg`
    }
    if (metricMode === 'importe') {
      return `$ ${Math.round(val).toLocaleString()}`
    }
    return `${val} viajes`
  }

  // Agrupación 1: Por Cliente
  const dataByCliente = useMemo(() => {
    const counts: { 
      [clienteId: number]: { 
        razon_social: string
        ingresos: number
        peso: number
        importe: number
        completos: number 
      } 
    } = {}
    
    filteredRegistros.forEach((reg) => {
      const cId = reg.cliente_id
      const name = reg.clientes?.razon_social || `Cliente #${cId}`
      if (!counts[cId]) {
        counts[cId] = { razon_social: name, ingresos: 0, peso: 0, importe: 0, completos: 0 }
      }
      counts[cId].ingresos += 1
      counts[cId].peso += Number(reg.peso) || 0
      counts[cId].importe += Number(reg.importe) || 0
      if (reg.estado === 'completo') counts[cId].completos += 1
    })

    return Object.entries(counts)
      .map(([id, val]) => {
        const metricVal = getMetricValue(val.ingresos, val.peso, val.importe)
        const pct = grandTotalMetric > 0 ? Math.round((metricVal / grandTotalMetric) * 100) : 0
        return {
          id: parseInt(id),
          razon_social: val.razon_social,
          ingresos: val.ingresos,
          peso: val.peso,
          importe: val.importe,
          metricVal,
          pct,
          completos: val.completos
        }
      })
      .sort((a, b) => b.metricVal - a.metricVal)
  }, [filteredRegistros, metricMode, grandTotalMetric])

  // Agrupación 2: Por Tipo de Residuo
  const dataByTipo = useMemo(() => {
    const counts: { 
      [tipoId: number]: { 
        nombre: string
        ingresos: number
        peso: number
        importe: number
        requiere_foto: boolean 
      } 
    } = {}

    filteredRegistros.forEach((reg) => {
      const tId = reg.tipo_residuo_id
      const name = reg.tipos_residuo?.nombre || `Tipo #${tId}`
      const req = Boolean(reg.tipos_residuo?.requiere_foto)
      if (!counts[tId]) {
        counts[tId] = { nombre: name, ingresos: 0, peso: 0, importe: 0, requiere_foto: req }
      }
      counts[tId].ingresos += 1
      counts[tId].peso += Number(reg.peso) || 0
      counts[tId].importe += Number(reg.importe) || 0
    })

    return Object.entries(counts)
      .map(([id, val]) => {
        const metricVal = getMetricValue(val.ingresos, val.peso, val.importe)
        const pct = grandTotalMetric > 0 ? Math.round((metricVal / grandTotalMetric) * 100) : 0
        return {
          id: parseInt(id),
          nombre: val.nombre,
          ingresos: val.ingresos,
          peso: val.peso,
          importe: val.importe,
          metricVal,
          pct,
          requiere_foto: val.requiere_foto
        }
      })
      .sort((a, b) => b.metricVal - a.metricVal)
  }, [filteredRegistros, metricMode, grandTotalMetric])

  // Agrupación 3: Por Categoría Global de Área
  const dataByCategoriaArea = useMemo(() => {
    const counts: { 
      [cat: string]: { 
        ingresos: number
        peso: number
        importe: number 
      } 
    } = {}

    filteredRegistros.forEach((reg) => {
      const catName = reg.areas?.categorias_area?.nombre || 'Sin Categoría Global'
      if (!counts[catName]) {
        counts[catName] = { ingresos: 0, peso: 0, importe: 0 }
      }
      counts[catName].ingresos += 1
      counts[catName].peso += Number(reg.peso) || 0
      counts[catName].importe += Number(reg.importe) || 0
    })

    return Object.entries(counts)
      .map(([nombre, val]) => {
        const metricVal = getMetricValue(val.ingresos, val.peso, val.importe)
        const pct = grandTotalMetric > 0 ? Math.round((metricVal / grandTotalMetric) * 100) : 0
        return {
          nombre,
          ingresos: val.ingresos,
          peso: val.peso,
          importe: val.importe,
          metricVal,
          pct
        }
      })
      .sort((a, b) => b.metricVal - a.metricVal)
  }, [filteredRegistros, metricMode, grandTotalMetric])

  // Paginación
  const totalPages = Math.ceil(filteredRegistros.length / pageSize) || 1
  const paginatedRegistros = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRegistros.slice(start, start + pageSize)
  }, [filteredRegistros, currentPage])

  // Abrir modal de fotos con URLs firmadas
  const handleOpenFotos = async (regId: number) => {
    setModalFotos({ open: true, registroId: regId, urls: [], loading: true })
    try {
      const { data: fotosData, error: fotosErr } = await supabase
        .from('fotos_ingreso')
        .select('storage_path')
        .eq('registro_id', regId)

      if (fotosErr) throw fotosErr

      if (fotosData && fotosData.length > 0) {
        const signedUrls: string[] = []
        for (const item of fotosData) {
          const { data, error } = await supabase.storage
            .from('residuos-fotos')
            .createSignedUrl(item.storage_path, 3600)
          if (!error && data?.signedUrl) {
            signedUrls.push(data.signedUrl)
          }
        }
        setModalFotos({ open: true, registroId: regId, urls: signedUrls, loading: false })
      } else {
        setModalFotos({ open: true, registroId: regId, urls: [], loading: false })
      }
    } catch (e) {
      console.error('Error al cargar fotos:', e)
      setModalFotos({ open: true, registroId: regId, urls: [], loading: false })
    }
  }

  // Exportar datos visibles a CSV
  const handleExportCSV = () => {
    if (filteredRegistros.length === 0) return

    const headers = [
      'ID Registro',
      'Fecha/Hora',
      'Cliente',
      'Area',
      'Categoria Global',
      'Tipo de Residuo',
      'Peso (kg)',
      'Importe ($)',
      'Depositante',
      'Referencia Depositante',
      'Estado',
      'Observaciones'
    ]

    const rows = filteredRegistros.map((r) => [
      r.id,
      new Date(r.fecha_hora_ingreso).toLocaleString(),
      `"${r.clientes?.razon_social?.replace(/"/g, '""') || ''}"`,
      `"${r.areas?.nombre?.replace(/"/g, '""') || ''}"`,
      `"${r.areas?.categorias_area?.nombre?.replace(/"/g, '""') || 'Sin Categoria'}"`,
      `"${r.tipos_residuo?.nombre?.replace(/"/g, '""') || ''}"`,
      r.peso,
      r.importe !== null ? r.importe : '',
      `"${r.depositante_nombre?.replace(/"/g, '""') || ''}"`,
      `"${r.depositante_referencia?.replace(/"/g, '""') || ''}"`,
      r.estado,
      `"${r.observaciones?.replace(/"/g, '""') || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `smart_waste_global_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white">Dashboard Global</h2>
              <p className="text-sm text-slate-400">Consolidado general de operaciones, volumen de peso (kg), costos y trazabilidad.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredRegistros.length === 0}
              className="py-2.5 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-semibold active:scale-[0.98] disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4 text-violet-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Alerta de Áreas no alineadas */}
        {unalignedAreasCount > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  {unalignedAreasCount} {unalignedAreasCount === 1 ? 'área activa requiere' : 'áreas activas requieren'} alineación con categoría global
                </h4>
                <p className="text-xs text-amber-300/80">
                  Las áreas sin categoría no se pueden agrupar en la métrica comparativa macro de zonas de operación.
                </p>
              </div>
            </div>
            <Link
              to="/admin/areas"
              className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <span>Alinear Áreas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Panel de Filtros Globales */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-violet-400" />
            <span>Filtros de Análisis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Rango de Tiempo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-violet-400" />
                Período de Análisis
              </label>
              <div className="grid grid-cols-4 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                {(['7d', '14d', '30d', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimeRange(r)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-violet-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === '7d' ? '7 Días' : r === '14d' ? '14 Días' : r === '30d' ? '30 Días' : 'Todo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Cliente */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-violet-400" />
                Filtrar por Empresa
              </label>
              <select
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
                className="w-full py-2 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                <option value="all">Todas las Empresas ({clientes.length})</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.razon_social}</option>
                ))}
              </select>
            </div>

            {/* Selector de Tipo de Residuo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Trash2 className="w-3 h-3 text-violet-400" />
                Tipo de Residuo
              </label>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full py-2 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                <option value="all">Todos los Residuos ({tiposResiduo.length})</option>
                {tiposResiduo.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} {t.requiere_foto ? '⚠️' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Búsqueda Rápida */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <SearchIcon className="w-3 h-3 text-violet-400" />
                Búsqueda Rápida
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chofer, área, ID..."
                className="w-full py-2 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Fila de KPIs (6 Tarjetas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* KPI 1: Ingresos */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ingresos</span>
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{totalIngresos}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">viajes registrados</p>
            </div>
          </div>

          {/* KPI 2: Peso Total */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Peso Total</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Scale className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-cyan-400">
                {totalPesoKg >= 1000 
                  ? `${(totalPesoKg / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} tn`
                  : `${Math.round(totalPesoKg).toLocaleString()} kg`}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {Math.round(totalPesoKg).toLocaleString()} kg totales
              </p>
            </div>
          </div>

          {/* KPI 3: Importe Total */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Importe Total</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400">
                ${Math.round(totalImporte).toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">valor estimado</p>
            </div>
          </div>

          {/* KPI 4: Tasa de Evidencia */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Con Fotos</span>
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{pctCompletos}%</div>
              <p className="text-[10px] text-slate-500 mt-0.5">{completosCount} con foto • {pendientesCount} pendientes</p>
            </div>
          </div>

          {/* KPI 5: Residuos Críticos */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Críticos</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-rose-400">{residuosPeligrososCount}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">peligrosos / RAEE</p>
            </div>
          </div>

          {/* KPI 6: Empresas Activas */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Empresas</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-300">{activeClientesCount}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">de {clientes.length} activas</p>
            </div>
          </div>
        </div>

        {/* Selector de Métrica para Gráficos */}
        <div className="flex items-center justify-between bg-slate-900/40 p-2 rounded-2xl border border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 ml-2">Visualizar Gráficos por:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMetricMode('peso')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                metricMode === 'peso'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-950/50'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Peso (kg)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('importe')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                metricMode === 'importe'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-950/50'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Importe ($)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('ingresos')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                metricMode === 'ingresos'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-950/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cantidad de Ingresos</span>
            </button>
          </div>
        </div>

        {/* Visualizaciones en 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Comparativa por Empresa */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-400" />
                <h3 className="text-base font-bold text-white">Comparativa por Empresa</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Total: {formatMetricDisplay(grandTotalMetric)}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {dataByCliente.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Sin registros en el período</p>
              ) : (
                dataByCliente.map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.razon_social}</span>
                      <span className="text-slate-300 font-mono font-bold">
                        {formatMetricDisplay(item.metricVal)} ({item.pct}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.ingresos} ingresos • {Math.round(item.peso).toLocaleString()} kg • ${Math.round(item.importe).toLocaleString()}</span>
                      <span className="text-emerald-400">{item.ingresos > 0 ? Math.round((item.completos / item.ingresos) * 100) : 0}% con foto</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Gráfico 2: Composición por Tipo de Residuo */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-fuchsia-400" />
                <h3 className="text-base font-bold text-white">Distribución por Tipo de Residuo</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Total: {formatMetricDisplay(grandTotalMetric)}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {dataByTipo.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Sin registros en el período</p>
              ) : (
                dataByTipo.map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        {item.nombre}
                        {item.requiere_foto && (
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.2 rounded">
                            Crítico
                          </span>
                        )}
                      </span>
                      <span className="text-slate-300 font-mono font-bold">
                        {formatMetricDisplay(item.metricVal)} ({item.pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.requiere_foto 
                            ? 'bg-gradient-to-r from-rose-500 to-amber-500' 
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Fila Inferior: Distribución por Categorías Globales de Área */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Generación por Zonas Operativas (Categorías Globales)</h3>
            </div>
            <span className="text-xs text-slate-400">Comparativa estandarizada entre todas las plantas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {dataByCategoriaArea.map((cat) => (
              <div
                key={cat.nombre}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  cat.nombre === 'Sin Categoría Global'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                    {cat.nombre}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-white">
                      {formatMetricDisplay(cat.metricVal)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">({cat.pct}%)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {cat.ingresos} ingresos • {Math.round(cat.peso).toLocaleString()} kg
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-3 border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      cat.nombre === 'Sin Categoría Global' ? 'bg-amber-400' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de Registros Recientes con Peso e Importe */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-0">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Bitácora de Ingresos de Residuos</h3>
              <p className="text-xs text-slate-400">Listado detallado con peso de báscula, importe, chofer y soporte fotográfico.</p>
            </div>
            <span className="text-xs text-slate-400">
              Mostrando {filteredRegistros.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, filteredRegistros.length)} de {filteredRegistros.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Fecha/Hora</th>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Área de Origen</th>
                  <th className="py-3 px-4">Tipo de Residuo</th>
                  <th className="py-3 px-4 text-right">Peso (kg)</th>
                  <th className="py-3 px-4 text-right">Importe ($)</th>
                  <th className="py-3 px-4">Depositante / Chofer</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedRegistros.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No se encontraron ingresos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedRegistros.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-violet-400">#{reg.id}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(reg.fecha_hora_ingreso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {reg.clientes?.razon_social || `Cliente #${reg.cliente_id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{reg.areas?.nombre || `Área #${reg.area_id}`}</span>
                          <span className="text-[10px] text-slate-500">
                            {reg.areas?.categorias_area?.nombre || 'Sin categoría global'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-200 font-medium">
                          {reg.tipos_residuo?.nombre}
                          {reg.tipos_residuo?.requiere_foto && (
                            <span className="text-rose-400 text-[10px]" title="Requiere foto obligatoria">●</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300">
                        {Number(reg.peso).toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-medium">
                        {reg.importe !== null ? `$ ${Number(reg.importe).toLocaleString()}` : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-medium">{reg.depositante_nombre}</span>
                          {reg.depositante_referencia && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                              {reg.depositante_referencia}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {reg.estado === 'completo' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" />
                            Completo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {reg.estado === 'completo' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenFotos(reg.id)}
                            className="py-1 px-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-violet-400" />
                            <span>Ver Fotos</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/operador/generar-magic-link', { state: { registroId: String(reg.id) } })}
                            className="py-1 px-2.5 bg-violet-600/15 text-violet-300 border border-violet-500/30 hover:bg-violet-600/25 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Generar Link</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:text-white transition-colors cursor-pointer"
              >
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:text-white transition-colors cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Modal de Fotos */}
        {modalFotos.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-violet-400" />
                  <h3 className="text-lg font-bold text-white">
                    Evidencia Fotográfica — Ingreso #{modalFotos.registroId}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalFotos({ open: false, registroId: null, urls: [], loading: false })}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalFotos.loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
                  <span className="text-xs text-slate-400">Generando enlaces seguros de visualización...</span>
                </div>
              ) : modalFotos.urls.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No se encontraron fotos adjuntas para este registro en el sistema de almacenamiento.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modalFotos.urls.map((url, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group relative">
                      <img
                        src={url}
                        alt={`Foto de respaldo ${i + 1}`}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 py-1 px-2.5 bg-slate-900/90 text-white rounded-lg text-xs font-semibold backdrop-blur-sm hover:bg-violet-600 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Original</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
