import React, { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { useCall } from '../context/CallContext'
import { sessionService } from '../services/sessionService'
import { formatDateTime } from '../lib/dateUtils'
import { CalendarDays, Video, Clock, ExternalLink } from 'lucide-react'

export function Sessions() {
  const { user } = useAuth()
  const { startCall } = useCall()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadSessions = async () => {
    try {
      const data = await sessionService.getSessions()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleStartCall = (session, partnerName) => {
    if (session.status !== 'Upcoming') {
      alert(`This session is ${session.status.toLowerCase()} and cannot be joined.`)
      return
    }

    startCall({
      type: 'session',
      targetId: session.id,
      title: `${session.offered_skill} ↔ ${session.requested_skill}`,
      partnerName,
      meetingLink: session.meeting_link
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6 text-left max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Learning Sessions</span>
              <CalendarDays className="w-5 h-5 text-[#00C2FF]" />
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your scheduled 20-minute video exchange sessions with peers.
            </p>
          </div>
        </div>

        {/* Sessions Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-36 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((s) => {
              const myId = user?.id
              const partner = s.sender_id === myId ? s.receiver_name : s.sender_name

              return (
                <Card key={s.id} hover className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        {s.offered_skill} ↔ {s.requested_skill}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Exchange Session with <strong className="text-slate-200">{partner}</strong>
                      </p>
                    </div>

                    <Badge>{s.status}</Badge>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Date & Time
                      </span>
                      <p className="text-xs font-semibold text-white mt-1">
                        {formatDateTime(s.scheduled_at)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Time Allocation
                      </span>
                      <p className="text-xs font-semibold text-white mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#00C2FF]" />
                        <span>{s.duration_minutes || 20} min limit</span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Video Room
                        </span>
                        <p className="text-xs font-semibold text-[#00C2FF] mt-1 truncate max-w-[120px]">
                          Jitsi Meet Encrypted
                        </p>
                      </div>
                      {s.meeting_link && (
                        <a
                          href={s.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Action Launch Call */}
                  <div className="pt-2">
                    {s.status === 'Upcoming' ? (
                      <Button
                        variant="primary"
                        size="md"
                        className="font-bold gap-2 shadow-lg shadow-[#6C63FF]/20"
                        onClick={() => handleStartCall(s, partner)}
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Meeting</span>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="md"
                        disabled
                        className="font-semibold gap-2 opacity-60 cursor-not-allowed"
                      >
                        <span>{s.status === 'Completed' ? 'Session Completed' : 'Session Cancelled'}</span>
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 glass-card rounded-3xl border border-slate-800">
            <p className="text-base text-slate-300 font-semibold">No scheduled sessions yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Once you or your partner accept an exchange proposal, you can schedule sessions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
