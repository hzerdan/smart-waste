import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import { useRol } from '../../hooks/useRol'
import {
  BookOpen,
  Search,
  Shield,
  Layers,
  ClipboardList,
  Scale,
  Users,
  FileText,
  Building2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Eye,
  Sliders,
  Sparkles,
  Database,
  Key,
  Copy,
  Check
} from 'lucide-react'

// Definición de tipos para las secciones del manual
interface ManualSection {
  id: string
  title: string
  icon: React.ElementType
  category: string
  content: React.ReactNode
}

export default function UserManual() {
  const { role, isAdmin, isSupervisorGlobal } = useRol()

  // Selector de Rol (para Administradores y Supervisores Globales)
  const [selectedRole, setSelectedRole] = useState<string>(role || 'administrador')
  const [activeSectionId, setActiveSectionId] = useState<string>('intro')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), 2000)
    }
  }

  // Secciones del Manual del Administrador General
  const adminSections: ManualSection[] = useMemo(() => [
    {
      id: 'intro',
      title: 'Introducción & Arquitectura',
      icon: Shield,
      category: 'General',
      content: (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-transparent border border-violet-500/20">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Rol: Administrador General
              </span>
              <span className="text-xs text-slate-400 font-medium">Smart Waste Enterprise v2.5</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Bienvenido al Manual del Administrador
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Como <strong>Administrador General</strong>, tienes acceso irrestricto a la parametrización de tablas maestras, gestión de identidades y accesos, auditoría de métricas de sostenibilidad y certificación de informes mensuales bajo la <strong>Ley 24.051</strong> y el <strong>Convenio de Basilea</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-3">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm mb-1">Arquitectura Multi-Tenant</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada empresa cliente opera aislada mediante políticas RLS (Row Level Security). Como admin, supervisas todo el ecosistema de faenas.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm mb-1">Trazabilidad Inmutable</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Todos los pesajes en balanza, fotos de precintos y manifiestos de transporte quedan registrados con sello de tiempo y auditor de faena.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <Scale className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm mb-1">Cumplimiento Legal</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Catálogo canónico de Corrientes Y (Y8, Y9, Y48, etc.) para emisión de informes oficiales ante autoridades ambientales provinciales y nacionales.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border-l-4 border-l-violet-500 border border-slate-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white block mb-0.5">Estructura del Menú Lateral (Sidebar)</strong>
                El sistema organiza las funciones en cuatro bloques: <strong>Monitoreo & Reportes</strong> (Dashboards e Informes), <strong>Operaciones</strong> (Ingresos y Magic Links), <strong>Tablas Maestras</strong> (Menú desplegable con catálogos) y <strong>Seguridad</strong> (Gestión de Usuarios).
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Dashboard Consolidado',
      icon: Eye,
      category: 'Monitoreo',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-violet-400" />
            Monitoreo en Tiempo Real y KPIs Globales
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            El <strong>Dashboard Global</strong> consolida la generación de residuos de todos los clientes mineros e industriales activos. Permite detectar desvíos operativos y evaluar la eficiencia en la valorización de materiales.
          </p>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-200">Principales Tarjetas de Indicadores (KPIs)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 h-fit">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Generación Total (Toneladas)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Suma de todos los pesajes brutos registrados en balanza en el período seleccionado.</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 h-fit">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Tasa de Reciclaje / Valorización (%)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Porcentaje de residuos reciclables e industriales valorizados sobre la generación total.</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 h-fit">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Residuos Peligrosos (kg / L)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Volumen acumulado de corrientes sujetas a la Ley 24.051 que requieren manifiesto especial.</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 h-fit">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Filtro por Cliente y Fechas</div>
                  <div className="text-xs text-slate-400 mt-0.5">Permite aislar las métricas de una minera en particular (ej. Minera Los Andes o Litio del Norte).</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Acceso Rápido al Dashboard</div>
              <div className="text-xs text-slate-400">Ir al panel analítico consolidado multi-empresa.</div>
            </div>
            <Link
              to="/supervisor-global"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Abrir Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'tablas-maestras',
      title: 'Tablas Maestras & Catálogos',
      icon: Database,
      category: 'Configuración',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Parametrización de Tablas Maestras
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              El submenú <strong>Tablas Maestras</strong> contiene los catálogos fundamentales que alimentan toda la operatoria diaria y los informes normativos.
            </p>
          </div>

          {/* Tarjetas de cada ABM */}
          <div className="space-y-4">
            {/* Clientes y Contratistas */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">1. Clientes (Empresas Mandantes)</h4>
                    <span className="text-[10px] text-slate-400">Razón Social, CUIT, Email y Estado</span>
                  </div>
                </div>
                <Link
                  to="/admin/clientes"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  Gestionar <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Permite dar de alta a cada empresa cliente operada por Smart Waste. Define el identificador único (`cliente_id`) utilizado para aislar áreas, patios, tareas y perfiles de usuarios.
              </p>
            </div>

            {/* Patios de Acopio */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">2. Patios de Acopio en Faena</h4>
                    <span className="text-[10px] text-slate-400">Capacidad m², Tipo (RSU / RRPP), Cliente asignado</span>
                  </div>
                </div>
                <Link
                  to="/admin/patios"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  Gestionar <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Cada faena cuenta con áreas delimitadas para el almacenamiento transitorio de residuos.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div>• <strong>Tipo RSU:</strong> Destinado a residuos sólidos urbanos y asimilables (ej. 500 m²).</div>
                <div>• <strong>Tipo RRPP:</strong> Patio estanco para tambores y bultos de residuos peligrosos (ej. 300 m²).</div>
                <div>• <strong>Impacto:</strong> Los patios activos del cliente son los que se auditan y visualizan en las tarjetas del <em>Informe Mensual</em>.</div>
              </div>
            </div>

            {/* Tareas de Faena */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">3. Tareas Operativas de Faena</h4>
                    <span className="text-[10px] text-slate-400">Categoría, Criticidad, Frecuencia, Cliente asignado</span>
                  </div>
                </div>
                <Link
                  to="/admin/tareas-faena"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  Gestionar <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Estandariza los controles periódicos que ejecuta la cuadrilla ambiental en campamento y frentes de trabajo.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div>• <strong>Ejemplos:</strong> Mantenimiento de diques de contención, rotulado de tambores, control de extintores y orden en patios.</div>
                <div>• <strong>Criticidad:</strong> Baja, Media o Alta (para auditorías de seguridad e higiene).</div>
                <div>• <strong>Frecuencias:</strong> Diaria, Semanal, Quincenal o Mensual.</div>
              </div>
            </div>

            {/* Códigos Y */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">4. Códigos Legales Y (Ley 24.051)</h4>
                    <span className="text-[10px] text-slate-400">Catálogo canónico normativo nacional e internacional</span>
                  </div>
                </div>
                <Link
                  to="/admin/codigos-y"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  Gestionar <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Normaliza la tabla legal del informe mensual. Evita errores humanos de tipeo o valores hardcodeados en el pesaje de residuos peligrosos.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 grid grid-cols-2 gap-2">
                <div>• <strong>Y8:</strong> Residuos de hidrocarburos / agua</div>
                <div>• <strong>Y9:</strong> Mezclas y emulsiones de hidrocarburos</div>
                <div>• <strong>Y12:</strong> Pinturas, lacas y solventes</div>
                <div>• <strong>Y48:</strong> Suelo o sólidos contaminados</div>
              </div>
            </div>

            {/* Tipos de Residuos & Áreas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white">Tipos de Residuo</span>
                  </div>
                  <Link to="/admin/tipos-residuo" className="text-[11px] text-violet-400 hover:underline">Ver ABM</Link>
                </div>
                <p className="text-[11px] text-slate-400">
                  Asocia cada material a su corriente troncal (RSU, Reciclables, Inertes o Peligrosos) y a su código Y respectivo.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Áreas por Cliente</span>
                  </div>
                  <Link to="/admin/areas" className="text-[11px] text-violet-400 hover:underline">Ver ABM</Link>
                </div>
                <p className="text-[11px] text-slate-400">
                  Frentes generadores de cada cliente (ej. Polvorín, Campamento Base, Mantenimiento, Taller Mecánico).
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'usuarios',
      title: 'Usuarios, Roles & Credenciales QA',
      icon: Users,
      category: 'Seguridad',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Matriz de Roles y Accesos
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Como Administrador General eres el único con capacidad de crear nuevos usuarios, cambiar sus estados (activar/inactivar) y asignar los roles del sistema.
          </p>

          {/* Tabla de Roles */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Alcance / Permisos</th>
                  <th className="px-4 py-3">Asignación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                <tr>
                  <td className="px-4 py-3 font-semibold text-rose-400">administrador</td>
                  <td className="px-4 py-3">Control total: Tablas maestras, usuarios, auditoría de informes y operaciones.</td>
                  <td className="px-4 py-3 text-slate-400">Global (Sin restricción)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-purple-400">supervisor_global</td>
                  <td className="px-4 py-3">Visión analítica transversal de todos los clientes. Auditoría de informes mensuales.</td>
                  <td className="px-4 py-3 text-slate-400">Global</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-cyan-400">supervisor_cliente</td>
                  <td className="px-4 py-3">Dashboard e informe mensual exclusivo de su empresa minera. Puede ver áreas y patios de su cliente.</td>
                  <td className="px-4 py-3 text-amber-300 font-medium">Requiere Cliente Obligatorio</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-amber-400">operador</td>
                  <td className="px-4 py-3">Registro de nuevos pesajes, generación de enlaces QR y carga fotográfica de remitos.</td>
                  <td className="px-4 py-3 text-amber-300 font-medium">Requiere Cliente Obligatorio</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-emerald-400">operador_global</td>
                  <td className="px-4 py-3">Operador logístico habilitado para ingresar residuos de cualquier faena o cliente.</td>
                  <td className="px-4 py-3 text-slate-400">Global</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Regla Crítica de Vinculación
            </div>
            Al dar de alta a un <strong>supervisor_cliente</strong> o un <strong>operador</strong>, es obligatorio seleccionar la empresa cliente correspondiente en el formulario. De lo contrario, las políticas de seguridad RLS impedirán que el usuario visualice sus registros e informes.
          </div>

          {/* Cuentas de Prueba & Credenciales QA */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Cuentas de Prueba & Credenciales QA</h4>
                  <p className="text-[11px] text-slate-400">Credenciales activas para pruebas de roles y validación de permisos en QA</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit">
                Clave común pruebas: SW2026
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Usuario / Email</th>
                    <th className="px-4 py-2.5">Contraseña</th>
                    <th className="px-4 py-2.5">Rol</th>
                    <th className="px-4 py-2.5">Cliente Asignado</th>
                    <th className="px-4 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {/* Supervisor Andes */}
                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-white">
                      supervisor.andes@smartwaste.com
                      <div className="text-[10px] font-sans text-slate-400">Martín Palermo</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">SW2026</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-cyan-400">supervisor_cliente</td>
                    <td className="px-4 py-2.5 text-slate-200 font-medium">Minera Los Andes S.A.</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleCopy('supervisor.andes@smartwaste.com')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px]"
                        title="Copiar email"
                      >
                        {copiedText === 'supervisor.andes@smartwaste.com' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Operador Andes */}
                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-white">
                      operador.andes@smartwaste.com
                      <div className="text-[10px] font-sans text-slate-400">Carlos Tevez</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">SW2026</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-amber-400">operador</td>
                    <td className="px-4 py-2.5 text-slate-200 font-medium">Minera Los Andes S.A.</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleCopy('operador.andes@smartwaste.com')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px]"
                        title="Copiar email"
                      >
                        {copiedText === 'operador.andes@smartwaste.com' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Supervisor Litio */}
                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-white">
                      supervisor.litio@smartwaste.com
                      <div className="text-[10px] font-sans text-slate-400">Román Riquelme</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">SW2026</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-cyan-400">supervisor_cliente</td>
                    <td className="px-4 py-2.5 text-slate-200 font-medium">Litio del Norte S.A.</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleCopy('supervisor.litio@smartwaste.com')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px]"
                        title="Copiar email"
                      >
                        {copiedText === 'supervisor.litio@smartwaste.com' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Operador Litio */}
                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-white">
                      operador.litio@smartwaste.com
                      <div className="text-[10px] font-sans text-slate-400">Guillermo Barros</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">SW2026</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-amber-400">operador</td>
                    <td className="px-4 py-2.5 text-slate-200 font-medium">Litio del Norte S.A.</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleCopy('operador.litio@smartwaste.com')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px]"
                        title="Copiar email"
                      >
                        {copiedText === 'operador.litio@smartwaste.com' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Operador Global */}
                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-white">
                      operador.global@smartwaste.com
                      <div className="text-[10px] font-sans text-slate-400">Javier Zanetti</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">SW2026</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-emerald-400">operador_global</td>
                    <td className="px-4 py-2.5 text-slate-400 italic">Transversal / Todas las faenas</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleCopy('operador.global@smartwaste.com')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px]"
                        title="Copiar email"
                      >
                        {copiedText === 'operador.global@smartwaste.com' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Administrador */}
                  <tr className="hover:bg-slate-900/50 transition-colors opacity-80">
                    <td className="px-4 py-2.5 font-mono text-white">
                      admin@smart.waste
                      <div className="text-[10px] font-sans text-slate-400">Administrador General</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] text-slate-400 italic">[Clave de Admin]</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-rose-400">administrador</td>
                    <td className="px-4 py-2.5 text-slate-400">Global</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleCopy('admin@smart.waste')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px]"
                        title="Copiar email"
                      >
                        {copiedText === 'admin@smart.waste' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Administración de Cuentas</div>
              <div className="text-xs text-slate-400">Dar de alta usuarios, reestablecer contraseñas o modificar roles.</div>
            </div>
            <Link
              to="/admin/usuarios"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Ir a Usuarios
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'informes',
      title: 'Informes Mensuales & Auditoría',
      icon: FileText,
      category: 'Auditoría',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Certificación y Auditoría de Informes Mensuales
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            El módulo de <strong>Informe Mensual</strong> genera de forma automática el documento oficial para auditorías ambientales bajo la Ley 24.051. Agrupa el pesaje consolidado, clasificación por corrientes, y el estado de la faena minera.
          </p>

          {/* Pasos de Auditoría */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Flujo de Cierre y Auditoría de un Mes</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs">
                  <strong className="text-white block mb-0.5">Selección de Cliente y Período</strong>
                  Selecciona la empresa cliente (ej. <em>Litio del Norte S.A.</em>) y el mes/año a auditar (ej. <em>Octubre 2026</em>). El sistema consolida automáticamente todos los viajes e ingresos pesados en balanza.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs">
                  <strong className="text-white block mb-0.5">Auditoría de Patios de Acopio en Faena</strong>
                  En la sección de <em>Estado y Capacidad de Patios</em>, puedes ingresar el <strong>% de Capacidad en Uso</strong> al cierre del mes para cada patio activo (RSU y RRPP) junto a observaciones de maniobrabilidad.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs">
                  <strong className="text-white block mb-0.5">Auditoría de Tareas Operativas de Faena</strong>
                  En la sección de <em>Bitácora de Tareas</em>, valida el <strong>% de Cumplimiento</strong> de las inspecciones programadas (limpieza de diques, rotulado de tambores, control de extintores).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  4
                </span>
                <div className="text-xs">
                  <strong className="text-white block mb-0.5">Guardar y Certificar Auditoría</strong>
                  Al hacer clic en el botón <strong>"Auditar / Guardar Métricas de Faena"</strong>, el sistema ejecuta la función `guardar_auditoria_informe_mensual` persistiendo de forma inmutable las métricas en las tablas `informes_patios` e `informes_tareas`.
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white block mb-1">Normalización de Códigos Legales (Y)</strong>
              En la <em>Tabla 1: Generación de Residuos por Corriente y Material</em>, los residuos peligrosos muestran automáticamente su código canónico normalizado (ej. <span className="text-rose-400 font-mono font-bold">Y9</span>, <span className="text-rose-400 font-mono font-bold">Y48</span>), garantizando la validez jurídica del informe ante auditores externos.
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Módulo de Informes Mensuales</div>
              <div className="text-xs text-slate-400">Ver reportes consolidados y registrar auditorías de faena.</div>
            </div>
            <Link
              to="/reportes/mensual"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Ir a Informes
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'operaciones',
      title: 'Trazabilidad & Operatoria en Faena',
      icon: Scale,
      category: 'Operaciones',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-violet-400" />
            Ingresos, Balanza Digital y Magic Links
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Supervisa el flujo completo de captura de datos en terreno, desde la llegada del camión o bulto hasta la disposición final.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Registro de Nuevo Ingreso
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Los operadores registran cada ingreso indicando el cliente, área generadora, tipo de residuo, pesaje (kg o L), bultos y precinto.
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                <div>• Conexión a balanza serial o ingreso manual verificado.</div>
                <div>• Validación automática de corriente y peligrosidad.</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                Magic Link y Evidencia Fotográfica
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Permite a transportistas o generadores subir fotos de remitos, precintos y tambores sin necesidad de tener cuenta de usuario.
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                <div>• Enlace temporal con token criptográfico seguro.</div>
                <div>• Captura directa con cámara de celular en el punto de pesaje.</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'Preguntas Frecuentes & Soporte',
      icon: HelpCircle,
      category: 'Ayuda',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">
            Preguntas Frecuentes del Administrador
          </h3>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <h4 className="text-xs font-bold text-white mb-1">
                ¿Por qué un patio o tarea recién creado no aparece en el informe mensual?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verifica que el patio o la tarea esté asignado al mismo `cliente_id` seleccionado en el selector del informe, y que su estado esté marcado como <strong>Activo</strong>. Los registros inactivos no se auditan en períodos vigentes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <h4 className="text-xs font-bold text-white mb-1">
                ¿Cómo cambio o reestablezco la contraseña de un usuario?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                En el módulo de <strong>Usuarios</strong> (`/admin/usuarios`), puedes editar al usuario o solicitar al administrador técnico el reseteo de clave en Supabase (`auth.users`).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <h4 className="text-xs font-bold text-white mb-1">
                ¿Qué sucede si un informe mensual muestra 0% en la ocupación de patios?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Significa que aún no se ha guardado una auditoría para ese mes en particular. Haz clic en el botón <strong>"Auditar / Guardar Métricas de Faena"</strong> dentro del informe mensual para fijar el porcentaje de ocupación observado en faena.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ], [copiedText])

  // Filtrado de secciones según término de búsqueda
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return adminSections
    const query = searchTerm.toLowerCase()
    return adminSections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(query) ||
        sec.category.toLowerCase().includes(query)
    )
  }, [adminSections, searchTerm])

  const activeSection = useMemo(() => {
    return adminSections.find((sec) => sec.id === activeSectionId) || adminSections[0]
  }, [adminSections, activeSectionId])

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Encabezado Superior */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Manual de Usuario</h1>
                <p className="text-xs text-slate-400">Documentación oficial interactiva y procedimientos operativos</p>
              </div>
            </div>
          </div>

          {/* Selector de Rol (para Administrador y Supervisor Global) */}
          {(isAdmin || isSupervisorGlobal) && (
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 pl-2">Vista de Rol:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-950 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="administrador">Administrador General</option>
                <option value="supervisor_global">Supervisor Global</option>
                <option value="supervisor_cliente">Supervisor de Cliente</option>
                <option value="operador">Operador de Terreno</option>
              </select>
            </div>
          )}
        </div>

        {/* Notificación si se visualiza un rol alternativo en desarrollo */}
        {selectedRole !== 'administrador' && (
          <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/30 flex items-center justify-between text-xs text-violet-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-violet-400 shrink-0" />
              <span>
                Visualizando el manual específico para el rol: <strong>{selectedRole}</strong>. Puedes alternar al manual del Administrador General cuando lo desees.
              </span>
            </div>
            <button
              onClick={() => setSelectedRole('administrador')}
              className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-medium shrink-0 ml-3 transition-colors"
            >
              Volver a Administrador
            </button>
          </div>
        )}

        {/* Layout Principal: Panel Izquierdo (Índice) + Panel Derecho (Contenido) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Panel Izquierdo: Índice y Buscador */}
          <div className="lg:col-span-4 space-y-4">
            {/* Buscador de Temas */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tema en el manual..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Listado de Capítulos / Secciones */}
            <div className="p-2 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Índice de Contenidos ({filteredSections.length})
              </div>

              {filteredSections.map((sec) => {
                const isActive = sec.id === activeSection.id
                const IconComponent = sec.icon
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs truncate">{sec.title}</div>
                        <div className={`text-[10px] truncate ${isActive ? 'text-violet-200' : 'text-slate-500'}`}>
                          {sec.category}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isActive ? 'translate-x-0.5 text-white' : 'text-slate-600'
                    }`} />
                  </button>
                )
              })}

              {filteredSections.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  No se encontraron temas coincidentes con "{searchTerm}".
                </div>
              )}
            </div>

            {/* Banner de Ayuda Rápida */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <HelpCircle className="w-4 h-4 text-violet-400" />
                ¿Necesitas soporte técnico?
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Para solicitar nuevas parametrizaciones o reportar incidencias en faena, contacta al equipo de ingeniería de Smart Waste.
              </p>
            </div>
          </div>

          {/* Panel Derecho: Visor de Contenido del Capítulo Activo */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Capítulo: {activeSection.category}
                </span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <activeSection.icon className="w-5 h-5 text-violet-400" />
                  {activeSection.title}
                </h2>
              </div>
            </div>

            {/* Render del contenido específico */}
            <div className="text-slate-300">
              {activeSection.content}
            </div>

            {/* Navegación al Siguiente Capítulo */}
            <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Manual oficial del Administrador General
              </div>
              {(() => {
                const currentIndex = adminSections.findIndex((s) => s.id === activeSection.id)
                const nextSection = adminSections[currentIndex + 1]
                if (!nextSection) return null
                return (
                  <button
                    onClick={() => setActiveSectionId(nextSection.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Siguiente: {nextSection.title}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
