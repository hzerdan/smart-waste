import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../../components/ui/Layout'
import { supabase } from '../../lib/supabase'
import { useRol } from '../../hooks/useRol'
import { 
  Building2, 
  Calendar, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  Camera, 
  ShieldAlert, 
  Trash2, 
  RefreshCw, 
  X, 
  Eye, 
  TrendingUp, 
  AlertCircle,
  Scale,
  DollarSign,
  MapPin,
  Mail,
  FileBadge
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ClienteInfo {
  id: number
  razon_social: string
  cuit: string
  email_contacto: string | null
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

interface RegistroRaw {
  id: number
  fecha_hora_ingreso: string
  depositante_nombre: string
  depositante_referencia: string | null
  peso: number
  importe: number | null
  observaciones: string | null
  estado: string
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

type MetricMode = 'peso' | 'importe' | 'ingresos'

export default function DashboardCliente() {
  const { clienteId, isAdmin } = useRol()
  const navigate = useNavigate()

  // Selección de cliente activo (fijo para supervisor_cliente, configurable para admin)
  const [activeClienteId, setActiveClienteId] = useState<number | null>(clienteId || null)
  const [availableClientes, setAvailableClientes] = useState<{ id: number; razon_social: string }[]>([])

  // Datos de la empresa
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [tiposResiduo, setTiposResiduo] = useState<TipoResiduo[]>([])
  const [registros, setRegistros] = useState<RegistroRaw[]>([])

  // Filtros
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('30d')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all')
  const [selectedTipoId, setSelectedTipoId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [metricMode, setMetricMode] = useState<MetricMode>('peso')

  // Feedback y estado
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Paginación
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

  // Cargar clientes si es Administrador para permitir elegir vista
  useEffect(() => {
    if (isAdmin) {
      async function loadAllClientes() {
        const { data } = await supabase
          .from('clientes')
          .select('id, razon_social')
          .eq('activo', true)
          .order('razon_social', { ascending: true })

        if (data && data.length > 0) {
          setAvailableClientes(data)
          if (!activeClienteId) {
            setActiveClienteId(data[0].id)
          }
        }
      }
      loadAllClientes()
    } else if (clienteId) {
      setActiveClienteId(clienteId)
    }
  }, [isAdmin, clienteId])

  // Cargar datos de la empresa y sus registros
  const fetchData = async () => {
    if (!activeClienteId) return

    try {
      setLoading(true)
      setErrorMsg(null)

      // 1. Datos de la Empresa
      const { data: cData, error: cErr } = await supabase
        .from('clientes')
        .select('id, razon_social, cuit, email_contacto')
        .eq('id', activeClienteId)
        .single()

      if (cErr) throw cErr
      setClienteInfo(cData)

      // 2. Áreas de la Empresa
      const { data: aData, error: aErr } = await supabase
        .from('areas')
        .select('id, nombre')
        .eq('cliente_id', activeClienteId)
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (aErr) throw aErr
      setAreas(aData || [])

      // 3. Tipos de Residuo
      const { data: tData, error: tErr } = await supabase
        .from('tipos_residuo')
        .select('id, nombre, requiere_foto')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (tErr) throw tErr
      setTiposResiduo(tData || [])

      // 4. Registros de Ingreso de la Empresa
      const { data: rData, error: rErr } = await supabase
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
          area_id,
          areas ( id, nombre, categoria_area_id, categorias_area ( id, nombre ) ),
          tipo_residuo_id,
          tipos_residuo ( id, nombre, requiere_foto )
        `)
        .eq('cliente_id', activeClienteId)
        .order('fecha_hora_ingreso', { ascending: false })

      if (rErr) throw rErr
      setRegistros((rData as any) || [])
    } catch (err: any) {
      setErrorMsg('Error al sincronizar datos del cliente: ' + (err.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeClienteId) {
      fetchData()
    }
  }, [activeClienteId])

  // Filtrado de registros en memoria
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

      // Filtro de área
      if (selectedAreaId !== 'all' && reg.area_id !== parseInt(selectedAreaId)) {
        return false
      }

      // Filtro de tipo de residuo
      if (selectedTipoId !== 'all' && reg.tipo_residuo_id !== parseInt(selectedTipoId)) {
        return false
      }

      // Filtro de búsqueda textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchArea = reg.areas?.nombre.toLowerCase().includes(query)
        const matchResiduo = reg.tipos_residuo?.nombre.toLowerCase().includes(query)
        const matchDepositante = reg.depositante_nombre.toLowerCase().includes(query)
        const matchId = String(reg.id).includes(query)
        if (!matchArea && !matchResiduo && !matchDepositante && !matchId) {
          return false
        }
      }

      return true
    })
  }, [registros, timeRange, selectedAreaId, selectedTipoId, searchQuery])

  // Resetear paginación al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [timeRange, selectedAreaId, selectedTipoId, searchQuery])

  // KPIs Calculados
  const totalIngresos = filteredRegistros.length
  const totalPesoKg = filteredRegistros.reduce((acc, r) => acc + (Number(r.peso) || 0), 0)
  const totalImporte = filteredRegistros.reduce((acc, r) => acc + (Number(r.importe) || 0), 0)
  const completosCount = filteredRegistros.filter(r => r.estado === 'completo').length
  const pendientesCount = filteredRegistros.filter(r => r.estado === 'pendiente').length
  const pctCompletos = totalIngresos > 0 ? Math.round((completosCount / totalIngresos) * 100) : 0
  const residuosPeligrososCount = filteredRegistros.filter(r => r.tipos_residuo?.requiere_foto === true).length
  const activeAreasCount = new Set(filteredRegistros.map(r => r.area_id)).size

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

  // Agrupación 1: Por Área Interna
  const dataByArea = useMemo(() => {
    const counts: { 
      [areaId: number]: { 
        nombre: string
        ingresos: number
        peso: number
        importe: number
        completos: number 
      } 
    } = {}
    
    filteredRegistros.forEach((reg) => {
      const aId = reg.area_id
      const name = reg.areas?.nombre || `Área #${aId}`
      if (!counts[aId]) {
        counts[aId] = { nombre: name, ingresos: 0, peso: 0, importe: 0, completos: 0 }
      }
      counts[aId].ingresos += 1
      counts[aId].peso += Number(reg.peso) || 0
      counts[aId].importe += Number(reg.importe) || 0
      if (reg.estado === 'completo') counts[aId].completos += 1
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

  // Exportar datos a CSV
  const handleExportCSV = () => {
    if (filteredRegistros.length === 0 || !clienteInfo) return

    const headers = [
      'ID Registro',
      'Fecha/Hora',
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
    link.setAttribute('download', `smart_waste_${clienteInfo.razon_social.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Banner de Administrador (para conmutar cliente) */}
        {isAdmin && availableClientes.length > 0 && (
          <div className="p-3.5 bg-violet-950/40 border border-violet-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-violet-300">
              <span className="font-bold uppercase tracking-wider bg-violet-500/20 px-2 py-0.5 rounded text-[10px]">
                Modo Admin
              </span>
              <span>Visualizando el Dashboard de Cliente como:</span>
            </div>
            <select
              value={activeClienteId || ''}
              onChange={(e) => setActiveClienteId(parseInt(e.target.value))}
              className="py-1.5 px-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer font-semibold"
            >
              {availableClientes.map((c) => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
          </div>
        )}

        {/* Encabezado Corporativo del Cliente */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20 shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-extrabold text-white">
                  {clienteInfo?.razon_social || 'Cargando empresa...'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Trazabilidad Activa
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileBadge className="w-3.5 h-3.5 text-slate-500" />
                  CUIT: <strong className="text-slate-300 font-mono">{clienteInfo?.cuit || '—'}</strong>
                </span>
                {clienteInfo?.email_contacto && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {clienteInfo.email_contacto}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {areas.length} áreas registradas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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

        {/* Panel de Filtros */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-violet-400" />
            <span>Filtros de Trazabilidad</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Rango de Tiempo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-violet-400" />
                Período
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

            {/* Selector de Área Interna */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-violet-400" />
                Filtrar por Área
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full py-2 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                <option value="all">Todas las Áreas ({areas.length})</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
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
                value={selectedTipoId}
                onChange={(e) => setSelectedTipoId(e.target.value)}
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
              <p className="text-[10px] text-slate-500 mt-0.5">viajes recibidos</p>
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
              <p className="text-[10px] text-slate-500 mt-0.5">{Math.round(totalPesoKg).toLocaleString()} kg generados</p>
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
              <p className="text-[10px] text-slate-500 mt-0.5">costo estimado</p>
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

          {/* KPI 6: Áreas Activas */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Áreas Activas</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-300">{activeAreasCount}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">de {areas.length} áreas</p>
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
          {/* Gráfico 1: Generación por Área Interna */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-400" />
                <h3 className="text-base font-bold text-white">Generación por Área Interna</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Total: {formatMetricDisplay(grandTotalMetric)}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {dataByArea.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Sin registros en el período</p>
              ) : (
                dataByArea.map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.nombre}</span>
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

        {/* Tabla de Registros de la Empresa */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-0">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Bitácora de Ingresos — {clienteInfo?.razon_social || 'Mi Empresa'}</h3>
              <p className="text-xs text-slate-400">Detalle de material despachado por área, pesaje, chofer y estado de foto.</p>
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
                    <td colSpan={9} className="py-12 text-center text-slate-500">
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
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-semibold">{reg.areas?.nombre || `Área #${reg.area_id}`}</span>
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
