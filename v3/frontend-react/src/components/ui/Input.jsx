import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export function Input({
  label,
  error,
  type = 'text',
  className,
  id,
  helperText,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const computedType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={computedType}
          className={cn(
            'w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 transition-all duration-200',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            isPassword && 'pr-11',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  )
}
