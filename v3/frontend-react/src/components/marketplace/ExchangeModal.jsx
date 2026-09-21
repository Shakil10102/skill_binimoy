import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { requestService } from '../../services/requestService'
import { ArrowLeftRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

export function ExchangeModal({ isOpen, onClose, targetUser, onSuccess }) {
  const { user: currentUser } = useAuth()
  const [offeredSkill, setOfferedSkill] = useState('')
  const [requestedSkill, setRequestedSkill] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Pre-fill / suggest skills when targetUser changes
  useEffect(() => {
    if (targetUser) {
      setError('')
      setSuccess('')
      const targetTeach = (targetUser.skills_teach || []).map((s) =>
        typeof s === 'object' ? s.skill_name : s
      )
      if (targetTeach.length > 0) {
        setRequestedSkill(targetTeach[0])
      } else {
        setRequestedSkill('')
      }

      const myTeach = (currentUser?.skills_teach || []).map((s) =>
        typeof s === 'object' ? s.skill_name : s
      )
      if (myTeach.length > 0) {
        setOfferedSkill(myTeach[0])
      } else {
        setOfferedSkill('')
      }
    }
  }, [targetUser, currentUser])

  if (!targetUser) return null

  const targetTeachList = (targetUser.skills_teach || []).map((s) =>
    typeof s === 'object' ? s.skill_name : s
  )

  const myTeachList = (currentUser?.skills_teach || []).map((s) =>
    typeof s === 'object' ? s.skill_name : s
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!offeredSkill.trim()) {
      setError('Please specify the skill you will teach.')
      return
    }
    if (!requestedSkill.trim()) {
      setError('Please specify the skill you want to learn.')
      return
    }

    setLoading(true)
    try {
      const res = await requestService.sendRequest({
        receiver_id: targetUser.id,
        offered_skill: offeredSkill.trim(),
        requested_skill: requestedSkill.trim(),
        message: message.trim()
      })

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      })

      setSuccess(res.message || 'Exchange request sent successfully!')
      if (onSuccess) onSuccess()

      setTimeout(() => {
        onClose()
        setSuccess('')
        setMessage('')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to send exchange request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Propose Skill Exchange"
      description={`Send a reciprocal learning proposal to ${targetUser.full_name}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-left">
        {/* Target User Summary Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <Avatar src={targetUser.profile_image} name={targetUser.full_name} size="md" />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-white truncate">{targetUser.full_name}</h4>
            <p className="text-xs text-slate-400 truncate">
              {targetUser.bio || 'Skill Binimoy Verified Peer'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Skill You Offer */}
          <div>
            <Input
              id="offeredSkill"
              label="Your Skill to Offer (What you teach)"
              placeholder="e.g. Python, Graphic Design, Photography"
              value={offeredSkill}
              onChange={(e) => setOfferedSkill(e.target.value)}
              required
            />
            {myTeachList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Quick select:</span>
                {myTeachList.map((skill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setOfferedSkill(skill)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-[#6C63FF]/30 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Skill You Want */}
          <div>
            <Input
              id="requestedSkill"
              label="Skill You Want to Learn"
              placeholder="e.g. React, UI/UX Design, Public Speaking"
              value={requestedSkill}
              onChange={(e) => setRequestedSkill(e.target.value)}
              required
            />
            {targetTeachList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Teaches:</span>
                {targetTeachList.map((skill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRequestedSkill(skill)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-[#00C2FF]/30 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Personal Introduction Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Personal Note (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Introduce yourself and suggest times for a 20-min session..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 resize-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={loading}
              className="flex items-center gap-2 font-bold"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Send Request</span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default ExchangeModal
