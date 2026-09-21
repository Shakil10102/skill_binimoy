import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] text-white hover:opacity-95 shadow-lg shadow-[#6C63FF]/25 hover:shadow-[#6C63FF]/40',
        secondary:
          'bg-slate-800/80 text-slate-100 hover:bg-slate-700/80 border border-slate-700/80',
        outline:
          'border border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF]/10',
        ghost:
          'text-slate-300 hover:text-white hover:bg-slate-800/60',
        danger:
          'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
        success:
          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base rounded-2xl',
        icon: 'h-10 w-10 p-0'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)

export function Button({
  className,
  variant,
  size,
  isLoading = false,
  disabled = false,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
