import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { callService } from '../services/callService'
import { sessionService } from '../services/sessionService'
import {
  startRingingSound,
  stopRingingSound,
  startTitleFlash,
  stopTitleFlash
} from '../lib/soundSynthesizer'
import { useAuth } from './AuthContext'

const CallContext = createContext(null)

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
}

export function CallProvider({ children }) {
  const { user, isAuthenticated } = useAuth()

  // Calling States
  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [jitsiMeeting, setJitsiMeeting] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)
  const [connectionState, setConnectionState] = useState('idle')

  // Stream references
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)

  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const durationIntervalRef = useRef(null)
  const pollIncomingIntervalRef = useRef(null)
  const outgoingPollIntervalRef = useRef(null)
  const signalingPollIntervalRef = useRef(null)

  // 1. Background Incoming Call Poller
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (pollIncomingIntervalRef.current) clearInterval(pollIncomingIntervalRef.current)
      return
    }

    const pollIncoming = async () => {
      // Don't poll if already in an active or incoming call
      if (activeCall || incomingCall) return

      try {
        const data = await callService.checkIncomingCall()
        if (data && data.incoming && data.call) {
          const call = data.call
          setIncomingCall(call)
          startRingingSound(true)
          startTitleFlash(`Incoming ${call.call_type || 'video'} call from ${call.caller_name || 'Someone'}`)
        }
      } catch {
        // Ignore polling errors
      }
    }

    pollIncomingIntervalRef.current = setInterval(pollIncoming, 2500)

    return () => {
      if (pollIncomingIntervalRef.current) clearInterval(pollIncomingIntervalRef.current)
    }
  }, [isAuthenticated, user, activeCall, incomingCall])

  // Helper: Acquire Local Media
  const acquireMedia = async (callType = 'video') => {
    const isVideo = callType === 'video'
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      return stream
    } catch (err) {
      if (isVideo) {
        // Audio fallback
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          localStreamRef.current = fallback
          setLocalStream(fallback)
          return fallback
        } catch {
          throw new Error('Microphone and camera permissions are required to place calls.')
        }
      }
      throw err
    }
  }

  // Helper: Start Call Duration Timer
  const startDurationTimer = () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
    setCallDuration(0)
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
  }

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }

  // 2. Start Outgoing Call
  const startCall = async ({ type = 'direct', callType = 'video', targetId, title, partnerName, partnerImage }) => {
    if (type === 'session' || type === 'group') {
      // Jitsi Meet Room
      try {
        const res = await sessionService.generateVideoRoom(type, targetId, 20)
        const roomName = res.room_name || `skill-binimoy-${type}-${targetId}`
        setJitsiMeeting({
          roomName,
          title: title || `${type === 'group' ? 'Group' : 'Session'} Call`,
          durationMinutes: 20
        })
      } catch (err) {
        alert(err.message || 'Could not create conference room.')
      }
      return
    }

    // Direct 1-on-1 WebRTC Call
    try {
      const res = await callService.initiateCall(targetId, callType)
      const callId = res.call_id

      setActiveCall({
        callId,
        isCaller: true,
        callType,
        partnerName: partnerName || 'Exchange Partner',
        partnerImage: partnerImage || '',
        title: title || `Call with ${partnerName}`,
        status: 'calling'
      })

      setConnectionState('ringing')
      startRingingSound(false)
      startTitleFlash(`Calling ${partnerName || 'Peer'}...`)

      // Poll call status until accepted or rejected
      outgoingPollIntervalRef.current = setInterval(async () => {
        try {
          const check = await callService.checkCallStatus(callId)
          if (check.status === 'accepted') {
            clearInterval(outgoingPollIntervalRef.current)
            stopRingingSound()
            stopTitleFlash()
            connectAsCaller(callId, callType)
          } else if (['rejected', 'ended', 'missed'].includes(check.status)) {
            clearInterval(outgoingPollIntervalRef.current)
            stopRingingSound()
            stopTitleFlash()
            endCall()
            alert(`Call ${check.status === 'rejected' ? 'declined' : 'ended'}.`)
          }
        } catch {
          // continue polling
        }
      }, 2000)
    } catch (err) {
      alert(err.message || 'Could not initiate call.')
      endCall()
    }
  }

  // Connect as WebRTC Caller
  const connectAsCaller = async (callId, callType) => {
    try {
      setConnectionState('connecting')
      const stream = await acquireMedia(callType)
      const pc = new RTCPeerConnection(RTC_CONFIG)
      peerConnectionRef.current = pc

      const rStream = new MediaStream()
      remoteStreamRef.current = rStream
      setRemoteStream(rStream)

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          rStream.addTrack(track)
        })
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      // ICE handling
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          callService.sendCallSignal(callId, 'ice', e.candidate.toJSON()).catch(() => {})
        }
      }

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState)
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      await callService.sendCallSignal(callId, 'offer', {
        type: offer.type,
        sdp: offer.sdp
      })

      setActiveCall((prev) => ({ ...prev, status: 'connected' }))
      startDurationTimer()

      // Poll for Receiver's SDP Answer & ICE candidates
      signalingPollIntervalRef.current = setInterval(async () => {
        try {
          const sig = await callService.getCallSignals(callId)
          if (sig.signals?.receiver_answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.signals.receiver_answer))
          }
          if (sig.signals?.receiver_ice) {
            for (const cand of sig.signals.receiver_ice) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand))
              } catch {}
            }
          }
        } catch {}
      }, 1500)
    } catch (err) {
      console.error('Caller connection error:', err)
      endCall()
    }
  }

  // 3. Accept Incoming Call
  const acceptCall = async (preferredType) => {
    if (!incomingCall) return
    const call = incomingCall
    const selectedType = preferredType || call.call_type || 'video'
    setIncomingCall(null)
    stopRingingSound()
    stopTitleFlash()

    setActiveCall({
      callId: call.id || call.call_id,
      isCaller: false,
      callType: selectedType,
      partnerName: call.caller_name || 'Exchange Partner',
      partnerImage: call.caller_avatar || '',
      title: `Call with ${call.caller_name || 'Peer'}`,
      status: 'connecting'
    })

    try {
      const callId = call.id || call.call_id
      await callService.respondCall(callId, 'accept')

      const stream = await acquireMedia(selectedType)
      const pc = new RTCPeerConnection(RTC_CONFIG)
      peerConnectionRef.current = pc

      const rStream = new MediaStream()
      remoteStreamRef.current = rStream
      setRemoteStream(rStream)

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          rStream.addTrack(track)
        })
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          callService.sendCallSignal(callId, 'ice', e.candidate.toJSON()).catch(() => {})
        }
      }

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState)
      }

      // Poll for Caller's SDP Offer
      let answered = false
      signalingPollIntervalRef.current = setInterval(async () => {
        try {
          const sig = await callService.getCallSignals(callId)
          if (sig.signals?.caller_offer && !answered) {
            answered = true
            await pc.setRemoteDescription(new RTCSessionDescription(sig.signals.caller_offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await callService.sendCallSignal(callId, 'answer', {
              type: answer.type,
              sdp: answer.sdp
            })
            setActiveCall((prev) => ({ ...prev, status: 'connected' }))
            startDurationTimer()
          }
          if (sig.signals?.caller_ice) {
            for (const cand of sig.signals.caller_ice) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand))
              } catch {}
            }
          }
        } catch {}
      }, 1500)
    } catch (err) {
      console.error('Accept call error:', err)
      endCall()
    }
  }

  // 4. Reject Incoming Call
  const rejectCall = async () => {
    if (!incomingCall) return
    const callId = incomingCall.id || incomingCall.call_id
    setIncomingCall(null)
    stopRingingSound()
    stopTitleFlash()
    try {
      await callService.respondCall(callId, 'reject')
    } catch {}
  }

  // 5. End Active Call
  const endCall = () => {
    stopRingingSound()
    stopTitleFlash()
    stopDurationTimer()

    if (outgoingPollIntervalRef.current) {
      clearInterval(outgoingPollIntervalRef.current)
      outgoingPollIntervalRef.current = null
    }

    if (signalingPollIntervalRef.current) {
      clearInterval(signalingPollIntervalRef.current)
      signalingPollIntervalRef.current = null
    }

    // Stop Media Tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop())
      remoteStreamRef.current = null
    }
    setLocalStream(null)
    setRemoteStream(null)

    // Close PeerConnection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (activeCall?.callId) {
      callService.cancelCall(activeCall.callId).catch(() => {})
    }

    setActiveCall(null)
    setJitsiMeeting(null)
    setIsMicMuted(false)
    setIsCamOff(false)
    setConnectionState('idle')
  }

  // Media Controls
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMicMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsCamOff(!videoTrack.enabled)
      }
    }
  }

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        jitsiMeeting,
        callDuration,
        isMicMuted,
        isCamOff,
        connectionState,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleCam
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export function useCall() {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}
