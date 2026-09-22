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
        const call = data?.incomingCall || data?.call
        if (call) {
          setIncomingCall(call)
          startRingingSound(true)
          startTitleFlash(
            `Incoming ${call.callType || call.call_type || 'video'} call from ${call.callerName || call.caller_name || 'Someone'}`
          )
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
        // Audio fallback if camera is unavailable or blocked
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          localStreamRef.current = fallback
          setLocalStream(fallback)
          return fallback
        } catch {
          throw new Error('Microphone permission is required to place calls.')
        }
      }
      throw new Error('Microphone permission is required to place calls.')
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
  const startCall = async ({ type = 'direct', callType = 'video', targetId, title, partnerName, partnerImage, meetingLink }) => {
    if (type === 'session' || type === 'group') {
      // Jitsi Meet Room
      try {
        const res = await sessionService.generateVideoRoom(type, targetId, 20)
        const roomName = res.roomName || res.room_name || `skillbinimoy-${type}-${targetId}`
        setJitsiMeeting({
          roomName,
          title: res.title || title || `${type === 'group' ? 'Group' : 'Session'} Call`,
          durationMinutes: res.durationMinutes || 20,
          meetingLink: meetingLink || `https://meet.jit.si/${roomName}`
        })
      } catch (err) {
        if (meetingLink) {
          const roomFromLink = meetingLink.split('/').pop() || `skillbinimoy-${type}-${targetId}`
          setJitsiMeeting({
            roomName: roomFromLink,
            title: title || `${type === 'group' ? 'Group' : 'Session'} Call`,
            durationMinutes: 20,
            meetingLink
          })
        } else {
          alert(err.message || 'Could not join conference room.')
        }
      }
      return
    }

    // Direct 1-on-1 WebRTC Call
    try {
      setConnectionState('calling')

      // 1. Acquire Local Media
      const stream = await acquireMedia(callType)

      // 2. Create WebRTC PeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG)
      peerConnectionRef.current = pc

      pc.ontrack = (event) => {
        const remoteMediaStream = (event.streams && event.streams[0]) || new MediaStream([event.track])
        remoteStreamRef.current = remoteMediaStream
        setRemoteStream(remoteMediaStream)
      }

      pc.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const state = peerConnectionRef.current.connectionState
          setConnectionState(state)
          if (['disconnected', 'failed', 'closed'].includes(state)) {
            endCall()
          }
        }
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      // 3. Create Offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 4. Send call initiation with offer to backend
      const res = await callService.initiateCall(targetId, callType, {
        type: offer.type,
        sdp: offer.sdp
      })
      const callId = res.callId || res.call_id

      setActiveCall({
        callId,
        isCaller: true,
        callType,
        partnerName: partnerName || 'Exchange Partner',
        partnerImage: partnerImage || '',
        title: title || `Call with ${partnerName}`,
        status: 'calling'
      })

      // Setup ICE candidate sender with callId
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          callService.sendCallSignal(callId, 'ice', e.candidate.toJSON(), 'caller').catch(() => {})
        }
      }

      setConnectionState('ringing')
      startRingingSound(false)
      startTitleFlash(`Calling ${partnerName || 'Peer'}...`)

      // 5. Poll call status until accepted or rejected
      let connected = false
      outgoingPollIntervalRef.current = setInterval(async () => {
        try {
          const check = await callService.checkCallStatus(callId)
          if (check.status === 'accepted' && !connected) {
            connected = true
            clearInterval(outgoingPollIntervalRef.current)
            stopRingingSound()
            stopTitleFlash()

            // Set remote description from answer
            if (check.answer && pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(check.answer))
            } else {
              const sig = await callService.getCallSignals(callId, 'caller')
              if (sig.answer && pc.signalingState !== 'stable') {
                await pc.setRemoteDescription(new RTCSessionDescription(sig.answer))
              }
            }

            setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null))
            setConnectionState('connected')
            startDurationTimer()

            // Poll ICE candidates from receiver
            signalingPollIntervalRef.current = setInterval(async () => {
              try {
                const sig = await callService.getCallSignals(callId, 'caller')
                if (sig.candidates && sig.candidates.length) {
                  for (const cand of sig.candidates) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(cand))
                    } catch {}
                  }
                }
              } catch {}
            }, 1200)

          } else if (['rejected', 'ended', 'missed', 'timeout'].includes(check.status)) {
            clearInterval(outgoingPollIntervalRef.current)
            stopRingingSound()
            stopTitleFlash()
            endCall()
            if (check.status === 'rejected') alert('Call declined.')
            else if (check.status === 'timeout') alert('No answer.')
          }
        } catch {
          // continue polling
        }
      }, 1500)
    } catch (err) {
      console.error('Initiate call error:', err)
      stopRingingSound()
      stopTitleFlash()
      endCall()
      alert(err.message || 'Could not initiate call.')
    }
  }

  // 3. Accept Incoming Call
  const acceptCall = async (preferredType) => {
    if (!incomingCall) return
    const call = incomingCall
    const selectedType = preferredType || call.callType || call.call_type || 'video'
    const callId = call.callId || call.call_id || call.id

    setIncomingCall(null)
    stopRingingSound()
    stopTitleFlash()

    setActiveCall({
      callId,
      isCaller: false,
      callType: selectedType,
      partnerName: call.callerName || call.caller_name || 'Exchange Partner',
      partnerImage: call.callerImage || call.caller_avatar || '',
      title: `Call with ${call.callerName || call.caller_name || 'Peer'}`,
      status: 'connecting'
    })

    try {
      setConnectionState('connecting')

      // 1. Acquire Local Media
      const stream = await acquireMedia(selectedType)

      // 2. Create WebRTC PeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG)
      peerConnectionRef.current = pc

      pc.ontrack = (event) => {
        const remoteMediaStream = (event.streams && event.streams[0]) || new MediaStream([event.track])
        remoteStreamRef.current = remoteMediaStream
        setRemoteStream(remoteMediaStream)
      }

      pc.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const state = peerConnectionRef.current.connectionState
          setConnectionState(state)
          if (['disconnected', 'failed', 'closed'].includes(state)) {
            endCall()
          }
        }
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          callService.sendCallSignal(callId, 'ice', e.candidate.toJSON(), 'receiver').catch(() => {})
        }
      }

      // 3. Set remote description from caller's offer
      let offer = call.offer
      if (!offer) {
        const sig = await callService.getCallSignals(callId, 'receiver')
        offer = sig.offer
      }

      if (!offer) {
        throw new Error('Call offer was not received.')
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      // 4. Create Answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // 5. Send answer in accept response
      await callService.respondCall(callId, 'accept', {
        type: answer.type,
        sdp: answer.sdp
      })

      callService.sendCallSignal(callId, 'answer', { type: answer.type, sdp: answer.sdp }, 'receiver').catch(() => {})

      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null))
      setConnectionState('connected')
      startDurationTimer()

      // 6. Poll ICE candidates from caller
      signalingPollIntervalRef.current = setInterval(async () => {
        try {
          const sig = await callService.getCallSignals(callId, 'receiver')
          if (sig.candidates && sig.candidates.length) {
            for (const cand of sig.candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand))
              } catch {}
            }
          }
        } catch {}
      }, 1200)

    } catch (err) {
      console.error('Accept call error:', err)
      endCall()
      alert(err.message || 'Failed to establish call.')
    }
  }

  // 4. Reject Incoming Call
  const rejectCall = async () => {
    if (!incomingCall) return
    const callId = incomingCall.callId || incomingCall.call_id || incomingCall.id
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
      try {
        peerConnectionRef.current.close()
      } catch {}
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
    return {
      incomingCall: null,
      activeCall: null,
      jitsiMeeting: null,
      callDuration: 0,
      isMicMuted: false,
      isCamOff: false,
      connectionState: 'idle',
      localStream: null,
      remoteStream: null,
      startCall: () => {},
      acceptCall: () => {},
      rejectCall: () => {},
      endCall: () => {},
      toggleMic: () => {},
      toggleCam: () => {}
    }
  }
  return context
}

