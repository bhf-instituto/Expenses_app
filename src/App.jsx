import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ToastViewport from './components/ToastViewport.jsx'
import { useIsDesktop } from './hooks/useIsDesktop.js'
import AuthPage from './pages/AuthPage.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'
import MobileCategoryListPage from './pages/mobile/MobileCategoryListPage.jsx'
import MobileCreateCategoryPage from './pages/mobile/MobileCreateCategoryPage.jsx'
import MobileCreateExpensePage from './pages/mobile/MobileCreateExpensePage.jsx'
import MobileCreateProviderPage from './pages/mobile/MobileCreateProviderPage.jsx'
import MobileCreateSetPage from './pages/mobile/MobileCreateSetPage.jsx'
import MobileExpenseTypePage from './pages/mobile/MobileExpenseTypePage.jsx'
import MobileHomeCreatePage from './pages/mobile/MobileHomeCreatePage.jsx'
import MobileSyncPage from './pages/mobile/MobileSyncPage.jsx'
import PWABadge from './PWABadge.jsx'
import './App.css'

function RootRedirect() {
  const { isAuthenticated, bootstrapping } = useAuth()
  const isDesktop = useIsDesktop()

  if (bootstrapping) {
    return (
      <section className="panel">
        <h1>Cargando...</h1>
        <p>Validando tu sesion.</p>
      </section>
    )
  }

  return <Navigate to={isAuthenticated ? (isDesktop ? '/app/desktop' : '/app/crear') : '/login'} replace />
}

function AppRedirect() {
  const isDesktop = useIsDesktop()
  return <Navigate to={isDesktop ? '/app/desktop' : '/app/crear'} replace />
}

function App() {
  return (
    <div className="shell">
      <main className="content">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/app" element={<ProtectedRoute><AppRedirect /></ProtectedRoute>} />
          <Route
            path="/app/desktop"
            element={
              <ProtectedRoute>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/crear"
            element={
              <ProtectedRoute>
                <MobileHomeCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/grupos/nuevo"
            element={
              <ProtectedRoute>
                <MobileCreateSetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/grupos/:setId/tipo-gasto"
            element={
              <ProtectedRoute>
                <MobileExpenseTypePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/grupos/:setId/categorias/:expenseType"
            element={
              <ProtectedRoute>
                <MobileCategoryListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/grupos/:setId/categorias/:expenseType/nueva"
            element={
              <ProtectedRoute>
                <MobileCreateCategoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/grupos/:setId/gastos/nuevo"
            element={
              <ProtectedRoute>
                <MobileCreateExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/grupos/:setId/proveedores/nuevo"
            element={
              <ProtectedRoute>
                <MobileCreateProviderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/sincronizacion"
            element={
              <ProtectedRoute>
                <MobileSyncPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ToastViewport />
      <PWABadge />
    </div>
  )
}

export default App
