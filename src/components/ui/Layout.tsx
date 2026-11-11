import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useRol } from '../../hooks/useRol'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  Building2, 
  Layers, 
  Map, 
  Trash2, 
  PlusCircle, 
  Link2, 
  BarChart3, 
  LogOut, 
  User,
  Shield,
  Menu,
  X,
  FileText,
  ChevronDown,
  Database,
  ClipboardList,
  Scale,
  BookOpen
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  path: string
  icon: React.ElementType
}

export default function Layout({ children }: LayoutProps) {
  const { role, email, isAdmin, isSupervisorGlobal, isSupervisorCliente, isOperador } = useRol()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Determinar si la ruta actual pertenece a las tablas maestras
  const isMasterDataRoute = [
    '/admin/clientes',
    '/admin/categorias-area',
    '/admin/areas',
    '/admin/tipos-residuo',
    '/admin/patios',
    '/admin/tareas-faena',
    '/admin/codigos-y'
  ].some((path) => location.pathname.startsWith(path))

  const [tablasMaestrasOpen, setTablasMaestrasOpen] = React.useState(isMasterDataRoute)

  React.useEffect(() => {
    if (isMasterDataRoute) {
      setTablasMaestrasOpen(true)
    }
  }, [isMasterDataRoute])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Secciones de Navegación Estructuradas
  const reportItems: NavItem[] = []
  const operacionItems: NavItem[] = []
  const masterItems: NavItem[] = []
  const adminItems: NavItem[] = []
  const helpItems: NavItem[] = [
    { name: 'Manual de Usuario', path: '/manual', icon: BookOpen }
  ]

  // 1. Reportes y Dashboards
  if (isAdmin || isSupervisorGlobal) {
    reportItems.push(
      { name: 'Dashboard Global', path: '/supervisor-global', icon: BarChart3 },
      { name: 'Informe Mensual', path: '/reportes/mensual', icon: FileText }
    )
  } else if (isSupervisorCliente) {
    reportItems.push(
      { name: 'Dashboard Cliente', path: '/supervisor-cliente', icon: BarChart3 },
      { name: 'Informe Mensual', path: '/reportes/mensual', icon: FileText }
    )
  }

  // 2. Operaciones
  if (isAdmin || isSupervisorGlobal || isSupervisorCliente || isOperador) {
    operacionItems.push(
      { name: 'Nuevo Ingreso', path: '/operador/nuevo-ingreso', icon: PlusCircle },
      { name: 'Generar Magic Link', path: '/operador/generar-magic-link', icon: Link2 }
    )
  }

  // 3. Tablas Maestras (Submenú Desplegable)
  if (isAdmin || isSupervisorGlobal) {
    masterItems.push(
      { name: 'Clientes', path: '/admin/clientes', icon: Building2 },
      { name: 'Categorías de Área', path: '/admin/categorias-area', icon: Layers },
      { name: 'Áreas por Cliente', path: '/admin/areas', icon: Map },
      { name: 'Tipos de Residuo', path: '/admin/tipos-residuo', icon: Trash2 },
      { name: 'Patios de Acopio', path: '/admin/patios', icon: Layers },
      { name: 'Tareas de Faena', path: '/admin/tareas-faena', icon: ClipboardList },
      { name: 'Códigos Y (Ley 24.051)', path: '/admin/codigos-y', icon: Scale }
    )
  } else if (isSupervisorCliente) {
    masterItems.push(
      { name: 'Áreas de mi Empresa', path: '/admin/areas', icon: Map },
      { name: 'Patios de Acopio', path: '/admin/patios', icon: Layers },
      { name: 'Tareas de Faena', path: '/admin/tareas-faena', icon: ClipboardList },
      { name: 'Códigos Y (Ley 24.051)', path: '/admin/codigos-y', icon: Scale }
    )
  }

  // 4. Seguridad y Usuarios
  if (isAdmin) {
    adminItems.push(
      { name: 'Usuarios', path: '/admin/usuarios', icon: Users }
    )
  }

  const roleLabels: Record<string, string> = {
    administrador: 'Administrador',
    supervisor_global: 'Sup. Global',
    supervisor_cliente: 'Sup. Cliente',
    operador: 'Operador de Cliente',
    operador_global: 'Operador Global'
  }

  const roleColors: Record<string, string> = {
    administrador: 'from-rose-500/20 to-red-500/20 border-red-500/30 text-red-400',
    supervisor_global: 'from-violet-500/20 to-purple-500/20 border-purple-500/30 text-purple-400',
    supervisor_cliente: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400',
    operador: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    operador_global: 'from-emerald-500/20 to-teal-500/20 border-teal-500/30 text-teal-400'
  }

  const label = role ? roleLabels[role] || role : 'Usuario'
  const badgeClass = role ? roleColors[role] || 'bg-slate-800 text-slate-400' : 'bg-slate-800 text-slate-400'

  // Componente de Renderizado de Enlaces de Menú
  const renderNavLinks = (onItemClick?: () => void) => (
    <div className="space-y-4">
      {/* Reportes & Monitoreo */}
      {reportItems.length > 0 && (
        <div className="space-y-1">
          <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Monitoreo & Reportes
          </div>
          {reportItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' 
                    : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Operaciones */}
      {operacionItems.length > 0 && (
        <div className="space-y-1">
          <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Operaciones
          </div>
          {operacionItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' 
                    : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Tablas Maestras (Desplegable) */}
      {masterItems.length > 0 && (
        <div className="space-y-1">
          <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Configuración
          </div>
          <button
            type="button"
            onClick={() => setTablasMaestrasOpen(!tablasMaestrasOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isMasterDataRoute 
                ? 'bg-slate-800/90 text-white border border-slate-700/80' 
                : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-violet-400" />
              <span>Tablas Maestras</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                {masterItems.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  tablasMaestrasOpen ? 'rotate-180 text-violet-400' : ''
                }`}
              />
            </div>
          </button>

          {/* Submenú desplegable con sangría */}
          {tablasMaestrasOpen && (
            <div className="pl-3 pr-1 pt-1 space-y-1 border-l-2 border-violet-500/30 ml-4 my-1">
              {masterItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onItemClick}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Seguridad & Sistema */}
      {adminItems.length > 0 && (
        <div className="space-y-1">
          <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Seguridad
          </div>
          {adminItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' 
                    : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Ayuda & Documentación */}
      <div className="space-y-1">
        <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
          Documentación
        </div>
        {helpItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' 
                  : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 text-violet-400" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">Smart Waste</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Panel de Control</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 truncate">{email}</p>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border mt-1 bg-gradient-to-r ${badgeClass}`}>
              {label}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">
          {renderNavLinks()}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-4.5 h-4.5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">Smart Waste</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm pt-16">
          <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-slate-800">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">{email}</p>
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 bg-gradient-to-r ${badgeClass}`}>
                  {label}
                </span>
              </div>
            </div>

            <nav className="space-y-4">
              {renderNavLinks(() => setMobileMenuOpen(false))}
            </nav>

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleSignOut()
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4.5 h-4.5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
