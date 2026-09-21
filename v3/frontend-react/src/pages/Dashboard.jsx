import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MainLayout } from '../components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { QuickActions } from '../components/dashboard/QuickActions'
import { Recommendations } from '../components/dashboard/Recommendations'
import { useAuth } from '../context/AuthContext'
import { profileService } from '../services/profileService'
import { marketplaceService } from '../services/marketplaceService'
import { requestService } from '../services/requestService'
import { sessionService } from '../services/sessionService'
import { formatDateTime } from '../lib/dateUtils'
import {
  Users,
  Award,
  ArrowLeftRight,
  CalendarDays,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Video,
  Bot,
  MessageSquare,
  CheckCircle2
} from 'lucide-react'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalUsers: '...',
    mySkills: 0,
    pendingRequests: 0,
    upcomingSessions: 0
  })

  const [currentUserProfile, setCurrentUserProfile] = useState(user)
  const [allUsers, setAllUsers] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [trendingSkills, setTrendingSkills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async () => {
      try {
        const [profileRes, usersRes, requestsRes, sessionsRes, trendingRes] =
          await Promise.allSettled([
            profileService.getProfile(),
            marketplaceService.getAllUsers(),
            requestService.getRequests(),
            sessionService.getSessions(),
            marketplaceService.getTrendingSkills()
          ])

        if (!isMounted) return

        // 1. User Profile & Skills
        let mySkillCount = 0
        if (profileRes.status === 'fulfilled' && profileRes.value?.user) {
          const u = profileRes.value.user
          setCurrentUserProfile(u)
          const teachCount = (u.skills_teach || []).length
          const learnCount = (u.skills_learn || []).length
          mySkillCount = teachCount + learnCount
        }

        // 2. All Users
        let totalUsersCount = 1
        if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
          const uList = usersRes.value.users
          setAllUsers(uList)
          totalUsersCount = uList.length + 1
        }

        // 3. Requests Feed
        let pendingCount = 0
        if (requestsRes.status === 'fulfilled' && requestsRes.value?.requests) {
          const reqs = requestsRes.value.requests
          pendingCount = reqs.filter((r) => r.status === 'Pending').length
          setRecentRequests(reqs.slice(0, 4))
        }

        // 4. Upcoming Sessions Feed
        let upcomingCount = 0
        if (sessionsRes.status === 'fulfilled' && sessionsRes.value?.sessions) {
          const sess = sessionsRes.value.sessions
          const up = sess.filter((s) => s.status === 'Upcoming')
          upcomingCount = up.length
          setUpcomingSessions(up.slice(0, 4))
        }

        // 5. Trending Skills
        if (trendingRes.status === 'fulfilled' && trendingRes.value?.trending) {
          setTrendingSkills(trendingRes.value.trending.slice(0, 6))
        }

        setStats({
          totalUsers: totalUsersCount,
          mySkills: mySkillCount,
          pendingRequests: pendingCount,
          upcomingSessions: upcomingCount
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleOpenAi = (promptText = '') => {
    const aiBtn = document.querySelector('button[title="Binimoy AI Assistant"]')
    if (aiBtn) {
      aiBtn.click()
      if (promptText) {
        setTimeout(() => {
          const textarea = document.querySelector('input[placeholder*="Ask Binimoy AI"]')
          if (textarea) {
            textarea.value = promptText
            textarea.focus()
          }
        }, 150)
      }
    }
  }

  const firstName = currentUserProfile?.full_name
    ? currentUserProfile.full_name.split(' ')[0]
    : user?.full_name?.split(' ')[0] || 'Member'

  const statCards = [
    {
      title: 'Community Members',
      value: stats.totalUsers,
      sub: 'Verified skill partners',
      icon: Users,
      gradient: 'from-[#6C63FF]/20 to-[#6C63FF]/5',
      textColor: 'text-indigo-400',
      borderColor: 'border-[#6C63FF]/30 hover:border-[#6C63FF]/60'
    },
    {
      title: 'My Listed Skills',
      value: stats.mySkills,
      sub: 'Teach & learn capabilities',
      icon: Award,
      gradient: 'from-[#00C2FF]/20 to-[#00C2FF]/5',
      textColor: 'text-cyan-400',
      borderColor: 'border-[#00C2FF]/30 hover:border-[#00C2FF]/60'
    },
    {
      title: 'Pending Proposals',
      value: stats.pendingRequests,
      sub: 'Exchange requests to review',
      icon: ArrowLeftRight,
      gradient: 'from-amber-500/20 to-amber-500/5',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30 hover:border-amber-500/60'
    },
    {
      title: 'Upcoming Sessions',
      value: stats.upcomingSessions,
      sub: 'Scheduled 20-min calls',
      icon: CalendarDays,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  }

  return (
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left"
      >
        {/* Hero Welcome Banner */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-6 sm:p-8 rounded-3xl border border-slate-700/60 relative overflow-hidden"
        >
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Skill Binimoy Community Live</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Welcome Back, {firstName}!</span>
              <Sparkles className="w-5 h-5 text-[#00C2FF] animate-pulse" />
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Here is what is happening across your skill exchanges, pending proposals, and upcoming learning sessions today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleOpenAi()}
              className="border-[#6C63FF]/40 hover:border-[#6C63FF] text-slate-200 flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-[#6C63FF]" />
              <span>Ask Binimoy AI</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-2"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* 4 Stats Metrics Cards Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`p-6 bg-gradient-to-br ${card.gradient} border ${card.borderColor} bg-slate-900/60 backdrop-blur-md transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {card.title}
                    </span>
                    <div className={`p-2.5 rounded-xl bg-slate-900/80 ${card.textColor} shadow-inner`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {loading ? '...' : card.value}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Quick Actions Bar */}
        <motion.div variants={itemVariants}>
          <QuickActions onOpenAi={handleOpenAi} />
        </motion.div>

        {/* Two-Column Activity Feeds: Recent Requests & Upcoming Sessions */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Exchange Proposals */}
          <Card className="p-6 border-slate-800/80">
            <CardHeader className="mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#6C63FF]/15 text-[#6C63FF]">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Recent Exchange Proposals</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">Incoming & outgoing skill trade requests</p>
                </div>
              </div>
              <Link
                to="/requests"
                className="text-xs text-[#00C2FF] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-2xl bg-slate-900/50 animate-pulse" />
                  ))}
                </div>
              ) : recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.map((r) => {
                    const isOutgoing = r.sender_id === (currentUserProfile?.id || user?.id)
                    const partnerName = isOutgoing ? r.receiver_name : r.sender_name
                    const statusVariant =
                      r.status === 'Accepted'
                        ? 'success'
                        : r.status === 'Rejected'
                        ? 'destructive'
                        : 'warning'

                    return (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-white truncate">
                              {isOutgoing ? `To: ${partnerName}` : `From: ${partnerName}`}
                            </h5>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {isOutgoing ? '(Sent)' : '(Received)'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                            <span className="text-indigo-400 font-medium">{r.offered_skill}</span>
                            <span className="text-slate-600">↔</span>
                            <span className="text-cyan-400 font-medium">{r.requested_skill}</span>
                          </p>
                        </div>
                        <Badge variant={statusVariant}>{r.status}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
                  <ArrowLeftRight className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No exchange proposals yet</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Discover verified peers and trade skills</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/marketplace')}
                  >
                    Browse Marketplace
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Learning Sessions */}
          <Card className="p-6 border-slate-800/80">
            <CardHeader className="mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#00C2FF]/15 text-[#00C2FF]">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Upcoming Learning Sessions</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">20-minute video exchange appointments</p>
                </div>
              </div>
              <Link
                to="/sessions"
                className="text-xs text-[#00C2FF] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-2xl bg-slate-900/50 animate-pulse" />
                  ))}
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map((s) => {
                    const myId = currentUserProfile?.id || user?.id
                    const partner = s.sender_id === myId ? s.receiver_name : s.sender_name

                    return (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-sm text-white truncate">
                            {s.offered_skill} ↔ {s.requested_skill}
                          </h5>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 truncate">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>With {partner} • {formatDateTime(s.scheduled_at)}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            20 Min
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/sessions')}
                            className="px-2.5 py-1 text-xs"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
                  <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No upcoming sessions</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Accept a proposal or schedule a 20-min call</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/requests')}
                  >
                    View Accepted Proposals
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Smart Peer Recommendations */}
        <motion.div variants={itemVariants}>
          <Recommendations
            currentUser={currentUserProfile || user}
            allUsers={allUsers}
            loading={loading}
          />
        </motion.div>

        {/* Trending Skills in Community Banner */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 sm:p-8 border-[#6C63FF]/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00C2FF]" />
                  <span>🔥 Trending Skills in the Community</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Most active skills exchanged by peers on Skill Binimoy
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/marketplace')}
              >
                Explore All Skills
              </Button>
            </div>

            {trendingSkills.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {trendingSkills.map((t, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/marketplace?skill=${encodeURIComponent(t.skill_name)}`)}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-[#6C63FF]/60 hover:bg-[#6C63FF]/10 transition-all duration-200 cursor-pointer text-left group"
                  >
                    <div className="font-bold text-sm text-slate-200 group-hover:text-[#00C2FF] transition-colors truncate">
                      {t.skill_name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {t.teach_count} can teach • {t.learn_count} want
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No trending skills yet. Share yours in your profile!
              </div>
            )}
          </Card>
        </motion.div>

        {/* Binimoy AI Guided Learning Companion Card */}
        <motion.div
          variants={itemVariants}
          className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#6C63FF]/15 via-slate-900/80 to-[#00C2FF]/15 border border-[#6C63FF]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/30 text-xs text-[#00C2FF] font-semibold">
              <Bot className="w-3.5 h-3.5" />
              <span>Powered by Google Gemini</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Need Learning Roadmaps or Session Tips?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Ask Binimoy AI to generate step-by-step learning paths, preparation checklists for your 20-minute video sessions, or advice on how to structure your skill exchange.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {[
                'How to structure a 20-min session?',
                'Roadmap for Full-Stack React',
                'Tips for teaching a skill effectively'
              ].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleOpenAi(prompt)}
                  className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => handleOpenAi()}
            className="shrink-0 font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch AI Assistant</span>
          </Button>
        </motion.div>
      </motion.div>
    </MainLayout>
  )
}

export default Dashboard
