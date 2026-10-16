import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
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
  ExternalLink,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'

type ClienteRow = Database['public']['Tables']['clientes']['Row']

interface ClienteWithAreas extends ClienteRow {
  areas?: { id: number; activo: boolean | null }[]
}

interface FormData {
  id?: number
  razon_social: string
  cuit: string
  email_contacto: string
  telefono: string
  activo: boolean
}

// Utility: Clean CUIT digits
function cleanCuit(cuit: string): string {
  return cuit.replace(/\D/g, '')
}

// Utility: Format CUIT XX-XXXXXXXX-X
function formatCuit(cuit: string): string {
  const digits = cleanCuit(cuit)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10, 11)}`
}

// Utility: Validate Argentine CUIT (Modulo 11)
function isValidCuit(cuit: string): boolean {
  const digits = cleanCuit(cuit)
  if (digits.length !== 11) return false

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * multipliers[i]
  }
  const mod = sum % 11
  const verifier = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod
  return parseInt(digits[10], 10) === verifier
}

export default function Clientes() {
  const toast = useToast()
  const navigate = useNavigate()

  const [items, setItems] = useState<ClienteWithAreas[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    razon_social: '',
    cuit: '',
    email_contacto: '',
    telefono: '',
    activo: true,
  })
  const [formErrors, setFormErrors] = useState<{
    razon_social?: string
    cuit?: string
    email_contacto?: string
  }>({})
  const [saving, setSaving] = useState(false)

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    item: ClienteWithAreas | null
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
        .from('clientes')
        .select('*, areas(id, activo)')
        .order('id', { ascending: true })

      if (error) {
        throw error
      }
      setItems((data as ClienteWithAreas[]) || [])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar los clientes'
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
      const cleanTerm = searchTerm.toLowerCase().trim()
      const matchesSearch =
        item.razon_social.toLowerCase().includes(cleanTerm) ||
        item.cuit.includes(cleanTerm) ||
        cleanCuit(item.cuit).includes(cleanCuit(cleanTerm))

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
      razon_social: '',
      cuit: '',
      email_contacto: '',
      telefono: '',
      activo: true,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: ClienteWithAreas) => {
    setFormData({
      id: item.id,
      razon_social: item.razon_social,
      cuit: formatCuit(item.cuit),
      email_contacto: item.email_contacto || '',
      telefono: item.telefono || '',
      activo: item.activo ?? true,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Handle CUIT input change
  const handleCuitChange = (raw: string) => {
    const formatted = formatCuit(raw)
    setFormData((prev) => ({ ...prev, cuit: formatted }))
    if (formErrors.cuit) {
      setFormErrors((prev) => ({ ...prev, cuit: undefined }))
    }
  }

  // Validate Form
  const validateForm = async (): Promise<boolean> => {
    const errors: { razon_social?: string; cuit?: string; email_contacto?: string } = {}
    const trimmedRazon = formData.razon_social.trim()
    const formattedCuit = formatCuit(formData.cuit)
    const digitsCuit = cleanCuit(formData.cuit)

    if (!trimmedRazon) {
      errors.razon_social = 'La Razón Social es requerida.'
    } else if (trimmedRazon.length < 3) {
      errors.razon_social = 'La Razón Social debe tener al menos 3 caracteres.'
    }

    if (!digitsCuit) {
      errors.cuit = 'El CUIT es obligatorio.'
    } else if (digitsCuit.length !== 11) {
      errors.cuit = 'El CUIT debe contener exactamente 11 dígitos numéricos.'
    } else if (!isValidCuit(digitsCuit)) {
      errors.cuit = 'El CUIT ingresado no es válido (dígito verificador incorrecto).'
    } else {
      // Check uniqueness in Supabase
      let query = supabase
        .from('clientes')
        .select('id')
        .or(`cuit.eq.${formattedCuit},cuit.eq.${digitsCuit}`)

      if (formData.id) {
        query = query.neq('id', formData.id)
      }

      const { data, error } = await query
      if (error) {
        errors.cuit = 'Error al verificar la unicidad del CUIT.'
      } else if (data && data.length > 0) {
        errors.cuit = 'Ya existe un cliente registrado con este CUIT.'
      }
    }

    if (formData.email_contacto.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email_contacto.trim())) {
        errors.email_contacto = 'El formato del email de contacto no es válido.'
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

      const cuitToSave = formatCuit(formData.cuit)

      if (formData.id) {
        // UPDATE
        const { error } = await supabase
          .from('clientes')
          .update({
            razon_social: formData.razon_social.trim(),
            cuit: cuitToSave,
            email_contacto: formData.email_contacto.trim() || null,
            telefono: formData.telefono.trim() || null,
            activo: formData.activo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id)

        if (error) throw error
        toast.success('Cliente actualizado exitosamente.')
      } else {
        // INSERT
        const { error } = await supabase
          .from('clientes')
          .insert({
            razon_social: formData.razon_social.trim(),
            cuit: cuitToSave,
            email_contacto: formData.email_contacto.trim() || null,
            telefono: formData.telefono.trim() || null,
            activo: formData.activo,
          })

        if (error) throw error
        toast.success('Cliente registrado exitosamente.')
      }

      setIsModalOpen(false)
      fetchItems()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el cliente'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // Toggle Status
  const handleToggleStatus = (item: ClienteWithAreas) => {
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
        .from('clientes')
        .update({ activo: newStatus, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (error) throw error

      toast.success(
        newStatus
          ? `El cliente "${item.razon_social}" ha sido activado.`
          : `El cliente "${item.razon_social}" ha sido desactivado.`
      )
      setConfirmModal({ isOpen: false, item: null, loading: false })
      fetchItems()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado del cliente'
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
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Clientes
              </h2>
              <p className="text-sm text-slate-400">
                Empresas y entidades con contratos de gestión y tratamiento de residuos.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Razón Social o CUIT..."
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
                  <th className="py-3.5 px-4 sm:px-6">Razón Social</th>
                  <th className="py-3.5 px-4 sm:px-6">CUIT</th>
                  <th className="py-3.5 px-4 sm:px-6">Contacto</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Áreas</th>
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
                        <span>Cargando clientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No se encontraron clientes con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => {
                    const totalAreas = item.areas?.length || 0
                    const formattedCuit = formatCuit(item.cuit)

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/90'
                        }`}
                      >
                        <td className="py-4 px-4 sm:px-6 font-semibold text-white">
                          {item.razon_social}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-300 font-mono text-xs">
                          {formattedCuit}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-400">
                          <div className="space-y-1 text-xs">
                            {item.email_contacto ? (
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                <span>{item.email_contacto}</span>
                              </div>
                            ) : null}
                            {item.telefono ? (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <span>{item.telefono}</span>
                              </div>
                            ) : null}
                            {!item.email_contacto && !item.telefono && (
                              <span className="text-slate-600">Sin contacto</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            <MapPin className="w-3.5 h-3.5 text-violet-400" />
                            {totalAreas}
                          </span>
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
                              onClick={() => navigate(`/admin/areas?cliente_id=${item.id}`)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-semibold transition-colors"
                              title="Ver Áreas del Cliente"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ver Áreas</span>
                            </button>
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
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formData.id ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Datos fiscales y de contacto de la entidad generadora.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Razón Social <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.razon_social}
                    onChange={(e) => {
                      setFormData({ ...formData, razon_social: e.target.value })
                      if (formErrors.razon_social) {
                        setFormErrors({ ...formErrors, razon_social: undefined })
                      }
                    }}
                    placeholder="Ej: Minera Andina S.A., YPF Logística..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {formErrors.razon_social && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">
                      {formErrors.razon_social}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    CUIT <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={formData.cuit}
                    onChange={(e) => handleCuitChange(e.target.value)}
                    placeholder="XX-XXXXXXXX-X"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {formErrors.cuit ? (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.cuit}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Formato argentino con guiones (se formateará automáticamente).
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      value={formData.email_contacto}
                      onChange={(e) => {
                        setFormData({ ...formData, email_contacto: e.target.value })
                        if (formErrors.email_contacto) {
                          setFormErrors({ ...formErrors, email_contacto: undefined })
                        }
                      }}
                      placeholder="contacto@empresa.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    {formErrors.email_contacto && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">
                        {formErrors.email_contacto}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+54 9 11 1234-5678"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

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
                    {formData.id ? 'Guardar Cambios' : 'Crear Cliente'}
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
              ? `¿Desactivar "${confirmModal.item?.razon_social}"?`
              : `¿Activar "${confirmModal.item?.razon_social}"?`
          }
          message={
            confirmModal.item?.activo
              ? 'El cliente quedará inactivo. Sus áreas asociadas y registros históricos permanecerán intactos, pero no se podrán registrar nuevos ingresos.'
              : 'El cliente volverá a estar activo y habilitado para operaciones.'
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
