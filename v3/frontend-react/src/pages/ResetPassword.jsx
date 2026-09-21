import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../services/authService'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export function ResetPassword() {
  const [email, setEmail] = useState(() => localStorage.getItem('reset_email') || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail.endsWith('@gmail.com')) {
      setError('Please provide a valid @gmail.com address.')
      return
    }

    if (code.trim().length !== 6) {
      setError('Please enter a valid 6-digit reset code.')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await authService.resetPassword(trimmedEmail, code, newPassword)
      setSuccess(res.message || 'Password successfully reset! Redirecting to login...')
      localStorage.removeItem('reset_email')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Floating Lights */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#6C63FF]/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#00C2FF]/15 rounded-full blur-[130px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <div className="mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 mx-auto mb-3">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reset Password
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Enter the 6-digit code sent to your Gmail and choose a new password.
          </p>
        </div>

        <Card glow className="p-8">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium mb-5 text-left flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-5 flex items-center justify-center gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <Input
              id="resetEmail"
              label="Email Address"
              type="email"
              placeholder="your@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                6-Digit Reset Code
              </label>
              <input
                id="resetCode"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:border-[#00C2FF] focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/20 transition-all"
                required
              />
            </div>

            <Input
              id="newPassword"
              label="New Password"
              type="password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              id="confirmNewPassword"
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-5 font-bold"
              isLoading={loading}
            >
              <span>Reset Password</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Back to{' '}
            <Link to="/login" className="text-[#00C2FF] hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

export default ResetPassword
