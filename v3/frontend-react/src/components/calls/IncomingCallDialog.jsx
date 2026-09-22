import React from 'react'
import { useCall } from '../../context/CallContext'
import { Avatar } from '../ui/Avatar'
import { Phone, Video, PhoneOff } from 'lucide-react'

export function IncomingCallDialog() {
  const { incomingCall, acceptCall, rejectCall } = useCall()

  if (!incomingCall) return null

  const isVideo = (incomingCall.callType || incomingCall.call_type || 'video') === 'video'
  const callerName = incomingCall.callerName || incomingCall.caller_name || 'Exchange Partner'
  const callerImage = incomingCall.callerImage || incomingCall.caller_avatar || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm glass-card-glow rounded-3xl p-8 bg-[#1E293B]/95 text-center border border-slate-700/80 shadow-2xl relative">
        {/* Pulsing Avatar Ring */}
        <div className="relative inline-block my-4">
          <div className="absolute inset-0 rounded-full bg-[#6C63FF]/30 animate-ping" />
          <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] opacity-30 blur-md animate-pulse" />
          <Avatar
            src={callerImage}
            name={callerName}
            size="2xl"
            className="border-4 border-[#00C2FF] relative z-10"
          />
        </div>

        {/* Caller Info */}
        <h3 className="text-2xl font-bold text-white tracking-tight">
          {callerName}
        </h3>
        <p className="text-sm font-medium text-[#00C2FF] mt-1 flex items-center justify-center gap-1.5">
          {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>Incoming {isVideo ? 'Video' : 'Audio'} Call...</span>
        </p>
        <p className="text-xs text-slate-400 mt-2">Skill Binimoy Peer Exchange</p>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center gap-5">
          {/* Decline Button */}
          <button
            onClick={rejectCall}
            className="w-14 h-14 rounded-full bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg shadow-red-500/20 cursor-pointer"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Accept Audio */}
          <button
            onClick={() => acceptCall('audio')}
            className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg shadow-cyan-500/20 cursor-pointer"
            title="Answer Audio"
          >
            <Phone className="w-6 h-6" />
          </button>

          {/* Accept Video (Primary if video) */}
          {isVideo && (
            <button
              onClick={() => acceptCall('video')}
              className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xl shadow-emerald-500/40 cursor-pointer animate-bounce"
              title="Answer Video"
            >
              <Video className="w-7 h-7" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
