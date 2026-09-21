import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Avatar } from '../ui/Avatar'
import { AiChatbot } from '../ai/AiChatbot'
import { IncomingCallDialog } from '../calls/IncomingCallDialog'
import { ActiveCallModal } from '../calls/ActiveCallModal'
import { JitsiMeetingModal } from '../calls/JitsiMeetingModal'
import { Menu, Sun, Moon, Search, Sparkles, Bell } from 'lucide-react'
import { cn } from '../../lib/utils'

export function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Background ambient floating lights */}
      <div className="fixed top-12 left-1/4 w-96 h-96 bg-[#6C63FF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-12 right-1/4 w-96 h-96 bg-[#00C2FF]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Column */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 relative z-10',
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Top Header Navbar */}
        <header className="sticky top-0 z-30 h-18 glass-nav px-4 sm:px-8 flex items-center justify-between gap-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
            {/* Mobile Sidebar Trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, verified peers, exchanges..."
                className="w-full pl-10 pr-12 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none hidden md:inline-block">
                ↵
              </span>
            </form>
          </div>

          {/* Right Header Area: Actions, Theme & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Binimoy AI Quick Hint Pill */}
            <button
              onClick={() => {
                const chatbotBtn = document.querySelector('button[title="Binimoy AI Assistant"]')
                if (chatbotBtn) chatbotBtn.click()
              }}
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#6C63FF]/15 to-[#00C2FF]/15 border border-[#6C63FF]/30 text-xs font-semibold text-slate-200 hover:border-[#00C2FF]/60 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Ask Binimoy AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00C2FF] animate-pulse" />
              <span>Ask Binimoy AI</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Profile Avatar / User Badge */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all select-none group"
              title="View Profile"
            >
              <Avatar src={user?.profile_image} name={user?.full_name || 'User'} size="sm" />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors leading-tight truncate max-w-[120px]">
                  {user?.full_name || 'Member'}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  View Profile →
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Global AI Chatbot Launcher */}
      <AiChatbot />

      {/* Real-time WebRTC & Jitsi Call Dialogs */}
      <IncomingCallDialog />
      <ActiveCallModal />
      <JitsiMeetingModal />
    </div>
  )
}


export default MainLayout
