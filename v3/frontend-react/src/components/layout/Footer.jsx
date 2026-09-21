import React from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-lg text-slate-400 py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        {/* Brand */}
        <div className="space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center">
              <svg viewBox="0 0 50 50" fill="none" className="w-5 h-5">
                <circle cx="25" cy="25" r="22" stroke="white" strokeWidth="2.5" />
                <path d="M15 25 L25 15 L35 25 L25 35 Z" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Skill <span className="gradient-text">Binimoy</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 max-w-sm">
            The modern peer-to-peer skill exchange platform. Teach what you know, learn what you need, without financial barriers.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-400">
          <a href="/#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </a>
          <a href="/#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="/#skills" className="hover:text-white transition-colors">
            Popular Skills
          </a>
          <Link to="/marketplace" className="hover:text-white transition-colors">
            Marketplace
          </Link>
          <Link to="/login" className="hover:text-white transition-colors">
            Sign In
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center md:justify-end gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> for peer learning
          </p>
          <p>&copy; {new Date().getFullYear()} Skill Binimoy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
