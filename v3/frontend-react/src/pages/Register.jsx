import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../services/authService'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Camera, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react'

export function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarBase64, setAvatarBase64] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-700' }
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1

    const levels = [
      { score: 1, label: 'Weak', color: 'bg-red-500 text-red-400' },
      { score: 2, label: 'Fair', color: 'bg-amber-500 text-amber-400' },
      { score: 3, label: 'Good', color: 'bg-blue-500 text-blue-400' },
      { score: 4, label: 'Strong', color: 'bg-emerald-500 text-emerald-400' }
    ]

    return levels[score - 1] || { score: 1, label: 'Weak', color: 'bg-red-500 text-red-400' }
  }

  const strength = getPasswordStrength()

  // Handle avatar upload
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500000) {
      setError('Image size too large. Maximum 500KB allowed.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Strict Gmail check
    const trimmedEmail = email.trim().toLowerCase()
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    if (!gmailRegex.test(trimmedEmail)) {
      setError('Only @gmail.com email addresses are allowed.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!fullName) {
      setError('Please provide your first and last name.')
      return
    }

    setLoading(true)

    try {
      await authService.register(fullName, trimmedEmail, password)
      localStorage.setItem('verify_email', trimmedEmail)
      navigate('/verify-email')
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#6C63FF]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#00C2FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group select-none mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 50 50" fill="none" className="w-8 h-8">
                <circle cx="25" cy="25" r="22" stroke="white" strokeWidth="2.5" />
                <path d="M15 25 L25 15 L35 25 L25 35 Z" fill="white" />
              </svg>
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Your Account
          </h2>
          <p className="text-sm text-slate-400 mt-1">Start exchanging skills with peers today</p>
        </div>

        <Card glow className="p-6 sm:p-8">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div
              onClick={() => document.getElementById('profilePicInput').click()}
              className="w-20 h-20 rounded-full bg-slate-800 border-2 border-dashed border-[#6C63FF]/50 hover:border-[#00C2FF] flex items-center justify-center cursor-pointer overflow-hidden transition-all shadow-md group relative"
              title="Upload profile photo"
            >
              {avatarBase64 ? (
                <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              )}
            </div>
            <input
              id="profilePicInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">Optional profile photo (max 500KB)</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium mb-5 text-left flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="firstName"
                label="First Name"
                placeholder="Firoz"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                id="lastName"
                label="Last Name"
                placeholder="Hasan"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="name@gmail.com"
              helperText="Only verified @gmail.com accounts are permitted"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Strength Meter Bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color.split(' ')[0]}`}
                      style={{ width: `${strength.score * 25}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${strength.color.split(' ')[1]}`}>
                    Strength: {strength.label}
                  </span>
                </div>
              )}
            </div>

            <Input
              id="confirmPassword"
              label="Confirm Password"
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
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6C63FF] hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

export default Register
