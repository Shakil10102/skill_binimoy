import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ArrowLeftRight, BookOpen, GraduationCap, Eye, UserCheck, Clock } from 'lucide-react'

export function UserCard({ user, relationshipStatus = 'none', onProposeExchange, onViewProfile, onSkillClick }) {
  const teachSkills = user.skills_teach || []
  const learnSkills = user.skills_learn || []

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className="flex flex-col justify-between h-full group border-slate-800/80 hover:border-[#6C63FF]/50 bg-slate-900/60 backdrop-blur-md transition-all duration-300 p-5 sm:p-6"
      >
        <div>
          {/* User Header */}
          <div className="flex items-start gap-3.5 mb-4">
            <div
              onClick={() => onViewProfile && onViewProfile(user)}
              className="cursor-pointer relative"
              title="View Profile"
            >
              <Avatar
                src={user.profile_image}
                name={user.full_name}
                size="lg"
                className="group-hover:scale-105 transition-transform border border-slate-700/80"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <h3
                  onClick={() => onViewProfile && onViewProfile(user)}
                  className="font-bold text-base text-white truncate cursor-pointer hover:text-[#00C2FF] transition-colors"
                >
                  {user.full_name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                {user.bio || 'Skill Binimoy member passionate about learning & sharing.'}
              </p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-3.5 my-4 text-left">
            {/* Teaches */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8881ff] mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Can Teach:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {teachSkills.length > 0 ? (
                  teachSkills.map((skill, i) => {
                    const skillName = typeof skill === 'object' ? skill.skill_name : skill
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSkillClick) onSkillClick(skillName)
                        }}
                        className="cursor-pointer transition-transform hover:scale-105"
                        title={`Filter by ${skillName}`}
                      >
                        <Badge variant="teach">
                          {skillName}
                        </Badge>
                      </button>
                    )
                  })
                ) : (
                  <span className="text-xs text-slate-500 italic">No teaching skills listed</span>
                )}
              </div>
            </div>

            {/* Wants to Learn */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00C2FF] mb-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Wants to Learn:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {learnSkills.length > 0 ? (
                  learnSkills.map((skill, i) => {
                    const skillName = typeof skill === 'object' ? skill.skill_name : skill
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSkillClick) onSkillClick(skillName)
                        }}
                        className="cursor-pointer transition-transform hover:scale-105"
                        title={`Filter by ${skillName}`}
                      >
                        <Badge variant="learn">
                          {skillName}
                        </Badge>
                      </button>
                    )
                  })
                ) : (
                  <span className="text-xs text-slate-500 italic">No learning skills listed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700/80 hover:border-slate-600 hover:bg-slate-800 text-slate-300 text-xs flex items-center justify-center gap-1.5 px-3"
            onClick={() => onViewProfile && onViewProfile(user)}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </Button>

          {relationshipStatus === 'friends' ? (
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="flex-1 font-semibold text-xs flex items-center justify-center gap-1.5 opacity-80 cursor-not-allowed bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Friends</span>
            </Button>
          ) : relationshipStatus === 'pending' ? (
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="flex-1 font-semibold text-xs flex items-center justify-center gap-1.5 opacity-80 cursor-not-allowed bg-amber-500/10 text-amber-400 border border-amber-500/20"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Request Pending</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="flex-1 font-semibold text-xs flex items-center justify-center gap-1.5"
              onClick={() => onProposeExchange(user)}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Send Request</span>
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export default UserCard
