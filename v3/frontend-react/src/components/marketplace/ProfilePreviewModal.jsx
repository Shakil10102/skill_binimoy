import React from 'react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { GraduationCap, BookOpen, ArrowLeftRight, UserCheck, Mail, Sparkles } from 'lucide-react'

export function ProfilePreviewModal({ isOpen, onClose, user, onProposeExchange }) {
  if (!user) return null

  const teachSkills = user.skills_teach || []
  const learnSkills = user.skills_learn || []

  const handlePropose = () => {
    onClose()
    if (onProposeExchange) {
      onProposeExchange(user)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Peer Profile Preview"
      description="Learn more about this skill exchange partner"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 text-left">
        {/* User Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <Avatar
            src={user.profile_image}
            name={user.full_name}
            size="lg"
            className="w-16 h-16 text-xl shadow-lg border-2 border-[#6C63FF]/40"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-white truncate">{user.full_name}</h3>
              <Badge variant="verified">Verified</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Skill Binimoy Community Member</span>
            </p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            About & Learning Bio
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {user.bio || 'This member has not written a personal bio yet, but they are actively exchanging skills.'}
          </p>
        </div>

        {/* Skills Grid: Can Teach & Wants to Learn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Can Teach */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#6C63FF]/15 to-[#6C63FF]/5 border border-[#6C63FF]/30">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2.5">
              <GraduationCap className="w-4 h-4 text-[#8881ff]" />
              <span>Can Teach ({teachSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {teachSkills.length > 0 ? (
                teachSkills.map((skill, i) => (
                  <Badge key={i} variant="teach">
                    {typeof skill === 'object' ? skill.skill_name : skill}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No teaching skills listed</span>
              )}
            </div>
          </div>

          {/* Wants to Learn */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00C2FF]/15 to-[#00C2FF]/5 border border-[#00C2FF]/30">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2.5">
              <BookOpen className="w-4 h-4 text-[#00C2FF]" />
              <span>Wants to Learn ({learnSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {learnSkills.length > 0 ? (
                learnSkills.map((skill, i) => (
                  <Badge key={i} variant="learn">
                    {typeof skill === 'object' ? skill.skill_name : skill}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No learning skills listed</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePropose} className="flex items-center gap-2 font-bold">
            <ArrowLeftRight className="w-4 h-4" />
            <span>Propose Exchange</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ProfilePreviewModal
