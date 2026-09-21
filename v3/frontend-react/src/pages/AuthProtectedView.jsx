import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LogOut, ShieldCheck, UserCheck, Sparkles } from 'lucide-react'

export function AuthProtectedView() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#6C63FF]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#00C2FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg relative z-10"
      >
        <Card glow className="p-8 text-center border-slate-800/80">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 mx-auto mb-5">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Protected Route Verified (Phase 2)</span>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Authentication Session Active
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            You have successfully authenticated into Skill Binimoy.
          </p>

          {/* User profile card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center font-bold text-lg text-white shadow-md overflow-hidden">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.full_name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base truncate">{user?.full_name || 'User'}</h3>
                  <Badge variant="verified">Verified</Badge>
                </div>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">User ID</span>
                <span className="font-mono text-slate-300">{user?.id || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Auth Token</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Valid & Synced
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="lg"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Logout</span>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default AuthProtectedView
