import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, Search, ArrowLeftRight, CalendarPlus, Sparkles } from 'lucide-react'

export function QuickActions({ onOpenAi }) {
  const navigate = useNavigate()

  const actions = [
    {
      label: 'Explore Marketplace',
      desc: 'Browse peer skills',
      icon: Search,
      gradient: 'from-[#6C63FF]/20 to-[#6C63FF]/5',
      border: 'border-[#6C63FF]/30 hover:border-[#6C63FF]/70',
      iconColor: 'text-indigo-400',
      onClick: () => navigate('/marketplace')
    },
    {
      label: 'List New Skill',
      desc: 'Teach or learn',
      icon: PlusCircle,
      gradient: 'from-[#00C2FF]/20 to-[#00C2FF]/5',
      border: 'border-[#00C2FF]/30 hover:border-[#00C2FF]/70',
      iconColor: 'text-cyan-400',
      onClick: () => navigate('/profile')
    },
    {
      label: 'Review Proposals',
      desc: 'Incoming & outgoing',
      icon: ArrowLeftRight,
      gradient: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/30 hover:border-amber-500/70',
      iconColor: 'text-amber-400',
      onClick: () => navigate('/requests')
    },
    {
      label: 'Manage Sessions',
      desc: '20-min video calls',
      icon: CalendarPlus,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/30 hover:border-emerald-500/70',
      iconColor: 'text-emerald-400',
      onClick: () => navigate('/sessions')
    },
    {
      label: 'Ask Binimoy AI',
      desc: 'Learning roadmaps',
      icon: Sparkles,
      gradient: 'from-purple-500/20 to-pink-500/5',
      border: 'border-purple-500/30 hover:border-pink-500/70',
      iconColor: 'text-pink-400',
      onClick: () => {
        if (onOpenAi) {
          onOpenAi()
        } else {
          const btn = document.querySelector('button[title="Binimoy AI Assistant"]')
          if (btn) btn.click()
        }
      }
    }
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon
          return (
            <motion.button
              key={idx}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={act.onClick}
              className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br ${act.gradient} border ${act.border} bg-slate-900/60 backdrop-blur-sm text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-slate-900/80 ${act.iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
                  ↗
                </span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00C2FF] transition-colors leading-snug">
                  {act.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {act.desc}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions
