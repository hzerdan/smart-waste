import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Layout from '../../components/ui/Layout'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { useRol } from '../../hooks/useRol'
import { 
  Plus, 
  Search, 
  Edit3, 
  Power, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  X,
  Scale,
  FilterX
} from 'lucide-react'

type CodigoYRow = Database['public']['Tables']['codigos_y']['Row']

interface FormData {
  id?: number
  codigo: string
  nombre_comun: string
  descripcion_legal: string
  corriente_normativa: string
  activo: boolean
}

export default function CodigosY() {
  const toast = useToast()
  const { isAdmin, isSupervisorGlobal } = useRol()

  const [items, setItems] = useState<CodigoYRow[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estado Modal Formulario
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nombre_comun: '',
    descripcion_legal: '',
    corriente_normativa: 'Convenio de Basilea / Ley 24.051',
    activo: true
  })
  const [formErrors, setFormErrors] = useState<{ codigo?: string; nombre_comun?: string; descripcion_legal?: string }>({})
  const [saving, setSaving] = useState(false)

  // Estado Modal Confirmar Cambio de Estado
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    item: CodigoYRow | null
    loading: boolean
  }>({
    isOpen: false,
    item: null,
    loading: false
  })

  // Cargar Códigos Y
  const fetchCodigosY = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('codigos_y')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar códigos Y')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCodigosY()
  }, [fetchCodigosY])

  // Filtrado en memoria
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nombre_comun.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.descripcion_legal && item.descripcion_legal.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.corriente_normativa && item.corriente_normativa.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'activos' && item.activo) ||
        (statusFilter === 'inactivos' && !item.activo)

      return matchSearch && matchStatus
    })
  }, [items, searchTerm, statusFilter])

  // Paginación
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage])

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  // Manejo de Modal
  const handleOpenCreate = () => {
    setFormData({
      codigo: '',
      nombre_comun: '',
      descripcion_legal: '',
      corriente_normativa: 'Convenio de Basilea / Ley 24.051',
      activo: true
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: CodigoYRow) => {
    setFormData({
      id: item.id,
      codigo: item.codigo,
      nombre_comun: item.nombre_comun,
      descripcion_legal: item.descripcion_legal || '',
      corriente_normativa: item.corriente_normativa || 'Convenio de Basilea / Ley 24.051',
      activo: item.activo
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      codigo: '',
      nombre_comun: '',
      descripcion_legal: '',
      corriente_normativa: 'Convenio de Basilea / Ley 24.051',
      activo: true
    })
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: { codigo?: string; nombre_comun?: string; descripcion_legal?: string } = {}
    if (!formData.codigo.trim()) errors.codigo = 'El código normativo es requerido (ej: Y8)'
    if (!formData.nombre_comun.trim()) errors.nombre_comun = 'El nombre común es requerido'
    if (!formData.descripcion_legal.trim()) errors.descripcion_legal = 'La descripción legal es requerida'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload = {
        codigo: formData.codigo.trim().toUpperCase(),
        nombre_comun: formData.nombre_comun.trim(),
        descripcion_legal: formData.descripcion_legal.trim(),
        corriente_normativa: formData.corriente_normativa.trim() || 'Convenio de Basilea / Ley 24.051',
        activo: formData.activo
      }

      if (formData.id) {
        const { error } = await supabase.from('codigos_y').update(payload).eq('id', formData.id)
        if (error) throw error
        toast.success('Código normativo actualizado exitosamente')
      } else {
        const { error } = await supabase.from('codigos_y').insert(payload)
        if (error) throw error
        toast.success('Código normativo creado exitosamente')
      }

      handleCloseModal()
      fetchCodigosY()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el código normativo')
    } finally {
      setSaving(false)
    }
  }

  // Toggle de estado
  const handleToggleStatus = (item: CodigoYRow) => {
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
        .from('codigos_y')
        .update({ activo: !confirmModal.item.activo })
        .eq('id', confirmModal.item.id)

      if (error) throw error
      toast.success(`Código normativo ${confirmModal.item.activo ? 'desactivado' : 'activado'} correctamente`)
      setConfirmModal({ isOpen: false, item: null, loading: false })
      fetchCodigosY()
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
              <Scale className="w-6 h-6 text-rose-400" />
              Códigos Normativos Y (Ley 24.051 / Basilea)
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Catálogo oficial de corrientes de residuos peligrosos para certificación ambiental e informes mensuales
            </p>
          </div>
          {(isAdmin || isSupervisorGlobal) && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Código Y</span>
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
                placeholder="Buscar por código (ej: Y8), nombre o descripción legal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
              />
            </div>

            {/* Filtro por Estado */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700/80 px-3 py-2 rounded-xl text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-slate-900 text-slate-200">Todos los Estados</option>
              <option value="activos" className="bg-slate-900 text-slate-200">Activos</option>
              <option value="inactivos" className="bg-slate-900 text-slate-200">Inactivos</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('todos')
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition px-2 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Tabla de Códigos Y */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4 text-center w-24">Código</th>
                  <th className="py-3.5 px-4">Denominación Común</th>
                  <th className="py-3.5 px-4">Definición Legal (Ley 24.051)</th>
                  <th className="py-3.5 px-4">Marco Normativo</th>
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
                        <span>Cargando códigos normativos...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                      No se encontraron códigos normativos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/25 inline-block">
                          {item.codigo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.nombre_comun}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 max-w-md">
                        <p className="line-clamp-2 leading-relaxed">{item.descripcion_legal}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {item.corriente_normativa}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.activo ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            Inactivo
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
                                title="Editar código"
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
                                title={item.activo ? 'Desactivar código' : 'Activar código'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
                  <Scale className="w-5 h-5 text-rose-400" />
                  {formData.id ? 'Editar Código Normativo Y' : 'Nuevo Código Normativo Y'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* Código y Nombre Común */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1">Código Y *</label>
                    <input
                      type="text"
                      placeholder="Ej: Y8, Y48"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono focus:border-violet-500 focus:outline-none uppercase"
                    />
                    {formErrors.codigo && (
                      <p className="text-rose-400 text-xs mt-1">{formErrors.codigo}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 text-xs font-semibold block mb-1">Denominación Común *</label>
                    <input
                      type="text"
                      placeholder="Ej: Aceites Usados y Minerales"
                      value={formData.nombre_comun}
                      onChange={(e) => setFormData({ ...formData, nombre_comun: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none"
                    />
                    {formErrors.nombre_comun && (
                      <p className="text-rose-400 text-xs mt-1">{formErrors.nombre_comun}</p>
                    )}
                  </div>
                </div>

                {/* Marco Normativo */}
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1">Marco Normativo</label>
                  <input
                    type="text"
                    value={formData.corriente_normativa}
                    onChange={(e) => setFormData({ ...formData, corriente_normativa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Definición Legal */}
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1">Definición Legal (según Anexo I Ley 24.051) *</label>
                  <textarea
                    rows={4}
                    placeholder="Texto oficial de la normativa que tipifica este desecho peligroso..."
                    value={formData.descripcion_legal}
                    onChange={(e) => setFormData({ ...formData, descripcion_legal: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-violet-500 focus:outline-none leading-relaxed"
                  />
                  {formErrors.descripcion_legal && (
                    <p className="text-rose-400 text-xs mt-1">{formErrors.descripcion_legal}</p>
                  )}
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
                    Código normativo habilitado para asignación a residuos
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
                    <span>{formData.id ? 'Guardar Cambios' : 'Crear Código'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Estado */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.item?.activo ? 'Desactivar Código Normativo' : 'Activar Código Normativo'}
          message={`¿Estás seguro de que deseas ${confirmModal.item?.activo ? 'desactivar' : 'activar'} el código normativo "${confirmModal.item?.codigo} - ${confirmModal.item?.nombre_comun}"?`}
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
