import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ArrowLeftRight, BookOpen, GraduationCap, Eye, UserCheck } from 'lucide-react'

export function UserCard({ user, onProposeExchange, onViewProfile, onSkillClick }) {
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
                <h4
                  onClick={() => onViewProfile && onViewProfile(user)}
                  className="font-bold text-base text-white truncate group-hover:text-[#00C2FF] transition-colors cursor-pointer"
                >
                  {user.full_name}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {user.bio || 'Skill Binimoy community peer ready to exchange skills.'}
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

          <Button
            variant="primary"
            size="sm"
            className="flex-1 font-semibold text-xs flex items-center justify-center gap-1.5"
            onClick={() => onProposeExchange(user)}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Exchange</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export default UserCard
