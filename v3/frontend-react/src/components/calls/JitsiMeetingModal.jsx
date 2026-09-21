import React, { useEffect, useState, useRef } from 'react'
import { useCall } from '../../context/CallContext'
import { formatSecondsToTimer } from '../../lib/dateUtils'
import { Clock, X, AlertTriangle } from 'lucide-react'

export function JitsiMeetingModal() {
  const { jitsiMeeting, endCall } = useCall()
  const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 minutes in seconds
  const iframeRef = useRef(null)

  useEffect(() => {
    if (!jitsiMeeting) {
      setTimeLeft(20 * 60)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          alert('Session limit reached (20 minutes). Call ending.')
          endCall()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [jitsiMeeting, endCall])

  if (!jitsiMeeting) return null

  const domain = 'meet.jit.si'
  const meetingUrl = `https://${domain}/${jitsiMeeting.roomName}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`

  const isWarning = timeLeft <= 180 // last 3 minutes

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl select-none animate-fade-in">
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#0F172A] rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header with 20-min Countdown */}
        <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
          <div>
            <h3 className="font-bold text-base text-white">{jitsiMeeting.title}</h3>
            <p className="text-xs text-slate-400">Scheduled 20-Minute Learning Session</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown Badge */}
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-sm font-bold border transition-colors ${
                isWarning
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-[#6C63FF]/20 text-[#00C2FF] border-[#6C63FF]/40'
              }`}
            >
              {isWarning ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              <span>{formatSecondsToTimer(timeLeft)} Left</span>
            </div>

            <button
              onClick={endCall}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close meeting"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Jitsi Iframe Canvas */}
        <div className="flex-1 w-full h-full bg-slate-950">
          <iframe
            ref={iframeRef}
            src={meetingUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-none"
            title={jitsiMeeting.title}
          />
        </div>
      </div>
    </div>
  )
}
