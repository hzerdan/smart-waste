import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { useRol } from '../../hooks/useRol'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Power, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  X,
  ClipboardList,
  FilterX,
  ArrowUpDown
} from 'lucide-react'

type TareaRow = Database['public']['Tables']['tareas_sitio']['Row']
type ClienteRow = Database['public']['Tables']['clientes']['Row']

interface TareaWithRelations extends TareaRow {
  clientes?: { id: number; razon_social: string; activo: boolean | null } | null
}

interface FormData {
  id?: number
  cliente_id: number | ''
  nombre: string
  categoria: string
  orden: number
  activo: boolean
}

const CATEGORIAS_TAREA = [
  { valor: 'operacion', label: 'Operación & Compactación', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { valor: 'segregacion', label: 'Segregación & Clasificación', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { valor: 'mantenimiento', label: 'Mantenimiento & Orden', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { valor: 'ambiental', label: 'Gestión Ambiental & Remediación', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { valor: 'seguridad', label: 'Seguridad & Contingencias', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { valor: 'otra', label: 'Otras Actividades', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/20' }
]

export default function TareasFaena() {
  const toast = useToast()
  const { isAdmin, isSupervisorGlobal, isSupervisorCliente, clienteId } = useRol()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems] = useState<TareaWithRelations[]>([])
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [clienteFilter, setClienteFilter] = useState<string>(
    isSupervisorCliente && clienteId ? String(clienteId) : searchParams.get('cliente_id') || 'todos'
  )
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Estado Modal Formulario
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    cliente_id: '',
    nombre: '',
    categoria: 'operacion',
    orden: 1,
    activo: true
  })
  const [formErrors, setFormErrors] = useState<{ cliente_id?: string; nombre?: string }>({})
  const [saving, setSaving] = useState(false)

  // Estado Modal Confirmar Cambio de Estado
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    item: TareaWithRelations | null
    loading: boolean
  }>({
    isOpen: false,
    item: null,
    loading: false
  })

  // Sincronizar cliente para supervisor de cliente
  useEffect(() => {
    if (isSupervisorCliente && clienteId) {
      setClienteFilter(String(clienteId))
    }
  }, [isSupervisorCliente, clienteId])

  // Cargar Clientes
  const fetchClientes = useCallback(async () => {
    try {
      let query = supabase.from('clientes').select('*').order('razon_social')
      if (isSupervisorCliente && clienteId) {
        query = query.eq('id', clienteId)
      }
      const { data, error } = await query
      if (error) throw error
      setClientes(data || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar clientes')
    }
  }, [isSupervisorCliente, clienteId, toast])

  // Cargar Tareas
  const fetchTareas = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('tareas_sitio')
        .select(`
          *,
          clientes (id, razon_social, activo)
        `)
        .order('orden', { ascending: true })

      if (isSupervisorCliente && clienteId) {
        query = query.eq('cliente_id', clienteId)
      } else if (clienteFilter !== 'todos') {
        query = query.eq('cliente_id', Number(clienteFilter))
      }

      const { data, error } = await query
      if (error) throw error
      setItems((data as TareaWithRelations[]) || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar tareas')
    } finally {
      setLoading(false)
    }
  }, [clienteFilter, isSupervisorCliente, clienteId, toast])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  useEffect(() => {
    fetchTareas()
  }, [fetchTareas])

  // Filtrado en memoria
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.clientes?.razon_social && item.clientes.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchCategoria = categoriaFilter === 'todos' || item.categoria === categoriaFilter

      const matchStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'activos' && item.activo) ||
        (statusFilter === 'inactivos' && !item.activo)

      return matchSearch && matchCategoria && matchStatus
    })
  }, [items, searchTerm, categoriaFilter, statusFilter])

  // Paginación
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage])

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, clienteFilter, categoriaFilter, statusFilter])

  // Manejo de Modal
  const handleOpenCreate = () => {
    const currentMaxOrden = items.length > 0 ? Math.max(...items.map((i) => i.orden || 0)) : 0
    setFormData({
      cliente_id: clienteFilter !== 'todos' ? Number(clienteFilter) : (clientes[0]?.id || ''),
      nombre: '',
      categoria: 'operacion',
      orden: currentMaxOrden + 1,
      activo: true
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: TareaWithRelations) => {
    setFormData({
      id: item.id,
      cliente_id: item.cliente_id,
      nombre: item.nombre,
      categoria: item.categoria,
      orden: item.orden,
      activo: item.activo
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      cliente_id: '',
      nombre: '',
      categoria: 'operacion',
      orden: 1,
      activo: true
    })
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: { cliente_id?: string; nombre?: string } = {}
    if (!formData.cliente_id) errors.cliente_id = 'Debe seleccionar un cliente'
    if (!formData.nombre.trim()) errors.nombre = 'La descripción de la tarea es requerida'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload = {
        cliente_id: Number(formData.cliente_id),
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        orden: Number(formData.orden) || 1,
        activo: formData.activo,
        updated_at: new Date().toISOString()
      }

      if (formData.id) {
        const { error } = await supabase.from('tareas_sitio').update(payload).eq('id', formData.id)
        if (error) throw error
        toast.success('Tarea actualizada exitosamente')
      } else {
        const { error } = await supabase.from('tareas_sitio').insert(payload)
        if (error) throw error
        toast.success('Tarea creada exitosamente')
      }

      handleCloseModal()
      fetchTareas()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar la tarea')
    } finally {
      setSaving(false)
    }
  }

  // Toggle de estado
  const handleToggleStatus = (item: TareaWithRelations) => {
    setConfirmModal({
      isOpen: true,
      item,
      loading: false
    })
  }

  const handleConfirmToggle = async () => {
    if (!confirmModal.item) return
    setConfirmModal((prev) => ({ ...prev, loading: true }))
    try {
      const { error } = await supabase
        .from('tareas_sitio')
        .update({ activo: !confirmModal.item.activo, updated_at: new Date().toISOString() })
        .eq('id', confirmModal.item.id)

      if (error) throw error
      toast.success(`Tarea ${confirmModal.item.activo ? 'desactivada' : 'activada'} correctamente`)
      setConfirmModal({ isOpen: false, item: null, loading: false })
      fetchTareas()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
      setConfirmModal((prev) => ({ ...prev, loading: false }))
    }
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              Tareas de Faena y Bitácora
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Catálogo de actividades y rutinas operativas en yacimiento para la bitácora mensual de cada cliente
            </p>
          </div>
          {(isAdmin || isSupervisorGlobal) && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tarea</span>
            </button>
          )}
        </div>

        {/* Barra de Filtros */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por descripción de la tarea..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
              />
            </div>

            {/* Selector de Cliente */}
            {(isAdmin || isSupervisorGlobal) && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 px-3 py-2 rounded-xl">
                <Building2 className="w-4 h-4 text-violet-400 shrink-0" />
                <select
                  value={clienteFilter}
                  onChange={(e) => {
                    setClienteFilter(e.target.value)
                    if (e.target.value === 'todos') {
                      searchParams.delete('cliente_id')
                    } else {
                      searchParams.set('cliente_id', e.target.value)
                    }
                    setSearchParams(searchParams)
                  }}
                  className="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  <option value="todos" className="bg-slate-900 text-slate-200">Todos los Clientes</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                      {c.razon_social}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Categoría */}
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 px-3 py-2 rounded-xl text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-slate-900 text-slate-200">Todas las Categorías</option>
              {CATEGORIAS_TAREA.map((c) => (
                <option key={c.valor} value={c.valor} className="bg-slate-900 text-slate-200">
                  {c.label}
                </option>
              ))}
            </select>

            {/* Filtro por Estado */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700/80 px-3 py-2 rounded-xl text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-slate-900 text-slate-200">Todos los Estados</option>
              <option value="activos" className="bg-slate-900 text-slate-200">Activas</option>
              <option value="inactivos" className="bg-slate-900 text-slate-200">Inactivas</option>
            </select>
          </div>

          {(searchTerm || categoriaFilter !== 'todos' || statusFilter !== 'todos' || (clienteFilter !== 'todos' && !isSupervisorCliente)) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoriaFilter('todos')
                setStatusFilter('todos')
                if (!isSupervisorCliente) {
                  setClienteFilter('todos')
                  searchParams.delete('cliente_id')
                  setSearchParams(searchParams)
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition px-2 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Tabla de Tareas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4 text-center w-16">
                    <span className="flex items-center justify-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      Ord.
                    </span>
                  </th>
                  <th className="py-3.5 px-4">Actividad / Tarea Operativa</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                        <span>Cargando tareas de faena...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                      No se encontraron tareas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const catObj = CATEGORIAS_TAREA.find((c) => c.valor === item.categoria)
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                          #{item.orden}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white leading-snug">{item.nombre}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catObj?.badge || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {catObj?.label || item.categoria}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {item.clientes?.razon_social || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.activo ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                              <XCircle className="w-3 h-3" />
                              Inactiva
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {(isAdmin || isSupervisorGlobal) && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                                  title="Editar tarea"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(item)}
                                  className={`p-1.5 rounded-lg transition ${
                                    item.activo
                                      ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                                      : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                                  }`}
                                  title={item.activo ? 'Desactivar tarea' : 'Activar tarea'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {!loading && filteredItems.length > itemsPerPage && (
            <div className="p-4 border-t border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Modal Crear / Editar */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                  {formData.id ? 'Editar Tarea de Faena' : 'Nueva Tarea de Faena'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* Cliente */}
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1">Cliente *</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: Number(e.target.value) })}
                    disabled={isSupervisorCliente || !!formData.id}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none"
                  >
                    <option value="">Seleccione un cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razon_social}
                      </option>
                    ))}
                  </select>
                  {formErrors.cliente_id && (
                    <p className="text-rose-400 text-xs mt-1">{formErrors.cliente_id}</p>
                  )}
                </div>

                {/* Nombre de la Tarea */}
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1">Descripción de la Tarea / Actividad *</label>
                  <textarea
                    rows={3}
                    placeholder="Ej: Recepción, pesaje y carga de RSU en la compactadora..."
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-violet-500 focus:outline-none"
                  />
                  {formErrors.nombre && (
                    <p className="text-rose-400 text-xs mt-1">{formErrors.nombre}</p>
                  )}
                </div>

                {/* Categoría y Orden */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 text-xs font-semibold block mb-1">Categoría Operativa *</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none"
                    >
                      {CATEGORIAS_TAREA.map((c) => (
                        <option key={c.valor} value={c.valor}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1">N° Orden</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.orden}
                      onChange={(e) => setFormData({ ...formData, orden: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Activo Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-700 bg-slate-950"
                  />
                  <label htmlFor="activo" className="text-xs text-slate-300 cursor-pointer">
                    Tarea habilitada para auditorías e informes de faena
                  </label>
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition text-sm flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{formData.id ? 'Guardar Cambios' : 'Crear Tarea'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Estado */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.item?.activo ? 'Desactivar Tarea' : 'Activar Tarea'}
          message={`¿Estás seguro de que deseas ${confirmModal.item?.activo ? 'desactivar' : 'activar'} la tarea "${confirmModal.item?.nombre}"?`}
          confirmText={confirmModal.item?.activo ? 'Desactivar' : 'Activar'}
          variant={confirmModal.item?.activo ? 'danger' : 'primary'}
          loading={confirmModal.loading}
          onConfirm={handleConfirmToggle}
          onCancel={() => setConfirmModal({ isOpen: false, item: null, loading: false })}
        />
      </div>
    </Layout>
  )
}
