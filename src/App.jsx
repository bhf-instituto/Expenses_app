import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ToastViewport from './components/ToastViewport.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import PWABadge from './PWABadge.jsx'
import './App.css'

function RootRedirect() {
  const { isAuthenticated, bootstrapping } = useAuth()

  if (bootstrapping) {
    return (
      <section className="panel">
        <h1>Cargando...</h1>
        <p>Validando tu sesion.</p>
      </section>
    )
  }

  return <Navigate to={isAuthenticated ? '/app' : '/login'} replace />
}

function Navigation() {
  const { isAuthenticated, user, bootstrapping } = useAuth()
  const statusLabel = bootstrapping ? 'Verificando sesion' : isAuthenticated ? 'Conectado' : 'Invitado'
  const userLabel = user?.email ?? '-'

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link className="brand" to={isAuthenticated ? '/app' : '/login'}>
          Expenses App
        </Link>
        <div className="topbar__right">
          <div className="auth-pill">
            <span className={`auth-pill__dot ${isAuthenticated ? 'is-on' : 'is-off'}`} />
            <div className="auth-pill__text">
              <strong>{statusLabel}</strong>
              <small>{userLabel}</small>
            </div>
          </div>
          <nav className="nav">
            {!isAuthenticated && (
              <>
                <NavLink className="nav__link" to="/login">
                  Login
                </NavLink>
                <NavLink className="nav__link" to="/register">
                  Register
                </NavLink>
              </>
            )}
            {isAuthenticated && (
              <NavLink className="nav__link" to="/app">
                App
              </NavLink>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

function App() {
  return (
    <div className="shell">
      <Navigation />
      <main className="content">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardPage />
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
