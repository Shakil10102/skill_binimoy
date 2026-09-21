import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyEmail } from './pages/VerifyEmail'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { Marketplace } from './pages/Marketplace'
import { AuthProtectedView } from './pages/AuthProtectedView'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { MainLayout } from './components/layout/MainLayout'
import { FoundationShowcase } from './pages/FoundationShowcase'

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

export function App() {
  return (
    <Routes>
      {/* Root redirect based on auth status */}
      <Route path="/" element={<RootRedirect />} />

      {/* Phase 2 Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Phase 3 Protected Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Phase 4 Protected Marketplace Route */}
      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <Marketplace />
          </ProtectedRoute>
        }
      />

      {/* Auth Verification Test Route */}
      <Route
        path="/auth-check"
        element={
          <ProtectedRoute>
            <AuthProtectedView />
          </ProtectedRoute>
        }
      />

      {/* Phase 1 Foundation Showcase (preserved) */}
      <Route
        path="/foundation"
        element={
          <MainLayout>
            <FoundationShowcase />
          </MainLayout>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
