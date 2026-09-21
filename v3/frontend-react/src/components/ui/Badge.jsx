import React from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

export function Badge({
  children,
  variant = 'default',
  className,
  onRemove,
  ...props
}) {
  const variants = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700',
    primary: 'bg-[#6C63FF]/15 text-[#8881ff] border-[#6C63FF]/30',
    secondary: 'bg-[#00C2FF]/15 text-[#00C2FF] border-[#00C2FF]/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    teach: 'bg-gradient-to-r from-[#6C63FF]/20 to-[#6C63FF]/10 text-indigo-300 border-[#6C63FF]/40',
    learn: 'bg-gradient-to-r from-[#00C2FF]/20 to-[#00C2FF]/10 text-cyan-300 border-[#00C2FF]/40'
  }

  // Auto-detect variant based on status text
  let computedVariant = variant
  if (typeof children === 'string') {
    const lower = children.toLowerCase()
    if (lower === 'accepted' || lower === 'completed') computedVariant = 'success'
    else if (lower === 'pending' || lower === 'upcoming') computedVariant = 'warning'
    else if (lower === 'rejected' || lower === 'cancelled') computedVariant = 'danger'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all duration-150 select-none',
        variants[computedVariant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:bg-white/10 rounded-full p-0.5 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
