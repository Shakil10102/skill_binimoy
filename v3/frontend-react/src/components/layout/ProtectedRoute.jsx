import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 mb-4 animate-pulse">
          <svg viewBox="0 0 50 50" fill="none" className="w-8 h-8 animate-spin text-white">
            <circle cx="25" cy="25" r="18" stroke="currentColor" strokeWidth="4" strokeDasharray="30 60" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">Verifying authentication session...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
