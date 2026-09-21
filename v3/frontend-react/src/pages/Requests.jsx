import React, { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'
import { requestService } from '../services/requestService'
import { sessionService } from '../services/sessionService'
import { formatDateTime } from '../lib/dateUtils'
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  Sparkles
} from 'lucide-react'

export function Requests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)

  // Schedule Session Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('20')
  const [meetingLink, setMeetingLink] = useState('')
  const [scheduling, setScheduling] = useState(false)

  const loadRequests = async () => {
    try {
      const data = await requestService.getRequests()
      setRequests(data.requests || [])
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleUpdateRequest = async (id, status) => {
    try {
      await requestService.updateRequest(id, status)
      await loadRequests()
    } catch {
      alert('Failed to update request.')
    }
  }

  const handleOpenSchedule = (req) => {
    setSelectedRequest(req)
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    setScheduledAt(tomorrow.toISOString().slice(0, 16))
    setMeetingLink(`https://meet.jit.si/skill-binimoy-session-${req.id}`)
    setScheduleModalOpen(true)
  }

  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRequest) return
    setScheduling(true)

    try {
      await sessionService.createSession({
        request_id: selectedRequest.id,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        meeting_link: meetingLink
      })
      alert('Session scheduled successfully! Check your Sessions tab.')
      setScheduleModalOpen(false)
      loadRequests()
    } catch {
      alert('Failed to schedule session.')
    } finally {
      setScheduling(false)
    }
  }

  // Filter requests based on tabs
  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'incoming') return r.receiver_id === user?.id
    if (activeTab === 'outgoing') return r.sender_id === user?.id
    if (activeTab === 'accepted') return r.status === 'Accepted'
    if (activeTab === 'pending') return r.status === 'Pending'
    return true
  })

  const tabs = [
    { id: 'all', label: 'All Requests', count: requests.length },
    {
      id: 'incoming',
      label: 'Incoming',
      count: requests.filter((r) => r.receiver_id === user?.id && r.status === 'Pending').length
    },
    {
      id: 'outgoing',
      label: 'Outgoing',
      count: requests.filter((r) => r.sender_id === user?.id).length
    },
    {
      id: 'accepted',
      label: 'Accepted',
      count: requests.filter((r) => r.status === 'Accepted').length
    }
  ]

  return (
    <MainLayout>
      <div className="space-y-6 text-left max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Exchange Proposals</span>
              <ArrowLeftRight className="w-5 h-5 text-[#6C63FF]" />
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Review incoming proposals and manage your outgoing exchange requests.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Requests Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-36 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((r) => {
              const isIncoming = r.receiver_id === user?.id
              const partnerName = isIncoming ? r.sender_name : r.receiver_name
              const partnerImage = isIncoming ? r.sender_image : r.receiver_image

              return (
                <Card key={r.id} hover className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3.5">
                      <Avatar src={partnerImage} name={partnerName} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-white">{partnerName}</h4>
                          <span className="text-xs text-slate-400 font-medium">
                            ({isIncoming ? 'Incoming request' : 'Sent by you'})
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Submitted on {formatDateTime(r.created_at)}
                        </p>
                      </div>
                    </div>

                    <Badge>{r.status}</Badge>
                  </div>

                  {/* Skills Exchanged Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                    <div className="p-3 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/20">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8881ff]">
                        Offers to Teach:
                      </span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {r.offered_skill || '—'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#00C2FF]/10 border border-[#00C2FF]/20">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C2FF]">
                        Wants to Learn:
                      </span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {r.requested_skill || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Note / Message */}
                  {r.message && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 italic mb-4">
                      "{r.message}"
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {r.status === 'Pending' && isIncoming && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleUpdateRequest(r.id, 'Accepted')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Exchange</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleUpdateRequest(r.id, 'Rejected')}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </Button>
                      </>
                    )}

                    {r.status === 'Accepted' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenSchedule(r)}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Schedule Learning Session</span>
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 glass-card rounded-3xl border border-slate-800">
            <p className="text-base text-slate-300 font-semibold">No requests found in this category.</p>
            <p className="text-xs text-slate-500 mt-1">
              Check back soon or visit the marketplace to propose exchanges.
            </p>
          </div>
        )}
      </div>

      {/* Schedule Session Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule 20-Min Learning Session"
        description="Set a date and link for your skill exchange video call."
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4 text-left">
          <Input
            label="Date & Time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-[#6C63FF]"
            >
              <option value="20">20 Minutes (Standard)</option>
              <option value="30">30 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">1 Hour</option>
            </select>
          </div>

          <Input
            label="Meeting Link (Pre-configured Jitsi Meet Room)"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            required
          />

          <div className="pt-3 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={scheduling}>
              Confirm Session
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  )
}
