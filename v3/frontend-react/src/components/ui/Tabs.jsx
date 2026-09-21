import React from 'react'
import { cn } from '../../lib/utils'

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div
      className={cn(
        'flex items-center p-1 bg-slate-900/80 border border-slate-800 rounded-2xl gap-1 overflow-x-auto select-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 min-w-max px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2',
              isActive
                ? 'bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded-full font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
