import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full glass-card-glow rounded-3xl p-6 sm:p-8 bg-[#1E293B]/95 text-slate-100 shadow-2xl border border-slate-700/80 z-10 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100',
          maxWidth,
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {title && (
          <div className="mb-5 pr-8 text-left">
            <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>,
    document.body
  )
}
