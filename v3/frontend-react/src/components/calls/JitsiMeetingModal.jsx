import React, { useEffect, useState, useRef } from 'react'
import { useCall } from '../../context/CallContext'
import { formatSecondsToTimer } from '../../lib/dateUtils'
import { Clock, X, AlertTriangle, ExternalLink } from 'lucide-react'

export function JitsiMeetingModal() {
  const { jitsiMeeting, endCall } = useCall()
  const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 minutes in seconds
  const containerRef = useRef(null)
  const [apiLoaded, setApiLoaded] = useState(false)

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

  useEffect(() => {
    if (!jitsiMeeting) return
    let jitsiApi = null

    const loadScriptAndInit = async () => {
      try {
        if (!window.JitsiMeetExternalAPI) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://meet.jit.si/external_api.js'
            script.async = true
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        if (window.JitsiMeetExternalAPI && containerRef.current) {
          containerRef.current.innerHTML = ''
          const domain = 'meet.jit.si'
          const options = {
            roomName: jitsiMeeting.roomName,
            width: '100%',
            height: '100%',
            parentNode: containerRef.current,
            configOverwrite: {
              prejoinPageEnabled: false,
              disableDeepLinking: true
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false
            }
          }

          jitsiApi = new window.JitsiMeetExternalAPI(domain, options)
          jitsiApi.addEventListener('videoConferenceLeft', () => {
            endCall()
          })
          setApiLoaded(true)
        }
      } catch (err) {
        console.warn('Jitsi script load failed, falling back to direct iframe:', err)
        setApiLoaded(false)
      }
    }

    loadScriptAndInit()

    return () => {
      if (jitsiApi) {
        try {
          jitsiApi.dispose()
        } catch {}
      }
    }
  }, [jitsiMeeting, endCall])

  if (!jitsiMeeting) return null

  const domain = 'meet.jit.si'
  const meetingUrl = `https://${domain}/${jitsiMeeting.roomName}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`
  const isWarning = timeLeft <= 180 // last 3 minutes

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl select-none animate-fade-in">
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#0F172A] rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header with 20-min Countdown & New Tab Fallback */}
        <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
          <div>
            <h3 className="font-bold text-base text-white">{jitsiMeeting.title}</h3>
            <p className="text-xs text-slate-400">Scheduled 20-Minute Learning Session</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Open in New Window link (essential fallback if iframe is restricted) */}
            <a
              href={meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-[#00C2FF] hover:text-white px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-[#00C2FF] transition-all"
              title="Open meeting in external tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>

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

        {/* Jitsi Meeting Container */}
        <div className="flex-1 w-full h-full bg-slate-950 relative">
          <div ref={containerRef} className="w-full h-full" />
          {!apiLoaded && (
            <iframe
              src={meetingUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-none absolute inset-0"
              title={jitsiMeeting.title}
            />
          )}
        </div>
      </div>
    </div>
  )
}
