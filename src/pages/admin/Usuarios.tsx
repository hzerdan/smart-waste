import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Layout from '../../components/ui/Layout'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Power, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  X,
  Mail,
  Building2,
  Shield,
  FilterX
} from 'lucide-react'

type RoleRow = Database['public']['Tables']['roles']['Row']
type ClienteRow = Database['public']['Tables']['clientes']['Row']

interface AdminUserItem {
  id: string
  nombre_completo: string
  email: string
  rol_id: number | null
  rol_nombre: string | null
  rol_descripcion?: string | null
  cliente_id: number | null
  cliente_nombre: string | null
  activo: boolean | null
  invitacion_pendiente: boolean
  created_at: string | null
}

interface InviteFormData {
  email: string
  nombre_completo: string
  rol_id: number | ''
  cliente_id: number | ''
}

interface EditFormData {
  id: string
  email: string
  nombre_completo: string
  rol_id: number | ''
  cliente_id: number | ''
  activo: boolean
}

export default function Usuarios() {
  const toast = useToast()

  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos' | 'pendientes'>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteData, setInviteData] = useState<InviteFormData>({
    email: '',
    nombre_completo: '',
    rol_id: '',
    cliente_id: '',
  })
  const [inviteErrors, setInviteErrors] = useState<{
    email?: string
    nombre_completo?: string
    rol_id?: string
    cliente_id?: string
  }>({})
  const [inviting, setInviting] = useState(false)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editData, setEditData] = useState<EditFormData>({
    id: '',
    email: '',
    nombre_completo: '',
    rol_id: '',
    cliente_id: '',
    activo: true,
  })
  const [editErrors, setEditErrors] = useState<{
    nombre_completo?: string
    rol_id?: string
    cliente_id?: string
  }>({})
  const [savingEdit, setSavingEdit] = useState(false)

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    user: AdminUserItem | null
    loading: boolean
  }>({
    isOpen: false,
    user: null,
    loading: false,
  })

  // Fetch Users and Catalogs
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch catalogs (roles and clients)
      const [rolesRes, clientesRes] = await Promise.all([
        supabase.from('roles').select('*').order('id', { ascending: true }),
        supabase.from('clientes').select('*').order('razon_social', { ascending: true }),
      ])

      if (rolesRes.data) setRoles(rolesRes.data)
      if (clientesRes.data) setClientes(clientesRes.data)

      // Invoke invite-user edge function with action: 'list'
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('invite-user', {
        body: { action: 'list' },
      })

      if (!edgeError && edgeData?.users) {
        setUsers(edgeData.users)
      } else {
        // Fallback directly to profiles table if edge function fails or during local dev
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select(`
            id,
            nombre_completo,
            email,
            rol_id,
            activo,
            created_at,
            roles(id, nombre, descripcion),
            supervisor_cliente(cliente_id, clientes(id, razon_social))
          `)
          .order('created_at', { ascending: false })

        if (profError) throw profError

        const mapped: AdminUserItem[] = (profData || []).map((p: any) => {
          const supervisorRel = Array.isArray(p.supervisor_cliente)
            ? p.supervisor_cliente[0]
            : p.supervisor_cliente

          return {
            id: p.id,
            nombre_completo: p.nombre_completo,
            email: p.email,
            rol_id: p.rol_id,
            rol_nombre: p.roles?.nombre || null,
            rol_descripcion: p.roles?.descripcion || null,
            cliente_id: supervisorRel?.cliente_id || null,
            cliente_nombre: supervisorRel?.clientes?.razon_social || null,
            activo: p.activo,
            invitacion_pendiente: false,
            created_at: p.created_at,
          }
        })
        setUsers(mapped)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar los usuarios'
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
  }, [searchTerm, roleFilter, statusFilter])

  const handleClearFilters = () => {
    setSearchTerm('')
    setRoleFilter('todos')
    setStatusFilter('todos')
  }

  // Filtered & Paginated users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        u.nombre_completo.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)

      const matchesRole =
        roleFilter === 'todos' ? true : String(u.rol_id) === roleFilter

      let matchesStatus = true
      if (statusFilter === 'activos') {
        matchesStatus = u.activo === true && !u.invitacion_pendiente
      } else if (statusFilter === 'inactivos') {
        matchesStatus = u.activo === false && !u.invitacion_pendiente
      } else if (statusFilter === 'pendientes') {
        matchesStatus = u.invitacion_pendiente === true
      }

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(start, start + itemsPerPage)
  }, [filteredUsers, currentPage, itemsPerPage])

  const activeClientes = useMemo(() => clientes.filter((c) => c.activo), [clientes])

  // Open Invite Modal
  const handleOpenInvite = () => {
    setInviteData({
      email: '',
      nombre_completo: '',
      rol_id: '',
      cliente_id: '',
    })
    setInviteErrors({})
    setIsInviteModalOpen(true)
  }

  // Validate Invite Form
  const validateInvite = (): boolean => {
    const errors: {
      email?: string
      nombre_completo?: string
      rol_id?: string
      cliente_id?: string
    } = {}

    const cleanEmail = inviteData.email.trim()
    const cleanNombre = inviteData.nombre_completo.trim()

    if (!cleanEmail) {
      errors.email = 'El email es obligatorio.'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        errors.email = 'El formato de email no es válido.'
      }
    }

    if (!cleanNombre) {
      errors.nombre_completo = 'El nombre completo es obligatorio.'
    } else if (cleanNombre.length < 3) {
      errors.nombre_completo = 'Debe ingresar al menos 3 caracteres.'
    }

    if (!inviteData.rol_id) {
      errors.rol_id = 'Debes seleccionar un rol para el usuario.'
    } else {
      const selectedRole = roles.find((r) => r.id === Number(inviteData.rol_id))
      if (
        (selectedRole?.nombre === 'supervisor_cliente' || selectedRole?.nombre === 'operador') &&
        !inviteData.cliente_id
      ) {
        errors.cliente_id = 'El cliente asignado es obligatorio para este rol.'
      }
    }

    setInviteErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit Invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateInvite()) return

    setInviting(true)
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          action: 'invite',
          email: inviteData.email.trim(),
          nombre_completo: inviteData.nombre_completo.trim(),
          rol_id: Number(inviteData.rol_id),
          cliente_id: inviteData.cliente_id ? Number(inviteData.cliente_id) : null,
          redirect_to: `${window.location.origin}/establecer-password`,
        },
      })

      if (error) {
        throw new Error(error.message || 'Error al invitar al usuario')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      toast.success(`Invitación enviada con éxito a ${inviteData.email}`)
      setIsInviteModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar invitación'
      toast.error(msg)
    } finally {
      setInviting(false)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUserItem) => {
    setEditData({
      id: user.id,
      email: user.email,
      nombre_completo: user.nombre_completo,
      rol_id: user.rol_id ?? '',
      cliente_id: user.cliente_id ?? '',
      activo: user.activo ?? true,
    })
    setEditErrors({})
    setIsEditModalOpen(true)
  }

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: { nombre_completo?: string; rol_id?: string; cliente_id?: string } = {}
    if (!editData.nombre_completo.trim()) {
      errors.nombre_completo = 'El nombre completo es obligatorio.'
    }
    if (!editData.rol_id) {
      errors.rol_id = 'Debes seleccionar un rol.'
    } else {
      const selectedRole = roles.find((r) => r.id === Number(editData.rol_id))
      if (
        (selectedRole?.nombre === 'supervisor_cliente' || selectedRole?.nombre === 'operador') &&
        !editData.cliente_id
      ) {
        errors.cliente_id = 'El cliente asignado es obligatorio para este rol.'
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    setSavingEdit(true)
    try {
      const roleIdNum = Number(editData.rol_id)

      // 1. Update Profile
      const { error: profError } = await supabase
        .from('profiles')
        .update({
          nombre_completo: editData.nombre_completo.trim(),
          rol_id: roleIdNum,
          activo: editData.activo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editData.id)

      if (profError) throw profError

      // 2. Handle client assignment relations
      const roleName = roles.find((r) => r.id === roleIdNum)?.nombre
      if (roleName === 'supervisor_cliente' && editData.cliente_id) {
        await supabase
          .from('supervisor_cliente')
          .upsert({
            profile_id: editData.id,
            cliente_id: Number(editData.cliente_id),
          })
        await supabase.from('operador_cliente').delete().eq('profile_id', editData.id)
      } else if (roleName === 'operador' && editData.cliente_id) {
        await supabase
          .from('operador_cliente')
          .upsert({
            profile_id: editData.id,
            cliente_id: Number(editData.cliente_id),
          })
        await supabase.from('supervisor_cliente').delete().eq('profile_id', editData.id)
      } else {
        await supabase.from('supervisor_cliente').delete().eq('profile_id', editData.id)
        await supabase.from('operador_cliente').delete().eq('profile_id', editData.id)
      }

      toast.success('Usuario actualizado exitosamente.')
      setIsEditModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el usuario'
      toast.error(msg)
    } finally {
      setSavingEdit(false)
    }
  }

  // Toggle Status
  const handleToggleStatus = (user: AdminUserItem) => {
    setConfirmModal({
      isOpen: true,
      user,
      loading: false,
    })
  }

  const confirmToggleStatus = async () => {
    const user = confirmModal.user
    if (!user) return

    setConfirmModal((prev) => ({ ...prev, loading: true }))
    try {
      const newStatus = !user.activo
      const { error } = await supabase
        .from('profiles')
        .update({ activo: newStatus, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      toast.success(
        newStatus
          ? `El usuario "${user.nombre_completo}" ha sido activado.`
          : `El usuario "${user.nombre_completo}" ha sido desactivado.`
      )
      setConfirmModal({ isOpen: false, user: null, loading: false })
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado'
      toast.error(msg)
      setConfirmModal((prev) => ({ ...prev, loading: false }))
    }
  }

  // Helper: Role badge styling
  const getRoleBadge = (roleName: string | null) => {
    switch (roleName) {
      case 'administrador':
        return {
          label: 'Administrador',
          className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        }
      case 'supervisor_global':
        return {
          label: 'Sup. Global',
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        }
      case 'supervisor_cliente':
        return {
          label: 'Sup. Cliente',
          className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        }
      case 'operador':
        return {
          label: 'Operador de Cliente',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        }
      case 'operador_global':
        return {
          label: 'Operador Global',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        }
      default:
        return {
          label: roleName || 'Sin Rol',
          className: 'bg-slate-800 text-slate-400 border-slate-700',
        }
    }
  }

  const selectedInviteRole = roles.find((r) => r.id === Number(inviteData.rol_id))
  const isInviteClientRequired =
    selectedInviteRole?.nombre === 'supervisor_cliente' || selectedInviteRole?.nombre === 'operador'

  const selectedEditRole = roles.find((r) => r.id === Number(editData.rol_id))
  const isEditClientRequired =
    selectedEditRole?.nombre === 'supervisor_cliente' || selectedEditRole?.nombre === 'operador'

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 shadow-lg shadow-violet-500/10">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Gestión de Usuarios
              </h2>
              <p className="text-sm text-slate-400">
                Control de accesos, roles, asignación de clientes e invitaciones al sistema.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenInvite}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Invitar Usuario
          </button>
        </div>

        {/* Filters */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Filtros de Búsqueda
            </span>
            {(searchTerm || roleFilter !== 'todos' || statusFilter !== 'todos') && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <FilterX className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Nombre o Email
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Filter by Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Rol
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="todos">Todos los roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {getRoleBadge(r.nombre).label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
                <option value="pendientes">Invitación pendiente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Usuario</th>
                  <th className="py-3.5 px-4 sm:px-6">Email</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Rol</th>
                  <th className="py-3.5 px-4 sm:px-6">Cliente Asignado</th>
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
                        <span>Cargando usuarios del sistema...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No se encontraron usuarios con los criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, idx) => {
                    const badge = getRoleBadge(user.rol_nombre)

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/90'
                        }`}
                      >
                        <td className="py-4 px-4 sm:px-6 font-semibold text-white">
                          {user.nombre_completo}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-300 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-400">
                          {user.rol_nombre === 'supervisor_cliente' ? (
                            user.cliente_nombre ? (
                              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{user.cliente_nombre}</span>
                              </div>
                            ) : (
                              <span className="text-amber-400 text-xs italic">
                                Sin cliente asignado
                              </span>
                            )
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {user.invitacion_pendiente ? (
                            <span
                              title="El usuario fue invitado pero aún no estableció su contraseña"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Invitación pendiente
                            </span>
                          ) : user.activo ? (
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
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                              title="Editar rol y perfil"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                user.activo
                                  ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={user.activo ? 'Desactivar' : 'Activar'}
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
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Modal: Invitar Usuario */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Invitar Usuario</h3>
                  <p className="text-xs text-slate-400">
                    Se enviará un correo con un enlace seguro para que el usuario active su acceso.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email del Usuario <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => {
                      setInviteData({ ...inviteData, email: e.target.value })
                      if (inviteErrors.email) setInviteErrors({ ...inviteErrors, email: undefined })
                    }}
                    placeholder="usuario@empresa.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {inviteErrors.email && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{inviteErrors.email}</p>
                  )}
                </div>

                {/* Nombre Completo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre Completo <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteData.nombre_completo}
                    onChange={(e) => {
                      setInviteData({ ...inviteData, nombre_completo: e.target.value })
                      if (inviteErrors.nombre_completo) {
                        setInviteErrors({ ...inviteErrors, nombre_completo: undefined })
                      }
                    }}
                    placeholder="Ej: Laura González"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {inviteErrors.nombre_completo && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">
                      {inviteErrors.nombre_completo}
                    </p>
                  )}
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Rol en el Sistema <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={inviteData.rol_id}
                    onChange={(e) => {
                      setInviteData({
                        ...inviteData,
                        rol_id: Number(e.target.value),
                        cliente_id: '',
                      })
                      if (inviteErrors.rol_id) setInviteErrors({ ...inviteErrors, rol_id: undefined })
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="">Seleccionar rol...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {getRoleBadge(r.nombre).label} {r.descripcion ? `— ${r.descripcion}` : ''}
                      </option>
                    ))}
                  </select>
                  {inviteErrors.rol_id && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{inviteErrors.rol_id}</p>
                  )}
                </div>

                {/* Cliente (Requerido para supervisor_cliente u operador) */}
                {isInviteClientRequired && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-1.5 animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold text-emerald-400 mb-1">
                      Cliente Asignado <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={inviteData.cliente_id}
                      onChange={(e) => {
                        setInviteData({ ...inviteData, cliente_id: Number(e.target.value) })
                        if (inviteErrors.cliente_id) {
                          setInviteErrors({ ...inviteErrors, cliente_id: undefined })
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="">Seleccionar empresa cliente...</option>
                      {activeClientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.razon_social} (CUIT: {c.cuit})
                        </option>
                      ))}
                    </select>
                    {inviteErrors.cliente_id ? (
                      <p className="text-xs text-rose-400 font-medium">
                        {inviteErrors.cliente_id}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        El usuario estará restringido a las operaciones y datos de este cliente.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    disabled={inviting}
                    className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enviar Invitación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Editar Usuario */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Editar Usuario</h3>
                  <p className="text-xs text-slate-400">
                    Modificación de rol, asignaciones y estado de la cuenta.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email (Identificador)
                  </label>
                  <div className="px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-400 font-mono flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{editData.email}</span>
                  </div>
                </div>

                {/* Nombre Completo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre Completo <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.nombre_completo}
                    onChange={(e) => {
                      setEditData({ ...editData, nombre_completo: e.target.value })
                      if (editErrors.nombre_completo) {
                        setEditErrors({ ...editErrors, nombre_completo: undefined })
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {editErrors.nombre_completo && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">
                      {editErrors.nombre_completo}
                    </p>
                  )}
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Rol en el Sistema <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={editData.rol_id}
                    onChange={(e) => {
                      setEditData({
                        ...editData,
                        rol_id: Number(e.target.value),
                        cliente_id: '',
                      })
                      if (editErrors.rol_id) setEditErrors({ ...editErrors, rol_id: undefined })
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="">Seleccionar rol...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {getRoleBadge(r.nombre).label}
                      </option>
                    ))}
                  </select>
                  {editErrors.rol_id && (
                    <p className="text-xs text-rose-400 mt-1 font-medium">{editErrors.rol_id}</p>
                  )}
                </div>

                {/* Cliente (Solo si supervisor_cliente u operador) */}
                {isEditClientRequired && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-1.5 animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold text-emerald-400 mb-1">
                      Cliente Asignado <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={editData.cliente_id}
                      onChange={(e) => {
                        setEditData({ ...editData, cliente_id: Number(e.target.value) })
                        if (editErrors.cliente_id) {
                          setEditErrors({ ...editErrors, cliente_id: undefined })
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="">Seleccionar empresa cliente...</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.razon_social} {!c.activo ? '(Inactivo)' : ''}
                        </option>
                      ))}
                    </select>
                    {editErrors.cliente_id && (
                      <p className="text-xs text-rose-400 font-medium">
                        {editErrors.cliente_id}
                      </p>
                    )}
                  </div>
                )}

                {/* Estado Activo */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-slate-300">Cuenta Activa</span>
                    <input
                      type="checkbox"
                      checked={editData.activo}
                      onChange={(e) => setEditData({ ...editData, activo: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-900 bg-slate-900"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={savingEdit}
                    className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmación de Estado */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={
            confirmModal.user?.activo
              ? `¿Desactivar a "${confirmModal.user?.nombre_completo}"?`
              : `¿Activar a "${confirmModal.user?.nombre_completo}"?`
          }
          message={
            confirmModal.user?.activo
              ? 'El usuario no podrá iniciar sesión en el sistema mientras su cuenta permanezca inactiva.'
              : 'El usuario recuperará el acceso y los permisos asociados a su rol en el sistema.'
          }
          confirmText={confirmModal.user?.activo ? 'Desactivar' : 'Activar'}
          variant={confirmModal.user?.activo ? 'warning' : 'primary'}
          loading={confirmModal.loading}
          onConfirm={confirmToggleStatus}
          onCancel={() => setConfirmModal({ isOpen: false, user: null, loading: false })}
        />
      </div>
    </Layout>
  )
}
