import React, { useEffect, useRef } from 'react'
import { useCall } from '../../context/CallContext'
import { formatSecondsToTimer } from '../../lib/dateUtils'
import { Avatar } from '../ui/Avatar'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ActiveCallModal() {
  const {
    activeCall,
    callDuration,
    isMicMuted,
    isCamOff,
    connectionState,
    localStream,
    remoteStream,
    toggleMic,
    toggleCam,
    endCall
  } = useCall()

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  if (!activeCall) return null

  const isVideo = activeCall.callType === 'video'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0F172A] rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <Avatar src={activeCall.partnerImage} name={activeCall.partnerName} size="sm" />
            <div>
              <h4 className="font-bold text-sm text-white">{activeCall.partnerName}</h4>
              <p className="text-xs text-slate-400">
                {activeCall.status === 'calling'
                  ? 'Calling...'
                  : connectionState === 'connecting'
                  ? 'Connecting...'
                  : isVideo
                  ? 'Video Exchange'
                  : 'Audio Call'}
              </p>
            </div>
          </div>

          {/* Duration Badge */}
          {activeCall.status === 'connected' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#00C2FF] font-mono text-sm font-bold shadow-sm">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span>{formatSecondsToTimer(callDuration)}</span>
            </div>
          )}
        </div>

        {/* Video Canvas Area */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={cn(
              'w-full h-full object-cover',
              (!isVideo || isCamOff) && 'hidden'
            )}
          />

          {/* Audio Mode or Video Off Placeholder */}
          {(!isVideo || isCamOff || activeCall.status === 'calling') && (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#6C63FF]/20 animate-ping" />
                <Avatar
                  src={activeCall.partnerImage}
                  name={activeCall.partnerName}
                  size="2xl"
                  className="border-4 border-[#6C63FF] shadow-2xl"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{activeCall.partnerName}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {activeCall.status === 'calling'
                    ? 'Ringing...'
                    : 'Voice call active'}
                </p>
              </div>

              {/* Soundwaves visualizer */}
              <div className="flex items-center gap-1.5 h-8">
                {[40, 70, 100, 60, 30, 80, 50, 90, 60, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-[#6C63FF] to-[#00C2FF] rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {isVideo && !isCamOff && (
            <div className="absolute bottom-6 right-6 w-36 sm:w-52 aspect-video rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-black z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            </div>
          )}
        </div>

        {/* Floating Bottom Control Bar */}
        <div className="h-20 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-6 flex items-center justify-center gap-4 z-20">
          {/* Mute Mic */}
          <button
            onClick={toggleMic}
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md',
              isMicMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            )}
            title={isMicMuted ? 'Unmute' : 'Mute'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera (if video call) */}
          {isVideo && (
            <button
              onClick={toggleCam}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md',
                isCamOff
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              )}
              title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="px-6 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  )
}
