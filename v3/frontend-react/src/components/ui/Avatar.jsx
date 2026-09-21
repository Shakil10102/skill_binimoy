import React from 'react'
import { getInitials, cn } from '../../lib/utils'

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  status = null, // 'online' | 'busy' | null
  ...props
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-28 h-28 text-3xl font-extrabold'
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center select-none shadow-md border-2 border-slate-700/60',
          sizes[size],
          !src && 'bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] text-white',
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-slate-900',
            size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5',
            status === 'online' && 'bg-emerald-500',
            status === 'busy' && 'bg-amber-500'
          )}
        />
      )}
    </div>
  )
}
