import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import ProtectedRoute from '../components/auth/ProtectedRoute'

// Admin pages
import Usuarios from '../pages/admin/Usuarios'
import Clientes from '../pages/admin/Clientes'
import Areas from '../pages/admin/Areas'
import CategoriasArea from '../pages/admin/CategoriasArea'
import TiposResiduo from '../pages/admin/TiposResiduo'
import Patios from '../pages/admin/Patios'
import TareasFaena from '../pages/admin/TareasFaena'
import CodigosY from '../pages/admin/CodigosY'

// Operator pages
import NuevoIngreso from '../pages/operador/NuevoIngreso'
import GenerarMagicLink from '../pages/operador/GenerarMagicLink'

// Supervisor pages
import DashboardGlobal from '../pages/supervisor-global/DashboardGlobal'
import DashboardCliente from '../pages/supervisor-cliente/DashboardCliente'
import ReporteMensual from '../pages/reportes/ReporteMensual'

// Public depositante page
import SubirFotos from '../pages/magic-link/SubirFotos'
import EstablecerPassword from '../pages/EstablecerPassword'

// Manual de Usuario
import UserManual from '../pages/manual/UserManual'

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/establecer-password" element={<EstablecerPassword />} />
      <Route path="/subir-fotos" element={<SubirFotos />} />

      {/* Ruta Intermedia / Redirección */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Módulo Administrador & Supervisión */}
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute allowedRoles={['administrador']}>
            <Usuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clientes"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'supervisor_global']}>
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/areas"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'supervisor_global', 'supervisor_cliente']}>
            <Areas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categorias-area"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'supervisor_global']}>
            <CategoriasArea />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tipos-residuo"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'supervisor_global']}>
            <TiposResiduo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/patios"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'supervisor_global', 'supervisor_cliente']}>
            <Patios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tareas-faena"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'supervisor_global', 'supervisor_cliente']}>
            <TareasFaena />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/codigos-y"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'supervisor_global']}>
            <CodigosY />
          </ProtectedRoute>
        }
      />

      {/* Módulo Operativo (Ingresos y Magic Links) */}
      <Route
        path="/operador/nuevo-ingreso"
        element={
          <ProtectedRoute
            allowedRoles={[
              'administrador',
              'supervisor_global',
              'supervisor_cliente',
              'operador_global',
              'operador',
            ]}
          >
            <NuevoIngreso />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operador/generar-magic-link"
        element={
          <ProtectedRoute
            allowedRoles={[
              'administrador',
              'supervisor_global',
              'supervisor_cliente',
              'operador_global',
              'operador',
            ]}
          >
            <GenerarMagicLink />
          </ProtectedRoute>
        }
      />

      {/* Módulo Supervisor Global */}
      <Route
        path="/supervisor-global"
        element={
          <ProtectedRoute allowedRoles={['supervisor_global', 'administrador']}>
            <DashboardGlobal />
          </ProtectedRoute>
        }
      />

      {/* Módulo Supervisor Cliente */}
      <Route
        path="/supervisor-cliente"
        element={
          <ProtectedRoute allowedRoles={['supervisor_cliente', 'administrador']}>
            <DashboardCliente />
          </ProtectedRoute>
        }
      />

      {/* Módulo de Informes Mensuales (Auditoría Minera / Ley 24.051) */}
      <Route
        path="/reportes/mensual"
        element={
          <ProtectedRoute allowedRoles={['administrador', 'supervisor_global', 'supervisor_cliente']}>
            <ReporteMensual />
          </ProtectedRoute>
        }
      />

      {/* Manual de Usuario (Accesible para todos los roles autenticados) */}
      <Route
        path="/manual"
        element={
          <ProtectedRoute>
            <UserManual />
          </ProtectedRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
