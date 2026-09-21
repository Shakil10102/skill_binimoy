import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import {
  Sparkles,
  Layers,
  Palette,
  CheckCircle2,
  Box,
  Layout,
  Smartphone,
  Monitor,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react'

export function FoundationShowcase() {
  const { theme, toggleTheme, isDark } = useTheme()
  const { user, isAuthenticated } = useAuth()

  // Modal demo state
  const [modalOpen, setModalOpen] = useState(false)

  // Input states for demo
  const [demoText, setDemoText] = useState('')
  const [demoPassword, setDemoPassword] = useState('')
  const [btnLoading, setBtnLoading] = useState(false)

  const handleSimulateLoad = () => {
    setBtnLoading(true)
    setTimeout(() => setBtnLoading(false), 2000)
  }

  return (
    <div className="space-y-10 text-left max-w-6xl mx-auto py-4">
      {/* Hero Badge & Title */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6C63FF]/15 border border-[#6C63FF]/30 text-xs font-semibold text-[#00C2FF]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phase 1: React + Vite + shadcn/ui Foundation</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Skill <span className="gradient-text">Binimoy</span> Design System
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
          Clean frontend foundation with shadcn/ui, Skiper UI registry compatibility, centralized API layer, theme management, and responsive layout primitives.
        </p>
      </div>

      {/* Checklist / Status Card */}
      <Card glow className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Phase 1 Foundation Checklist</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {[
            'React 18 + Vite Scaffolding',
            'shadcn/ui & cva Configured',
            'Skiper UI Registry Verified',
            'React Router Navigation',
            'AuthContext & Session Sync',
            'ThemeContext (Dark/Light)',
            'Centralized API Client',
            'Design Tokens & Glassmorphism',
            'Base Layout & Sidebar Drawer',
            'Reusable Button Component',
            'Reusable Input Component',
            'Reusable Modal Component'
          ].map((task, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{task}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Global Design Tokens */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Palette className="w-5 h-5 text-[#6C63FF]" />
          <h3 className="text-xl font-bold text-white">Global Design Tokens</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: 'Primary Purple', hex: '#6C63FF', bg: 'bg-[#6C63FF]' },
            { name: 'Secondary Cyan', hex: '#00C2FF', bg: 'bg-[#00C2FF]' },
            { name: 'Midnight Slate', hex: '#0F172A', bg: 'bg-[#0F172A]' },
            { name: 'Card Surface', hex: '#1E293B', bg: 'bg-[#1E293B]' },
            { name: 'Border Slate', hex: '#334155', bg: 'bg-[#334155]' },
            { name: 'Success Green', hex: '#10B981', bg: 'bg-[#10B981]' }
          ].map((color, i) => (
            <div
              key={i}
              className="glass-card p-3 rounded-2xl border border-slate-800 flex flex-col gap-2"
            >
              <div className={`h-12 w-full rounded-xl ${color.bg} shadow-inner border border-white/10`} />
              <div>
                <div className="text-xs font-bold text-slate-200 truncate">{color.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{color.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Component Suite Showcase */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Box className="w-5 h-5 text-[#00C2FF]" />
          <h3 className="text-xl font-bold text-white">Reusable Component Primitives</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Button Variants Card */}
          <Card className="p-6 space-y-4">
            <CardHeader className="mb-0">
              <div>
                <CardTitle>Button Primitives</CardTitle>
                <CardDescription>Powered by class-variance-authority & shadcn/ui</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
                <Button
                  variant="primary"
                  isLoading={btnLoading}
                  onClick={handleSimulateLoad}
                >
                  {btnLoading ? 'Processing...' : 'Click for Spinner'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Input Primitives Card */}
          <Card className="p-6 space-y-4">
            <CardHeader className="mb-0">
              <div>
                <CardTitle>Input Primitives</CardTitle>
                <CardDescription>Text, Password with Eye toggle, and Error states</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <Input
                label="Standard Text Input"
                placeholder="Enter skill name..."
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
              />
              <Input
                label="Password with Reveal"
                type="password"
                placeholder="Enter password..."
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
              />
              <Input
                label="Error State Example"
                placeholder="Invalid email"
                defaultValue="invalid@domain"
                error="Only @gmail.com addresses are allowed."
              />
            </CardContent>
          </Card>

          {/* Modal Demo Card */}
          <Card className="p-6 space-y-4">
            <CardHeader className="mb-0">
              <div>
                <CardTitle>Modal Dialog</CardTitle>
                <CardDescription>Accessible backdrop blur with escape key handling</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 mb-4">
                Click below to launch an interactive dialog rendered via React Portal with smooth backdrop blur.
              </p>
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Open Interactive Modal
              </Button>
            </CardContent>
          </Card>

          {/* Badges & Status Card */}
          <Card className="p-6 space-y-4">
            <CardHeader className="mb-0">
              <div>
                <CardTitle>Badge & Tag Variants</CardTitle>
                <CardDescription>Status tags and skill exchange pill labels</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="teach">Teach: React.js</Badge>
                <Badge variant="learn">Learn: UI/UX</Badge>
                <Badge variant="success">Accepted</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="danger">Rejected</Badge>
                <Badge variant="primary">20-Min Session</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Responsive Layout Inspection */}
      <Card className="p-6 sm:p-8 border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <Layout className="w-6 h-6 text-[#6C63FF]" />
          <h3 className="text-lg font-bold text-white">Responsive Layout Foundations</h3>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          The layout seamlessly switches between a collapsible desktop sidebar and a slide-over mobile drawer sheet.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <Monitor className="w-5 h-5 text-[#00C2FF] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">Desktop & Laptop (1024px+)</h4>
              <p className="text-xs text-slate-400 mt-1">
                Collapsible icon-only or expanded navigation bar, fixed top header with profile and theme switchers.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-[#6C63FF] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-white">Mobile & Tablet (320px – 1023px)</h4>
              <p className="text-xs text-slate-400 mt-1">
                Hamburger-triggered backdrop drawer, touch-friendly tap targets, and responsive padding.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Interactive Modal Primitive"
        description="This modal is built with React Portal, backdrop blur, and full keyboard accessibility."
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-300">
            This demonstrates the reusable modal foundation ready for future exchange proposals, profile editing, and scheduling dialogs.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
