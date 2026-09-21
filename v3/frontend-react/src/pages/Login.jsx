import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export function Login() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [email, setEmail] = useState(() => searchParams.get('email') || localStorage.getItem('verify_email') || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [verifiedSuccess, setVerifiedSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerifiedSuccess(true)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setVerifiedSuccess(false)
    setLoading(true)

    try {
      await login(email, password)
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      if (err.status === 403) {
        // Unverified email
        localStorage.setItem('verify_email', email.trim().toLowerCase())
        navigate('/verify-email')
      } else {
        setError(err.message || 'Invalid email or password.')
      }
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
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group select-none mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 50 50" fill="none" className="w-8 h-8">
                <circle cx="25" cy="25" r="22" stroke="white" strokeWidth="2.5" />
                <path d="M15 25 L25 15 L35 25 L25 35 Z" fill="white" />
              </svg>
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-400 mt-1">Sign in to continue your skill exchange journey</p>
        </div>

        {/* Login Card */}
        <Card glow className="p-8">
          {verifiedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Email verified successfully! You can now sign in.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium mb-6 text-left flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="your@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-right mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#00C2FF] hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4 font-bold"
              isLoading={loading}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#6C63FF] hover:underline font-semibold">
              Create an Account
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

export default Login
