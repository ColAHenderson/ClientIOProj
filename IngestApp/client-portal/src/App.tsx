// src/App.tsx
import React from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ClientDashboardPage from './pages/ClientDashboardPage'
import PractitionerDashboardPage from './pages/PractitionerDashboardPage'

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: Array<'CLIENT' | 'PRACTITIONER' | 'ADMIN'>
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-300">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const App: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight hover:text-sky-400"
          >
            ClientPortal<span className="text-sky-400">.io</span>
          </Link>
          <nav className="flex gap-4 text-sm text-slate-300 items-center">
            <Link className="hover:text-sky-400" to="/">
              Home
            </Link>
            {user?.role === 'CLIENT' && (
              <Link className="hover:text-sky-400" to="/dashboard/client">
                My dashboard
              </Link>
            )}
            {user?.role === 'PRACTITIONER' && (
              <Link className="hover:text-sky-400" to="/dashboard/practitioner">
                Practitioner
              </Link>
            )}
            {!user && (
              <>
                <Link className="hover:text-sky-400" to="/login">
                  Login
                </Link>
                <Link className="hover:text-sky-400" to="/register">
                  Register
                </Link>
              </>
            )}
            {user && (
              <>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {user.firstName} ({user.role.toLowerCase()})
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:border-sky-500"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard/client"
            element={
              <ProtectedRoute roles={['CLIENT']}>
                <ClientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/practitioner"
            element={
              <ProtectedRoute roles={['PRACTITIONER', 'ADMIN']}>
                <PractitionerDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App