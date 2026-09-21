import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Sparkles, ArrowRight, UserCheck, Star } from 'lucide-react'

export function Recommendations({ currentUser, allUsers = [], loading = false }) {
  const navigate = useNavigate()

  // Extract learning skills from currentUser (handling both string arrays and object arrays)
  const learningSkills = (currentUser?.skills_learn || []).map((s) =>
    typeof s === 'string' ? s.toLowerCase().trim() : s?.skill_name?.toLowerCase().trim()
  ).filter(Boolean)

  // Filter out self and compute matches
  const recommendedPeers = React.useMemo(() => {
    if (!allUsers.length) return []

    const others = allUsers.filter((u) => u.id !== currentUser?.id)

    const scored = others.map((peer) => {
      const teachSkills = (peer.skills_teach || []).map((s) =>
        typeof s === 'string' ? s : s?.skill_name
      ).filter(Boolean)

      // Find overlapping skill
      const matchedSkill = teachSkills.find((ts) =>
        learningSkills.some((ls) => ls && ts.toLowerCase().includes(ls))
      )

      return {
        ...peer,
        teachSkills,
        matchedSkill: matchedSkill || (teachSkills.length > 0 ? teachSkills[0] : null),
        isDirectMatch: Boolean(matchedSkill)
      }
    })

    // Sort: direct matches first, then peers with most teach skills
    scored.sort((a, b) => {
      if (a.isDirectMatch && !b.isDirectMatch) return -1
      if (!a.isDirectMatch && b.isDirectMatch) return 1
      return (b.teachSkills?.length || 0) - (a.teachSkills?.length || 0)
    })

    return scored.slice(0, 3)
  }, [allUsers, currentUser, learningSkills])

  if (loading) {
    return (
      <Card className="p-6 border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#6C63FF] animate-pulse" />
          <h3 className="font-bold text-white text-base">Recommended Peer Exchanges</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse h-36" />
          ))}
        </div>
      </Card>
    )
  }

  if (recommendedPeers.length === 0) {
    return null
  }

  return (
    <Card className="p-6 border-slate-800/80">
      <CardHeader className="mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#6C63FF]/15 text-[#6C63FF]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Recommended Peer Matches</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified community members who teach skills aligned with your goals
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/marketplace')}
          className="text-xs text-[#00C2FF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>Explore All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedPeers.map((peer, idx) => (
            <motion.div
              key={peer.id || idx}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-[#6C63FF]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={peer.profile_image}
                      name={peer.full_name || 'Member'}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate max-w-[130px]">
                        {peer.full_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        {peer.bio || 'Active skill exchange peer'}
                      </p>
                    </div>
                  </div>
                  {peer.isDirectMatch ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                      Skill Match
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/30 whitespace-nowrap">
                      Top Peer
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 my-3 text-xs">
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-500">Can Teach:</span>
                    <span className="font-medium text-slate-200 truncate">
                      {peer.matchedSkill || peer.teachSkills[0] || 'General Skill'}
                    </span>
                  </div>
                  {peer.teachSkills.length > 1 && (
                    <div className="text-[11px] text-slate-500">
                      +{peer.teachSkills.length - 1} more skill{peer.teachSkills.length > 2 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs border-slate-700 hover:border-[#00C2FF]/60 hover:text-[#00C2FF]"
                onClick={() => navigate(`/marketplace?user=${peer.id}`)}
              >
                <span>Propose Exchange</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default Recommendations
