import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../services/authService'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ShieldCheck, CheckCircle2, RotateCw, AlertCircle } from 'lucide-react'

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email') || localStorage.getItem('verify_email') || ''

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
  }, [email, navigate])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (code.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.')
      return
    }

    setLoading(true)
    try {
      const res = await authService.verifyEmail(email, code)
      setSuccess(res.message || 'Email verified successfully! Redirecting to login...')
      localStorage.removeItem('verify_email')
      setTimeout(() => {
        navigate('/login?verified=true')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Verification failed. The code may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setError('')
    setSuccess('')
    setResending(true)

    try {
      const res = await authService.resendCode(email)
      setSuccess(res.message || 'New verification code sent to your Gmail.')
      setCooldown(60)
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#6C63FF]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#00C2FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <div className="mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 mx-auto mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verify Your Email
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            We sent a 6-digit code to <strong className="text-white">{email}</strong>
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

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                6-Digit OTP Code
              </label>
              <input
                id="otpCode"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-center text-3xl font-mono tracking-[0.4em] text-white focus:border-[#00C2FF] focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/20 transition-all"
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold"
              isLoading={loading}
            >
              Verify Account
            </Button>
          </form>

          {/* Resend Cooldown Section */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400 space-y-2">
            <p>Didn't receive the email? Check your Spam or Promotion tabs.</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="inline-flex items-center gap-1.5 text-[#00C2FF] hover:underline font-semibold disabled:opacity-50 disabled:no-underline cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Verification Code'}
              </span>
            </button>
          </div>

          <div className="mt-5">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
              Back to Sign In
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default VerifyEmail
