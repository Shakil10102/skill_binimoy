import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { marketplaceService } from '../services/marketplaceService'
import {
  ArrowRight,
  Sparkles,
  RefreshCw,
  Video,
  ShieldCheck,
  Users,
  Award,
  Zap,
  BookOpen,
  CheckCircle2
} from 'lucide-react'

export function Home() {
  const navigate = useNavigate()
  const [trendingSkills, setTrendingSkills] = useState([])
  const [stats, setStats] = useState({ users: 120, skills: 45, exchanges: 80 })

  useEffect(() => {
    // Fetch live trending skills
    marketplaceService
      .getTrendingSkills()
      .then((data) => {
        if (data.trending && data.trending.length > 0) {
          setTrendingSkills(data.trending.slice(0, 8))
          const totalTeach = data.trending.reduce((acc, curr) => acc + curr.teach_count, 0)
          setStats((prev) => ({
            ...prev,
            skills: data.trending.length,
            exchanges: totalTeach * 2 + 15
          }))
        }
      })
      .catch(() => {})
  }, [])

  const howItWorks = [
    {
      step: '01',
      title: 'List Your Skills',
      description:
        'Share what you are confident teaching (e.g. JavaScript, Guitar, Photography) and what you want to learn.',
      icon: BookOpen,
      gradient: 'from-[#6C63FF] to-indigo-600'
    },
    {
      step: '02',
      title: 'Connect & Propose',
      description:
        'Browse the peer marketplace, discover verified skill partners, and send a direct exchange proposal.',
      icon: RefreshCw,
      gradient: 'from-[#00C2FF] to-blue-600'
    },
    {
      step: '03',
      title: '20-Min Video Exchange',
      description:
        'Hop onto built-in 1-on-1 audio/video calls or scheduled learning sessions. No money, just mutual growth.',
      icon: Video,
      gradient: 'from-emerald-500 to-teal-600'
    }
  ]

  const features = [
    {
      title: '100% Currency-Free',
      description: 'Exchange knowledge directly. Trade 1 hour of Python for 1 hour of UI/UX design.',
      icon: Zap
    },
    {
      title: 'Built-in WebRTC Video Calls',
      description: 'Zero third-party downloads. Instant peer-to-peer audio and video calls right in your browser.',
      icon: Video
    },
    {
      title: 'Binimoy AI Guide',
      description: 'Get instant learning roadmaps and platform assistance powered by Google Gemini AI.',
      icon: Sparkles
    },
    {
      title: 'Verified Gmail Community',
      description: 'Spam-free environment with OTP email verification ensuring genuine peer interactions.',
      icon: ShieldCheck
    }
  ]

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-4 sm:px-8 overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6C63FF]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#00C2FF]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-lg shadow-[#6C63FF]/10 select-none animate-float">
            <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
            <span>The Modern Peer-to-Peer Skill Exchange Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Teach What You Know, <br />
            <span className="gradient-text">Learn What You Need.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 font-normal leading-relaxed">
            Exchange skills directly with curious learners and masters around the world. No fees, no subscriptions — just genuine knowledge sharing.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-base font-bold shadow-xl shadow-[#6C63FF]/30"
              onClick={() => navigate('/marketplace')}
            >
              <span>Explore Skills</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-base font-semibold"
              onClick={() => navigate('/register')}
            >
              Join Skill Binimoy
            </Button>
          </div>

          {/* Platform Metrics */}
          <div className="pt-16 grid grid-cols-3 max-w-2xl mx-auto gap-4 sm:gap-8 border-t border-slate-800/80">
            <div className="space-y-1">
              <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">
                {stats.users}+
              </div>
              <div className="text-xs sm:text-sm text-slate-400">Active Learners</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-4xl font-extrabold text-[#00C2FF] font-mono">
                {stats.skills}+
              </div>
              <div className="text-xs sm:text-sm text-slate-400">Skills Available</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-4xl font-extrabold text-[#6C63FF] font-mono">
                {stats.exchanges}+
              </div>
              <div className="text-xs sm:text-sm text-slate-400">Exchanges Done</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 relative z-10 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#00C2FF]">
              Simple & Transparent
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">How Skill Binimoy Works</h3>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Three straightforward steps to start trading your superpowers with others.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, idx) => {
              const Icon = item.icon
              return (
                <Card key={idx} hover className="relative overflow-hidden group text-left">
                  <div className="text-5xl font-black text-slate-800/80 absolute right-4 top-4 font-mono select-none">
                    {item.step}
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white mb-6 shadow-lg shadow-[#6C63FF]/20 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2.5">{item.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20 px-4 sm:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#6C63FF]">
              Everything Included
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Engineered for Frictionless Exchange
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <Card key={i} hover className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-[#00C2FF] flex items-center justify-center mb-4 border border-slate-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{f.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Popular Skills Showcase */}
      <section id="skills" className="py-20 px-4 sm:px-8 bg-slate-900/50 border-t border-slate-800/60 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-3">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#00C2FF]">
              Trending Topics
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Popular Skills to Exchange</h3>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Join thousands trading high-demand technical and creative abilities every day.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {(trendingSkills.length > 0
              ? trendingSkills
              : [
                  { skill_name: 'React.js' },
                  { skill_name: 'Figma UI/UX' },
                  { skill_name: 'Python' },
                  { skill_name: 'Graphic Design' },
                  { skill_name: 'English Speaking' },
                  { skill_name: 'Video Editing' },
                  { skill_name: 'Digital Marketing' },
                  { skill_name: 'Guitar' }
                ]
            ).map((s, idx) => (
              <button
                key={idx}
                onClick={() => navigate('/marketplace')}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-[#6C63FF]/20 hover:border-[#6C63FF]/50 border border-slate-700/80 text-slate-200 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm"
              >
                🔥 {s.skill_name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-24 px-4 sm:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto glass-card-glow p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-[#6C63FF]/40 space-y-6 relative z-10">
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Swap Knowledge?
          </h3>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
            Create your profile in under 60 seconds and connect with your first skill-sharing partner today.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              className="text-base font-bold px-8 shadow-xl shadow-[#6C63FF]/30"
              onClick={() => navigate('/register')}
            >
              Get Started for Free
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
