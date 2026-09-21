import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { chatService } from '../../services/chatService'

export function GroupChatModal({ isOpen, onClose, friends = [], onSuccess }) {
  const [groupName, setGroupName] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!groupName.trim()) {
      setError('Please provide a group name.')
      return
    }

    if (selectedIds.length === 0) {
      setError('Please select at least one friend to add to the group.')
      return
    }

    setLoading(true)
    try {
      const data = await chatService.createGroup(groupName, selectedIds)
      if (onSuccess) onSuccess(data.group_id)
      onClose()
      setGroupName('')
      setSelectedIds([])
    } catch (err) {
      setError(err.message || 'Failed to create group.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Group Chat"
      description="Collaborate with multiple skill exchange partners simultaneously."
    >
      {error && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium mb-4 text-left">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Group Name"
          placeholder="e.g. Frontend Masters, UI Designers Collective"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Members (Accepted Exchange Partners):
          </label>
          <div className="max-h-48 overflow-y-auto space-y-2 p-1">
            {friends.length > 0 ? (
              friends.map((f) => {
                const isSelected = selectedIds.includes(f.id)
                return (
                  <div
                    key={f.id}
                    onClick={() => handleToggle(f.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#6C63FF]/20 border-[#6C63FF]/50 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={f.profile_image} name={f.full_name} size="sm" />
                      <span className="text-sm font-medium">{f.full_name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded accent-[#6C63FF] cursor-pointer"
                    />
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                No exchange friends found yet. Accept exchange requests first to start groups!
              </p>
            )}
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  )
}
