import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Layout from '../../components/ui/Layout'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { 
  Trash2, 
  Plus, 
  Search, 
  Edit3, 
  Power, 
  CheckCircle2, 
  XCircle, 
  Camera, 
  Loader2, 
  X 
} from 'lucide-react'

type TipoResiduoRow = Database['public']['Tables']['tipos_residuo']['Row']

interface FormData {
  id?: number
  nombre: string
  descripcion: string
  requiere_foto: boolean
  activo: boolean
}

export default function TiposResiduo() {
  const toast = useToast()

  const [items, setItems] = useState<TipoResiduoRow[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    requiere_foto: false,
    activo: true,
  })
  const [formErrors, setFormErrors] = useState<{ nombre?: string }>({})
  const [saving, setSaving] = useState(false)

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    item: TipoResiduoRow | null
    loading: boolean
  }>({
    isOpen: false,
    item: null,
    loading: false,
  })

  // Fetch Items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tipos_residuo')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        throw error
      }
      setItems(data || [])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar los tipos de residuo'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // Filtered & Paginated items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase().trim())
      const matchesStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'activos'
          ? item.activo === true
          : item.activo === false
      return matchesSearch && matchesStatus
    })
  }, [items, searchTerm, statusFilter])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      requiere_foto: false,
      activo: true,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: TipoResiduoRow) => {
    setFormData({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      requiere_foto: !!item.requiere_foto,
      activo: item.activo ?? true,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Validate Form
  const validateForm = async (): Promise<boolean> => {
    const errors: { nombre?: string } = {}
    const trimmedNombre = formData.nombre.trim()

    if (!trimmedNombre) {
      errors.nombre = 'El nombre es obligatorio.'
    } else if (trimmedNombre.length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres.'
    } else {
      // Check uniqueness in Supabase
      let query = supabase
        .from('tipos_residuo')
        .select('id')
        .ilike('nombre', trimmedNombre)
      
      if (formData.id) {
        query = query.neq('id', formData.id)
      }

      const { data, error } = await query
      if (error) {
        errors.nombre = 'Error al validar el nombre.'
      } else if (data && data.length > 0) {
        errors.nombre = 'Ya existe un tipo de residuo con este nombre.'
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

      if (formData.id) {
        // UPDATE
        const { error } = await supabase
          .from('tipos_residuo')
          .update({
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim() || null,
            requiere_foto: formData.requiere_foto,
            activo: formData.activo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id)

        if (error) throw error
        toast.success('Tipo de residuo actualizado exitosamente.')
      } else {
        // INSERT
        const { error } = await supabase
          .from('tipos_residuo')
          .insert({
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim() || null,
            requiere_foto: formData.requiere_foto,
            activo: formData.activo,
          })

        if (error) throw error
        toast.success('Tipo de residuo creado exitosamente.')
      }

      setIsModalOpen(false)
      fetchItems()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el tipo de residuo'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // Toggle Status (Soft Delete / Activate)
  const handleToggleStatus = (item: TipoResiduoRow) => {
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
        .from('tipos_residuo')
        .update({ activo: newStatus, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (error) throw error

      toast.success(
        newStatus
          ? `El residuo "${item.nombre}" ha sido activado.`
          : `El residuo "${item.nombre}" ha sido desactivado.`
      )
      setConfirmModal({ isOpen: false, item: null, loading: false })
      fetchItems()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el estado'
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
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Tipos de Residuo
              </h2>
              <p className="text-sm text-slate-400">
                Catálogo de residuos admitidos y sus requisitos de control fotográfico.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Tipo de Residuo
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 font-medium">Estado:</span>
            <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'todos'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('activos')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'activos'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setStatusFilter('inactivos')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
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

        {/* Table Container */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Nombre</th>
                  <th className="py-3.5 px-4 sm:px-6">Descripción</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Requiere Foto</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                        <span>Cargando tipos de residuo...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No se encontraron tipos de residuo con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => {
                    const desc = item.descripcion || '—'
                    const isLongDesc = desc.length > 60

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/90'
                        }`}
                      >
                        <td className="py-4 px-4 sm:px-6 font-semibold text-white">
                          {item.nombre}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-400 max-w-xs">
                          {isLongDesc ? (
                            <span title={desc} className="cursor-help border-b border-dashed border-slate-600">
                              {desc.substring(0, 60)}...
                            </span>
                          ) : (
                            desc
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {item.requiere_foto ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Camera className="w-3.5 h-3.5" />
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              No
                            </span>
                          )}
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
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formData.id ? 'Editar Tipo de Residuo' : 'Nuevo Tipo de Residuo'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configuración de características y requerimientos de inspección.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre: e.target.value })
                      if (formErrors.nombre) setFormErrors({})
                    }}
                    placeholder="Ej: Plásticos PET, Metales ferrosos, Cartón..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {formErrors.nombre && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalles sobre clasificación, peso estándar o precauciones..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-slate-300">
                      Requiere Foto Obligatoria
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.requiere_foto}
                      onChange={(e) =>
                        setFormData({ ...formData, requiere_foto: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-900 bg-slate-900"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-800/80">
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
                    {formData.id ? 'Guardar Cambios' : 'Crear Tipo de Residuo'}
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
              ? 'El tipo de residuo dejará de estar disponible para nuevos ingresos en la aplicación de los operadores. Podrá reactivarlo en cualquier momento.'
              : 'El tipo de residuo volverá a estar habilitado para la selección de los operadores.'
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
