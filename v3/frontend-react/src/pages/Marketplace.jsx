import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MainLayout } from '../components/layout/MainLayout'
import { UserCard } from '../components/marketplace/UserCard'
import { ExchangeModal } from '../components/marketplace/ExchangeModal'
import { ProfilePreviewModal } from '../components/marketplace/ProfilePreviewModal'
import { marketplaceService } from '../services/marketplaceService'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import {
  Search,
  Sparkles,
  Filter,
  X,
  RefreshCw,
  Users,
  GraduationCap,
  BookOpen,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react'

export function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: currentUser } = useAuth()

  const initialSkill = searchParams.get('skill') || ''
  const initialSearch = searchParams.get('search') || ''
  const initialUserParam = searchParams.get('user') || ''

  const [users, setUsers] = useState([])
  const [trendingSkills, setTrendingSkills] = useState([])
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedSkillFilter, setSelectedSkillFilter] = useState(initialSkill)
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all', 'teach', 'learn'
  const [sortBy, setSortBy] = useState('default') // 'default', 'name', 'skills'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const fetchMarketplaceData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, trendingRes] = await Promise.allSettled([
        marketplaceService.getAllUsers(),
        marketplaceService.getTrendingSkills()
      ])

      if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
        setUsers(usersRes.value.users)
      } else if (usersRes.status === 'rejected') {
        throw new Error('Failed to load marketplace members.')
      }

      if (trendingRes.status === 'fulfilled' && trendingRes.value?.trending) {
        setTrendingSkills(trendingRes.value.trending)
      }
    } catch (err) {
      console.error('Marketplace error:', err)
      setError(err.message || 'Unable to connect to the marketplace. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketplaceData()
  }, [])

  // Auto-handle URL user param
  useEffect(() => {
    if (initialUserParam && users.length > 0) {
      const found = users.find((u) => String(u.id) === String(initialUserParam))
      if (found) {
        setSelectedUser(found)
        setExchangeModalOpen(true)
      }
    }
  }, [initialUserParam, users])

  // Synchronize URL search params
  const updateUrlParams = (newSkill, newSearch) => {
    const params = {}
    if (newSkill) params.skill = newSkill
    if (newSearch) params.search = newSearch
    setSearchParams(params)
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    updateUrlParams(selectedSkillFilter, val)
  }

  const handleSkillChipClick = (skillName) => {
    if (selectedSkillFilter.toLowerCase() === skillName.toLowerCase()) {
      setSelectedSkillFilter('')
      updateUrlParams('', searchQuery)
    } else {
      setSelectedSkillFilter(skillName)
      updateUrlParams(skillName, searchQuery)
    }
  }

  const handleClearAllFilters = () => {
    setSearchQuery('')
    setSelectedSkillFilter('')
    setCategoryFilter('all')
    setSortBy('default')
    setSearchParams({})
  }

  // Filter & Sort Logic
  const filteredUsers = React.useMemo(() => {
    // Exclude current user from marketplace exchange list
    let list = users.filter((u) => u.id !== currentUser?.id)

    // 1. Search Query Filter
    const q = searchQuery.toLowerCase().trim()
    if (q) {
      list = list.filter((u) => {
        const nameMatch = u.full_name?.toLowerCase().includes(q)
        const bioMatch = u.bio?.toLowerCase().includes(q)

        const teachMatch = (u.skills_teach || []).some((s) => {
          const name = typeof s === 'object' ? s.skill_name : s
          return name?.toLowerCase().includes(q)
        })
        const learnMatch = (u.skills_learn || []).some((s) => {
          const name = typeof s === 'object' ? s.skill_name : s
          return name?.toLowerCase().includes(q)
        })

        return nameMatch || bioMatch || teachMatch || learnMatch
      })
    }

    // 2. Trending Skill Filter
    if (selectedSkillFilter) {
      const skillLower = selectedSkillFilter.toLowerCase()
      list = list.filter((u) => {
        const hasTeach = (u.skills_teach || []).some((s) => {
          const name = typeof s === 'object' ? s.skill_name : s
          return name?.toLowerCase().includes(skillLower)
        })
        const hasLearn = (u.skills_learn || []).some((s) => {
          const name = typeof s === 'object' ? s.skill_name : s
          return name?.toLowerCase().includes(skillLower)
        })
        return hasTeach || hasLearn
      })
    }

    // 3. Category Type Filter
    if (categoryFilter === 'teach') {
      list = list.filter((u) => (u.skills_teach || []).length > 0)
    } else if (categoryFilter === 'learn') {
      list = list.filter((u) => (u.skills_learn || []).length > 0)
    }

    // 4. Sort Filter
    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.full_name.localeCompare(b.full_name))
    } else if (sortBy === 'skills') {
      list = [...list].sort((a, b) => {
        const aCount = (a.skills_teach || []).length + (a.skills_learn || []).length
        const bCount = (b.skills_teach || []).length + (b.skills_learn || []).length
        return bCount - aCount
      })
    }

    return list
  }, [users, currentUser, searchQuery, selectedSkillFilter, categoryFilter, sortBy])

  const handleOpenExchange = (user) => {
    setSelectedUser(user)
    setExchangeModalOpen(true)
  }

  const handleOpenPreview = (user) => {
    setSelectedUser(user)
    setPreviewModalOpen(true)
  }

  const handleSuccessProposal = () => {
    setToastMessage('Exchange request sent successfully!')
    setTimeout(() => setToastMessage(''), 4000)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6 text-left">
        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between"
            >
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage('')} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-700/60">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium">
              <Users className="w-3.5 h-3.5 text-[#00C2FF]" />
              <span>Peer-to-Peer Skill Exchange</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Skill Marketplace</span>
              <Sparkles className="w-5 h-5 text-[#00C2FF] animate-pulse" />
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Connect with verified community peers to trade knowledge, teach what you love, and learn what you need.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search skills, topics, or names..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  updateUrlParams(selectedSkillFilter, '')
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-[#6C63FF] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Members
              </button>
              <button
                onClick={() => setCategoryFilter('teach')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  categoryFilter === 'teach'
                    ? 'bg-[#6C63FF] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Can Teach</span>
              </button>
              <button
                onClick={() => setCategoryFilter('learn')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  categoryFilter === 'learn'
                    ? 'bg-[#6C63FF] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Wants to Learn</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline-block">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6C63FF] cursor-pointer"
                >
                  <option value="default">Default</option>
                  <option value="skills">Most Listed Skills</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trending Skill Filter Chips */}
          {trendingSkills.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 pr-1">
                <Filter className="w-3.5 h-3.5 text-[#00C2FF]" />
                <span>Trending:</span>
              </div>

              <div className="flex items-center gap-2 flex-nowrap">
                <button
                  onClick={() => {
                    setSelectedSkillFilter('')
                    updateUrlParams('', searchQuery)
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                    !selectedSkillFilter
                      ? 'bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] text-white border-transparent font-bold shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  All
                </button>

                {trendingSkills.map((t, idx) => {
                  const isSelected =
                    selectedSkillFilter.toLowerCase() === t.skill_name.toLowerCase()
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSkillChipClick(t.skill_name)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] text-white border-transparent shadow-md shadow-[#6C63FF]/25 font-bold'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>🔥 {t.skill_name}</span>
                      <span className="text-[10px] opacity-75">
                        ({t.teach_count} teach)
                      </span>
                    </button>
                  )
                })}

                {selectedSkillFilter && (
                  <button
                    onClick={() => {
                      setSelectedSkillFilter('')
                      updateUrlParams('', searchQuery)
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-0.5 whitespace-nowrap cursor-pointer"
                  >
                    Clear Filter ✕
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Counter & Clear Controls */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredUsers.length}</strong> community partner{filteredUsers.length === 1 ? '' : 's'}
            {selectedSkillFilter && (
              <span> matching <span className="text-[#00C2FF] font-semibold">"{selectedSkillFilter}"</span></span>
            )}
            {searchQuery && (
              <span> for <span className="text-[#6C63FF] font-semibold">"{searchQuery}"</span></span>
            )}
          </div>

          {(selectedSkillFilter || searchQuery || categoryFilter !== 'all' || sortBy !== 'default') && (
            <button
              onClick={handleClearAllFilters}
              className="text-[#00C2FF] hover:underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMarketplaceData}
              className="border-red-500/40 text-red-300 hover:bg-red-500/20 mx-auto flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading</span>
            </Button>
          </div>
        )}

        {/* Loading Skeleton Grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-72 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800 p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-2/3" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-12 bg-slate-800/60 rounded-xl" />
                <div className="h-10 bg-slate-800/40 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Users Grid */}
        {!loading && !error && filteredUsers.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-1"
          >
            {filteredUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onProposeExchange={handleOpenExchange}
                onViewProfile={handleOpenPreview}
                onSkillClick={(skillName) => handleSkillChipClick(skillName)}
              />
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="text-center py-20 glass-card rounded-3xl border border-slate-800/80 p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No skill partners found</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                No verified members match your current query. Try adjusting your search term, clearing skill filters, or exploring all members.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleClearAllFilters}
                className="font-semibold"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Propose Exchange Modal */}
      <ExchangeModal
        isOpen={exchangeModalOpen}
        onClose={() => setExchangeModalOpen(false)}
        targetUser={selectedUser}
        onSuccess={handleSuccessProposal}
      />

      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        user={selectedUser}
        onProposeExchange={handleOpenExchange}
      />
    </MainLayout>
  )
}

export default Marketplace
