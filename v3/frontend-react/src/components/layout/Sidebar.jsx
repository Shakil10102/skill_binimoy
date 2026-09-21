import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { requestService } from '../../services/requestService'
import {
  LayoutDashboard,
  Store,
  ArrowLeftRight,
  CalendarDays,
  MessageSquare,
  User,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '../../lib/utils'

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    let isMounted = true
    const checkPendingRequests = async () => {
      try {
        const res = await requestService.getRequests()
        if (isMounted && res.requests) {
          const count = res.requests.filter((r) => r.status === 'Pending').length
          setPendingCount(count)
        }
      } catch {
        // Silently fail if unauthenticated or error
      }
    }

    if (user) {
      checkPendingRequests()
    }

    return () => {
      isMounted = false
    }
  }, [user])

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Marketplace', path: '/marketplace', icon: Store },
    {
      label: 'Requests',
      path: '/requests',
      icon: ArrowLeftRight,
      badge: pendingCount > 0 ? pendingCount : null
    },
    { label: 'Sessions', path: '/sessions', icon: CalendarDays },
    { label: 'Messages', path: '/chat', icon: MessageSquare },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Admin', path: '/admin', icon: ShieldCheck }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-40 bg-[#0F172A]/95 border-r border-slate-800 flex flex-col transition-all duration-300 backdrop-blur-xl',
          collapsed ? 'w-20' : 'w-64',
          // Mobile responsive slide-over
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="h-18 flex items-center justify-between px-5 border-b border-slate-800/80">
          <NavLink
            to="/dashboard"
            className={cn(
              'flex items-center gap-3 transition-opacity duration-200 overflow-hidden select-none',
              collapsed && 'justify-center w-full'
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center shadow-md shadow-[#6C63FF]/30 flex-shrink-0">
              <svg viewBox="0 0 50 50" fill="none" className="w-6 h-6">
                <circle cx="25" cy="25" r="22" stroke="white" strokeWidth="2.5" />
                <path d="M15 25 L25 15 L35 25 L25 35 Z" fill="white" />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-extrabold text-lg tracking-tight text-white whitespace-nowrap">
                Skill <span className="gradient-text">Binimoy</span>
              </span>
            )}
          </NavLink>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative',
                    isActive
                      ? 'bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] text-white shadow-lg shadow-[#6C63FF]/25 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <div className="relative">
                  <Icon className={cn('w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110')} />
                  {collapsed && item.badge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
