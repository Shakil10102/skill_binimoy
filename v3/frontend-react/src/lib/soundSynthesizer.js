// Web Audio API Ringtone Synthesizer
let audioCtx = null
let ringtoneTimer = null
let titleFlashInterval = null
let originalDocTitle = typeof document !== 'undefined' ? document.title : 'Skill Binimoy'

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) audioCtx = new AudioContextClass()
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// Auto-unlock audio on any user gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
  }
  window.addEventListener('click', unlockAudio, { passive: true })
  window.addEventListener('touchstart', unlockAudio, { passive: true })
  window.addEventListener('keydown', unlockAudio, { passive: true })
}

function playTone(freq, type, duration, startTime, gainLevel = 0.18) {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)

    gain.gain.setValueAtTime(0.001, startTime)
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration)
  } catch (e) {
    console.warn('Audio tone synthesis error:', e)
  }
}

export function startRingingSound(isIncoming = true) {
  stopRingingSound()
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  function playRingCycle() {
    const now = ctx.currentTime
    if (isIncoming) {
      // Pleasant Messenger chime: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz)
      playTone(659, 'sine', 0.2, now, 0.2)
      playTone(830, 'sine', 0.22, now + 0.18, 0.22)
      playTone(987, 'sine', 0.4, now + 0.36, 0.25)
    } else {
      // Outgoing Ringback: 440Hz + 480Hz
      playTone(440, 'sine', 1.2, now, 0.12)
      playTone(480, 'sine', 1.2, now, 0.12)
    }
  }

  playRingCycle()
  ringtoneTimer = setInterval(playRingCycle, isIncoming ? 2000 : 3500)
}

export function stopRingingSound() {
  if (ringtoneTimer) {
    clearInterval(ringtoneTimer)
    ringtoneTimer = null
  }
  stopTitleFlash()
}

export function startTitleFlash(text) {
  stopTitleFlash()
  if (typeof document === 'undefined') return
  originalDocTitle = document.title
  let toggle = false
  titleFlashInterval = setInterval(() => {
    document.title = toggle ? `🔔 ${text}` : `📞 Ringing...`
    toggle = !toggle
  }, 900)
}

export function stopTitleFlash() {
  if (titleFlashInterval) {
    clearInterval(titleFlashInterval)
    titleFlashInterval = null
  }
  if (typeof document !== 'undefined') {
    document.title = originalDocTitle || 'Skill Binimoy'
  }
}
