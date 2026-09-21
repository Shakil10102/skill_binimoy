import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { Sun, Moon, Menu, X, Sparkles } from 'lucide-react'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-40 w-full glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group select-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center p-0.5 shadow-lg shadow-[#6C63FF]/30 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 50 50" fill="none" className="w-7 h-7">
                <circle cx="25" cy="25" r="22" stroke="white" strokeWidth="2.5" />
                <path d="M15 25 L25 15 L35 25 L25 35 Z" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Skill <span className="gradient-text">Binimoy</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link
              to="/"
              className={`hover:text-white transition-colors ${
                location.pathname === '/' ? 'text-[#00C2FF] font-semibold' : ''
              }`}
            >
              Home
            </Link>
            <a href="/#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="/#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="/#skills" className="hover:text-white transition-colors">
              Popular Skills
            </a>
          </div>

          {/* Action Area (Theme toggle & Auth) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-xl font-semibold"
                >
                  <Sparkles className="w-4 h-4 text-[#00C2FF]" />
                  Dashboard
                </Button>
                <Link to="/profile" className="flex items-center gap-2 group">
                  <Avatar src={user?.profile_image} name={user?.full_name} size="sm" />
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-300 hover:text-white border border-slate-700"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-b border-slate-800 px-6 py-5 space-y-4 animate-fade-in">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-white font-medium"
          >
            Home
          </Link>
          <a
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-white font-medium"
          >
            How It Works
          </a>
          <a
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-white font-medium"
          >
            Features
          </a>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/dashboard')
                  }}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/profile')
                  }}
                >
                  My Profile
                </Button>
                <Button variant="danger" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/login')
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/register')
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
