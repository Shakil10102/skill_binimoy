import React from 'react'
import { cn } from '../../lib/utils'

export function Card({
  children,
  className,
  hover = false,
  glow = false,
  ...props
}) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 text-slate-100 transition-all duration-300',
        hover && 'hover:-translate-y-1 hover:border-[#6C63FF]/40 hover:shadow-xl hover:shadow-[#6C63FF]/10',
        glow && 'glass-card-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={cn('text-lg font-bold text-slate-100 tracking-tight', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-sm text-slate-400', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }) {
  return <div className={cn('space-y-4', className)} {...props}>{children}</div>
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-700/60',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
