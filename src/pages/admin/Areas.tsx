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
  Map, 
  Plus, 
  Search, 
  Edit3, 
  Power, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  X,
  Building2,
  Layers,
  FilterX,
  AlertTriangle
} from 'lucide-react'

type AreaRow = Database['public']['Tables']['areas']['Row']
type ClienteRow = Database['public']['Tables']['clientes']['Row']
type CategoriaAreaRow = Database['public']['Tables']['categorias_area']['Row']

interface AreaWithRelations extends AreaRow {
  clientes?: { id: number; razon_social: string; activo: boolean | null } | null
  categorias_area?: { id: number; nombre: string; descripcion: string | null; activo: boolean | null } | null
}

interface FormData {
  id?: number
  cliente_id: number | ''
  nombre: string
  categoria_area_id: number | '' | null
  descripcion: string
  activo: boolean
}

export default function Areas() {
  const toast = useToast()
  const { isAdmin, isSupervisorGlobal, isSupervisorCliente, clienteId } = useRol()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems] = useState<AreaWithRelations[]>([])
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [categorias, setCategorias] = useState<CategoriaAreaRow[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [clienteFilter, setClienteFilter] = useState<string>(
    isSupervisorCliente && clienteId ? String(clienteId) : searchParams.get('cliente_id') || 'todos'
  )
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    cliente_id: '',
    nombre: '',
    categoria_area_id: '',
    descripcion: '',
    activo: true,
  })
  const [formErrors, setFormErrors] = useState<{ cliente_id?: string; nombre?: string }>({})
  const [saving, setSaving] = useState(false)

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    item: AreaWithRelations | null
    loading: boolean
  }>({
    isOpen: false,
    item: null,
    loading: false,
  })

  // Sincronizar cliente_id para supervisor de cliente
  useEffect(() => {
    if (isSupervisorCliente && clienteId) {
      setClienteFilter(String(clienteId))
    }
  }, [isSupervisorCliente, clienteId])


  // Sync cliente filter from URL query param if changed
  useEffect(() => {
    const paramClienteId = searchParams.get('cliente_id')
    if (paramClienteId) {
      setClienteFilter(paramClienteId)
    }
  }, [searchParams])

  // Fetch Items and Dropdown Options
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const [areasRes, clientesRes, categoriasRes] = await Promise.all([
        supabase
          .from('areas')
          .select('*, clientes(id, razon_social, activo), categorias_area(id, nombre, descripcion, activo)')
          .order('id', { ascending: true }),
        supabase
          .from('clientes')
          .select('*')
          .order('razon_social', { ascending: true }),
        supabase
          .from('categorias_area')
          .select('*')
          .order('nombre', { ascending: true }),
      ])

      if (areasRes.error) throw areasRes.error
      if (clientesRes.error) throw clientesRes.error
      if (categoriasRes.error) throw categoriasRes.error

      setItems((areasRes.data as AreaWithRelations[]) || [])
      setClientes(clientesRes.data || [])
      setCategorias(categoriasRes.data || [])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar los datos de áreas'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, clienteFilter, categoriaFilter, statusFilter])

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setClienteFilter('todos')
    setCategoriaFilter('todos')
    setStatusFilter('todos')
    setSearchParams({})
  }

  // Filtered & Paginated items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Name search
      const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase().trim())

      // Cliente filter
      const matchesCliente =
        clienteFilter === 'todos' ? true : String(item.cliente_id) === clienteFilter

      // Categoria filter
      let matchesCategoria = true
      if (categoriaFilter === 'sin_categoria') {
        matchesCategoria = item.categoria_area_id === null
      } else if (categoriaFilter !== 'todos') {
        matchesCategoria = String(item.categoria_area_id) === categoriaFilter
      }

      // Status filter
      const matchesStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'activos'
          ? item.activo === true
          : item.activo === false

      return matchesSearch && matchesCliente && matchesCategoria && matchesStatus
    })
  }, [items, searchTerm, clienteFilter, categoriaFilter, statusFilter])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  // Active clientes for dropdown
  const activeClientes = useMemo(() => {
    return clientes.filter((c) => c.activo)
  }, [clientes])

  // Active categorias for dropdown
  const activeCategorias = useMemo(() => {
    return categorias.filter((c) => c.activo)
  }, [categorias])

  // Open Create Modal
  const handleOpenCreate = () => {
    const defaultClient =
      isSupervisorCliente && clienteId
        ? Number(clienteId)
        : clienteFilter !== 'todos'
        ? Number(clienteFilter)
        : ''

    setFormData({
      cliente_id: defaultClient,
      nombre: '',
      categoria_area_id: '',
      descripcion: '',
      activo: true,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const unalignedAreasCount = useMemo(() => {
    return items.filter((a) => a.categoria_area_id === null && a.activo).length
  }, [items])

  // Open Edit Modal
  const handleOpenEdit = (item: AreaWithRelations) => {
    setFormData({
      id: item.id,
      cliente_id: item.cliente_id,
      nombre: item.nombre,
      categoria_area_id: item.categoria_area_id ?? '',
      descripcion: item.descripcion || '',
      activo: item.activo ?? true,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Validate Form
  const validateForm = async (): Promise<boolean> => {
    const errors: { cliente_id?: string; nombre?: string } = {}
    const trimmedNombre = formData.nombre.trim()

    if (!formData.cliente_id) {
      errors.cliente_id = 'Debes seleccionar un cliente.'
    }

    if (!trimmedNombre) {
      errors.nombre = 'El nombre del área es requerido.'
    } else if (trimmedNombre.length < 2) {
      errors.nombre = 'El nombre del área debe tener al menos 2 caracteres.'
    } else if (formData.cliente_id) {
      // Uniqueness check: un cliente no puede tener dos áreas con el mismo nombre
      let query = supabase
        .from('areas')
        .select('id')
        .eq('cliente_id', formData.cliente_id)
        .ilike('nombre', trimmedNombre)

      if (formData.id) {
        query = query.neq('id', formData.id)
      }

      const { data, error } = await query
      if (error) {
        errors.nombre = 'Error al validar la unicidad del nombre.'
      } else if (data && data.length > 0) {
        errors.nombre = 'Este cliente ya tiene un área registrada con este nombre.'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save (Create / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const isValid = await validateForm()
      if (!isValid) {
        setSaving(false)
        return
      }

      const catId = formData.categoria_area_id ? Number(formData.categoria_area_id) : null

      if (formData.id) {
        // UPDATE (Notice: client is locked on edit as per requirements)
        const { error } = await supabase
          .from('areas')
          .update({
            nombre: formData.nombre.trim(),
            categoria_area_id: catId,
            descripcion: formData.descripcion.trim() || null,
            activo: formData.activo,
          })
          .eq('id', formData.id)

        if (error) throw error
        toast.success('Área actualizada exitosamente.')
      } else {
        // INSERT
        const { error } = await supabase
          .from('areas')
          .insert({
            cliente_id: Number(formData.cliente_id),
            nombre: formData.nombre.trim(),
            categoria_area_id: catId,
            descripcion: formData.descripcion.trim() || null,
            activo: formData.activo,
          })

        if (error) throw error
        toast.success('Área creada exitosamente.')
      }

      setIsModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el área'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // Toggle Status
  const handleToggleStatus = (item: AreaWithRelations) => {
    setConfirmModal({
      isOpen: true,
      item,
      loading: false,
    })
  }

  const confirmToggleStatus = async () => {
    const item = confirmModal.item
    if (!item) return

    setConfirmModal((prev) => ({ ...prev, loading: true }))
    try {
      const newStatus = !item.activo
      const { error } = await supabase
        .from('areas')
        .update({ activo: newStatus })
        .eq('id', item.id)

      if (error) throw error

      toast.success(
        newStatus
          ? `El área "${item.nombre}" ha sido activada.`
          : `El área "${item.nombre}" ha sido desactivada.`
      )
      setConfirmModal({ isOpen: false, item: null, loading: false })
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado del área'
      toast.error(msg)
      setConfirmModal((prev) => ({ ...prev, loading: false }))
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 shadow-lg shadow-violet-500/10">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {isSupervisorCliente ? 'Áreas de Mi Empresa' : 'Áreas por Cliente'}
              </h2>
              <p className="text-sm text-slate-400">
                {isSupervisorCliente
                  ? 'Sectores y puntos de generación de residuos de su planta o empresa.'
                  : 'Puntos y sectores de generación de residuos asignados a cada cliente.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Área
          </button>
        </div>

        {/* Banner de Áreas sin Alinear (para Admin y Supervisor Global) */}
        {(isAdmin || isSupervisorGlobal) && unalignedAreasCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  {unalignedAreasCount} {unalignedAreasCount === 1 ? 'área activa sin alinear' : 'áreas activas sin alinear'} con una Categoría Global
                </h4>
                <p className="text-xs text-amber-300/80">
                  Asignar una categoría global a cada sector permite que sus residuos se comparen correctamente en el Dashboard Global.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCategoriaFilter('sin_categoria')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
            >
              Ver Áreas sin Categoría
            </button>
          </div>
        )}

        {/* Simultaneous Filters Panel */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              Filtros de Búsqueda
            </span>
            {(searchTerm || clienteFilter !== 'todos' || categoriaFilter !== 'todos' || statusFilter !== 'todos') && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <FilterX className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSupervisorCliente ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
            {/* Search by name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Nombre del Área
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar área..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Filter by Cliente (Solo si no es supervisor de cliente) */}
            {!isSupervisorCliente && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Cliente
                </label>
                <select
                  value={clienteFilter}
                  onChange={(e) => {
                    setClienteFilter(e.target.value)
                    if (e.target.value !== 'todos') {
                      setSearchParams({ cliente_id: e.target.value })
                    } else {
                      setSearchParams({})
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="todos">Todos los clientes</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social} {!c.activo ? '(Inactivo)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter by Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Categoría Global
              </label>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="todos">Todas las categorías</option>
                <option value="sin_categoria">Sin categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre} {!cat.activo ? '(Inactiva)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Estado
              </label>
              <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl w-full justify-between">
                <button
                  type="button"
                  onClick={() => setStatusFilter('todos')}
                  className={`flex-1 py-1 text-center text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === 'todos'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('activos')}
                  className={`flex-1 py-1 text-center text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === 'activos'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Activos
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('inactivos')}
                  className={`flex-1 py-1 text-center text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === 'inactivos'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Inactivos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Cliente</th>
                  <th className="py-3.5 px-4 sm:px-6">Nombre del Área</th>
                  <th className="py-3.5 px-4 sm:px-6">Categoría Global</th>
                  <th className="py-3.5 px-4 sm:px-6">Descripción</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                        <span>Cargando áreas...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No se encontraron áreas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => {
                    const desc = item.descripcion || '—'
                    const clienteName = item.clientes?.razon_social || `Cliente #${item.cliente_id}`
                    const categoria = item.categorias_area

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/90'
                        }`}
                      >
                        <td className="py-4 px-4 sm:px-6 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-violet-400 shrink-0" />
                            <span>{clienteName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-200 font-medium">
                          {item.nombre}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          {categoria ? (
                            <span
                              title={categoria.descripcion || undefined}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20"
                            >
                              {categoria.nombre}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-500 border border-slate-800">
                              Sin categoría
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-400 max-w-xs truncate">
                          {desc}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {item.activo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3.5 h-3.5" />
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                item.activo
                                  ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={item.activo ? 'Desactivar' : 'Activar'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-slate-950/40">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredItems.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Modal Alta / Edición */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formData.id ? 'Editar Área' : 'Nueva Área de Cliente'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definición de punto operativo y vinculación de categoría.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Cliente */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Cliente <span className="text-rose-400">*</span>
                  </label>
                  {formData.id || isSupervisorCliente ? (
                    <div className="px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-400 font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      {clientes.find((c) => c.id === formData.cliente_id)?.razon_social ||
                        `Cliente #${formData.cliente_id}`}
                      <span className="text-xs text-slate-500 ml-auto font-normal">
                        {isSupervisorCliente ? '(Asignado a su empresa)' : '(No editable en modificación)'}
                      </span>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.cliente_id}
                      onChange={(e) => {
                        setFormData({ ...formData, cliente_id: Number(e.target.value) })
                        if (formErrors.cliente_id) setFormErrors({ ...formErrors, cliente_id: undefined })
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      <option value="">Seleccionar cliente...</option>
                      {activeClientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.razon_social}
                        </option>
                      ))}
                    </select>
                  )}
                  {formErrors.cliente_id && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">
                      {formErrors.cliente_id}
                    </p>
                  )}
                </div>

                {/* Nombre del Área */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre del Área <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre: e.target.value })
                      if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: undefined })
                    }}
                    placeholder="Ej: Campamento Norte, Planta 2, Administración..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {formErrors.nombre && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.nombre}</p>
                  )}
                </div>

                {/* Categoría Global */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Categoría Global (Opcional)
                    </label>
                  </div>
                  <select
                    value={formData.categoria_area_id ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoria_area_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="">Sin categoría asignada</option>
                    {activeCategorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre} {cat.descripcion ? `— ${cat.descripcion}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Permite comparación estadística entre clientes en el dashboard global.
                  </p>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalles de ubicación, accesos o indicaciones específicas..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>

                {/* Activo Toggle */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-slate-300">Estado Activo</span>
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-900 bg-slate-900"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {formData.id ? 'Guardar Cambios' : 'Crear Área'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Estado */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={
            confirmModal.item?.activo
              ? `¿Desactivar "${confirmModal.item?.nombre}"?`
              : `¿Activar "${confirmModal.item?.nombre}"?`
          }
          message={
            confirmModal.item?.activo
              ? 'El área quedará inhabilitada para registrar nuevos ingresos de residuos. Podrá reactivarla en cualquier momento.'
              : 'El área volverá a estar habilitada para el registro operativo.'
          }
          confirmText={confirmModal.item?.activo ? 'Desactivar' : 'Activar'}
          variant={confirmModal.item?.activo ? 'warning' : 'primary'}
          loading={confirmModal.loading}
          onConfirm={confirmToggleStatus}
          onCancel={() => setConfirmModal({ isOpen: false, item: null, loading: false })}
        />
      </div>
    </Layout>
  )
}
