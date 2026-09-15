// ===================================================
// Skill Binimoy Video & Audio Calling Client
// Features:
// 1. Direct WebRTC Peer-to-Peer 1-on-1 Video Calling (No 8x8 login / No waiting screens)
// 2. Direct WebRTC Peer-to-Peer 1-on-1 Audio Calling (Voice Call with soundwaves)
// 3. Messenger-style Incoming / Outgoing Call Dialogs (Receive / Cut Call)
// 4. Synthesized Melodic Ringtone & Ringback Audio (Native Web Audio API)
// 5. Tab Title Flashing & Browser Notifications
// 6. Scheduled Sessions (20-Minute Timer Limit) & Group Conferences via Jitsi Meet
// ===================================================

(function () {
    if (window.startBinimoyVideoCall) return;

    // Call States & Global Handles
    let peerConnection = null;
    let localStream = null;
    let remoteStream = null;
    let currentCallType = 'video'; // 'video' or 'audio'
    let currentCallId = null;
    let isCaller = false;
    let isMicMuted = false;
    let isCamOff = false;

    let currentJitsiApi = null;
    let sessionTimerInterval = null;
    let callDurationInterval = null;
    let callDurationSeconds = 0;

    let pollIncomingInterval = null;
    let activeOutgoingCallId = null;
    let outgoingCheckInterval = null;
    let currentIncomingCall = null;
    let icePollInterval = null;

    // Web Audio API Ringtone Synthesizer
    let audioCtx = null;
    let ringtoneTimer = null;
    let titleFlashInterval = null;
    let originalDocTitle = document.title;

    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    };

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    // Auto-unlock audio on any user gesture
    function unlockAudioOnGesture() {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    }
    window.addEventListener('click', unlockAudioOnGesture, { passive: true });
    window.addEventListener('touchstart', unlockAudioOnGesture, { passive: true });
    window.addEventListener('keydown', unlockAudioOnGesture, { passive: true });

    // Request notification permission smoothly
    if (window.Notification && Notification.permission === 'default') {
        window.addEventListener('click', () => {
            Notification.requestPermission().catch(() => {});
        }, { once: true });
    }

    function playTone(freq, type, duration, startTime, gainLevel = 0.18) {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        } catch (e) {}
    }

    function startRingingSound(isIncoming = true) {
        stopRingingSound();
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        function playRingCycle() {
            const now = ctx.currentTime;
            if (isIncoming) {
                // Pleasant Messenger chime: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz)
                playTone(659, 'sine', 0.2, now, 0.2);
                playTone(830, 'sine', 0.22, now + 0.18, 0.22);
                playTone(987, 'sine', 0.4, now + 0.36, 0.25);
            } else {
                // Ringback tone: 440Hz + 480Hz
                playTone(440, 'sine', 1.2, now, 0.12);
                playTone(480, 'sine', 1.2, now, 0.12);
            }
        }

        playRingCycle();
        ringtoneTimer = setInterval(playRingCycle, isIncoming ? 2000 : 3500);
    }

    function stopRingingSound() {
        if (ringtoneTimer) {
            clearInterval(ringtoneTimer);
            ringtoneTimer = null;
        }
        stopTitleFlash();
    }

    function startTitleFlash(text) {
        stopTitleFlash();
        originalDocTitle = document.title;
        let toggle = false;
        titleFlashInterval = setInterval(() => {
            document.title = toggle ? `🔔 ${text}` : `📞 Ringing...`;
            toggle = !toggle;
        }, 900);
    }

    function stopTitleFlash() {
        if (titleFlashInterval) {
            clearInterval(titleFlashInterval);
            titleFlashInterval = null;
            document.title = originalDocTitle;
        }
    }

    function getInitials(name) {
        return (name || 'U').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }

    // Wait for ICE candidates gathering (Vanilla ICE fallback)
    function waitForIceGathering(pc, timeoutMs = 750) {
        return new Promise((resolve) => {
            if (pc.iceGatheringState === 'complete') {
                resolve();
                return;
            }
            const timer = setTimeout(() => resolve(), timeoutMs);
            const check = () => {
                if (pc.iceGatheringState === 'complete') {
                    clearTimeout(timer);
                    pc.removeEventListener('icegatheringstatechange', check);
                    resolve();
                }
            };
            pc.addEventListener('icegatheringstatechange', check);
        });
    }

    // Load Jitsi Meet script (only for scheduled 20-min sessions & group calls)
    function loadJitsiScript() {
        return new Promise((resolve, reject) => {
            if (window.JitsiMeetExternalAPI) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Jitsi script'));
            document.head.appendChild(script);
        });
    }

    // Get User Camera & Microphone
    async function acquireLocalMedia(callType = 'video') {
        const isVideo = callType === 'video';
        const constraints = {
            audio: true,
            video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            return stream;
        } catch (err) {
            console.warn('Could not get primary constraints, trying audio only fallback:', err);
            if (isVideo) {
                try {
                    const fallback = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    if (typeof showNotification === 'function') {
                        showNotification('Camera unavailable or blocked. Starting in audio-only mode.', 'info');
                    }
                    currentCallType = 'audio';
                    return fallback;
                } catch (err2) {
                    throw new Error('Microphone access is required to communicate.');
                }
            }
            throw err;
        }
    }

    // Ensure all Modals exist in DOM
    function ensureModals() {
        // 1. Direct In-Call Modal (WebRTC Canvas + Jitsi)
        if (!document.getElementById('binimoyVideoModal')) {
            const modal = document.createElement('div');
            modal.id = 'binimoyVideoModal';
            modal.className = 'binimoy-video-modal';
            modal.innerHTML = `
                <div class="binimoy-video-header">
                    <div class="binimoy-video-info">
                        <div class="binimoy-video-icon" id="binimoyHeaderIcon">📹</div>
                        <div>
                            <h3 class="binimoy-video-title" id="binimoyCallTitle">Call</h3>
                            <p class="binimoy-video-subtitle" id="binimoyCallSubtitle">Skill Binimoy</p>
                        </div>
                    </div>

                    <!-- Live Duration Timer Badge -->
                    <div class="binimoy-call-timer" id="binimoyCallTimerWrap">
                        <span class="binimoy-timer-icon" id="binimoyTimerIcon">⏳</span>
                        <span id="binimoyCallTimer">00:00</span>
                    </div>

                    <div class="binimoy-video-actions">
                        <button class="binimoy-end-call-btn" id="binimoyEndCallBtn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                                <line x1="23" y1="1" x2="1" y2="23"></line>
                            </svg>
                            <span>End Call</span>
                        </button>
                    </div>
                </div>

                <div class="binimoy-video-frame-wrap">
                    <!-- Direct WebRTC Video Canvas -->
                    <div id="binimoyDirectVideoCanvas" class="binimoy-direct-call-wrap" style="display:none">
                        <video id="binimoyRemoteVideo" class="binimoy-remote-video" autoplay playsinline></video>
                        <div id="binimoyLocalVideoWrap" class="binimoy-local-video-wrap">
                            <video id="binimoyLocalVideo" class="binimoy-local-video" autoplay playsinline muted></video>
                        </div>
                        
                        <!-- Floating Controls for Video Call -->
                        <div class="binimoy-incall-controls">
                            <button class="binimoy-incall-btn" id="binimoyMuteMicBtn" title="Mute/Unmute Mic">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                            </button>
                            <button class="binimoy-incall-btn" id="binimoyToggleCamBtn" title="Camera On/Off">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                </svg>
                            </button>
                            <button class="binimoy-incall-btn end-call" id="binimoyDirectHangupBtn" title="End Call">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                                    <line x1="23" y1="1" x2="1" y2="23"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Direct WebRTC Audio Canvas -->
                    <div id="binimoyDirectAudioCanvas" class="binimoy-direct-call-wrap" style="display:none">
                        <audio id="binimoyRemoteAudio" autoplay></audio>
                        <div class="binimoy-direct-audio-canvas">
                            <div class="binimoy-audio-soundwaves">
                                <div class="binimoy-audio-avatar-lg" id="binimoyAudioAvatar">U</div>
                            </div>
                            <h2 class="binimoy-audio-partner-name" id="binimoyAudioPartnerName">Friend Name</h2>
                            <div class="binimoy-audio-call-status">
                                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981"></span>
                                <span>Voice Connected</span>
                            </div>
                            
                            <!-- Floating Controls for Audio Call -->
                            <div class="binimoy-incall-controls">
                                <button class="binimoy-incall-btn" id="binimoyAudioMuteMicBtn" title="Mute/Unmute Mic">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                    </svg>
                                </button>
                                <button class="binimoy-incall-btn end-call" id="binimoyAudioHangupBtn" title="End Call">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                                        <line x1="23" y1="1" x2="1" y2="23"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Jitsi Container (for groups and 20-min sessions) -->
                    <div id="jitsiMeetContainer" style="display:none;width:100%;height:100%"></div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('binimoyEndCallBtn').addEventListener('click', closeVideoCall);
            document.getElementById('binimoyDirectHangupBtn').addEventListener('click', closeVideoCall);
            document.getElementById('binimoyAudioHangupBtn').addEventListener('click', closeVideoCall);

            document.getElementById('binimoyMuteMicBtn').addEventListener('click', toggleMic);
            document.getElementById('binimoyAudioMuteMicBtn').addEventListener('click', toggleMic);
            document.getElementById('binimoyToggleCamBtn').addEventListener('click', toggleCam);
        }

        // 2. Incoming Call Dialog (Messenger style)
        if (!document.getElementById('binimoyIncomingCallModal')) {
            const incModal = document.createElement('div');
            incModal.id = 'binimoyIncomingCallModal';
            incModal.className = 'binimoy-call-dialog-overlay';
            incModal.innerHTML = `
                <div class="binimoy-call-card">
                    <div class="binimoy-call-avatar-wrap" id="binimoyIncomingAvatarWrap">
                        <div class="binimoy-call-avatar" id="binimoyIncomingAvatar">U</div>
                    </div>
                    <h3 class="binimoy-call-caller-name" id="binimoyIncomingName">Friend Name</h3>
                    <p class="binimoy-call-substatus" id="binimoyIncomingSubstatus">📹 Incoming Video Call...</p>
                    <div class="binimoy-call-buttons-row">
                        <div style="display:flex;flex-direction:column;align-items:center">
                            <button class="binimoy-call-btn-circle accept" id="binimoyAcceptCallBtn" title="Accept Call">
                                <svg id="binimoyAcceptIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                </svg>
                            </button>
                            <span class="binimoy-btn-label">Receive</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center">
                            <button class="binimoy-call-btn-circle decline" id="binimoyDeclineCallBtn" title="Decline Call">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                            <span class="binimoy-btn-label">Cut Call</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(incModal);

            document.getElementById('binimoyAcceptCallBtn').addEventListener('click', handleAcceptIncomingCall);
            document.getElementById('binimoyDeclineCallBtn').addEventListener('click', handleDeclineIncomingCall);
        }

        // 3. Outgoing Call Dialog (Calling...)
        if (!document.getElementById('binimoyOutgoingCallModal')) {
            const outModal = document.createElement('div');
            outModal.id = 'binimoyOutgoingCallModal';
            outModal.className = 'binimoy-call-dialog-overlay';
            outModal.innerHTML = `
                <div class="binimoy-call-card">
                    <div class="binimoy-call-avatar-wrap outgoing" id="binimoyOutgoingAvatarWrap">
                        <div class="binimoy-call-avatar" id="binimoyOutgoingAvatar">U</div>
                    </div>
                    <h3 class="binimoy-call-caller-name" id="binimoyOutgoingName">Friend Name</h3>
                    <p class="binimoy-call-substatus" id="binimoyOutgoingStatus">Calling... 🔔</p>
                    <div class="binimoy-call-buttons-row">
                        <div style="display:flex;flex-direction:column;align-items:center">
                            <button class="binimoy-call-btn-circle decline" id="binimoyCancelCallBtn" title="Cancel Call">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                            <span class="binimoy-btn-label">Cancel</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(outModal);

            document.getElementById('binimoyCancelCallBtn').addEventListener('click', handleCancelOutgoingCall);
        }
    }

    // Toggle Microphone
    function toggleMic() {
        if (!localStream) return;
        const audioTracks = localStream.getAudioTracks();
        if (!audioTracks.length) return;

        isMicMuted = !isMicMuted;
        audioTracks.forEach(t => t.enabled = !isMicMuted);

        const btn1 = document.getElementById('binimoyMuteMicBtn');
        const btn2 = document.getElementById('binimoyAudioMuteMicBtn');
        [btn1, btn2].forEach(b => {
            if (b) {
                b.classList.toggle('muted', isMicMuted);
                b.title = isMicMuted ? 'Unmute Mic' : 'Mute Mic';
            }
        });

        if (typeof showNotification === 'function') {
            showNotification(isMicMuted ? 'Microphone muted 🔇' : 'Microphone unmuted 🎙️', 'info');
        }
    }

    // Toggle Camera
    function toggleCam() {
        if (!localStream) return;
        const videoTracks = localStream.getVideoTracks();
        if (!videoTracks.length) return;

        isCamOff = !isCamOff;
        videoTracks.forEach(t => t.enabled = !isCamOff);

        const btn = document.getElementById('binimoyToggleCamBtn');
        if (btn) {
            btn.classList.toggle('muted', isCamOff);
            btn.title = isCamOff ? 'Turn Camera On' : 'Turn Camera Off';
        }

        if (typeof showNotification === 'function') {
            showNotification(isCamOff ? 'Camera turned off' : 'Camera turned on', 'info');
        }
    }

    // Start Live Call Timer (Counts up from 00:00)
    function startCallTimer() {
        clearInterval(callDurationInterval);
        callDurationSeconds = 0;
        const timerWrap = document.getElementById('binimoyCallTimerWrap');
        const timerEl = document.getElementById('binimoyCallTimer');
        const timerIcon = document.getElementById('binimoyTimerIcon');

        timerWrap.style.display = 'flex';
        timerWrap.className = 'binimoy-call-timer';
        timerIcon.textContent = '⏱️';
        timerEl.textContent = '00:00';

        callDurationInterval = setInterval(() => {
            callDurationSeconds++;
            const m = Math.floor(callDurationSeconds / 60);
            const s = callDurationSeconds % 60;
            timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // Start 20-Minute Countdown (For Scheduled Learning Sessions)
    function startSessionCountdown(durationMinutes = 20) {
        clearInterval(sessionTimerInterval);
        const timerWrap = document.getElementById('binimoyCallTimerWrap');
        const timerEl = document.getElementById('binimoyCallTimer');
        const timerIcon = document.getElementById('binimoyTimerIcon');

        timerWrap.style.display = 'flex';
        timerWrap.className = 'binimoy-call-timer';
        timerIcon.textContent = '⏳';

        let secondsLeft = Math.floor(durationMinutes * 60);
        let warned5Min = false;
        let warned1Min = false;

        function updateDisplay() {
            const m = Math.floor(secondsLeft / 60);
            const s = secondsLeft % 60;
            timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (secondsLeft <= 60) {
                timerWrap.className = 'binimoy-call-timer urgent';
                if (!warned1Min) {
                    warned1Min = true;
                    if (typeof showNotification === 'function') showNotification('⚠️ 1 minute remaining in this session!', 'error');
                }
            } else if (secondsLeft <= 300) {
                timerWrap.className = 'binimoy-call-timer warning';
                if (!warned5Min) {
                    warned5Min = true;
                    if (typeof showNotification === 'function') showNotification('⏳ 5 minutes remaining in this 20-minute session.', 'info');
                }
            } else {
                timerWrap.className = 'binimoy-call-timer';
            }

            if (secondsLeft <= 0) {
                clearInterval(sessionTimerInterval);
                if (typeof showNotification === 'function') showNotification('⏰ 20-minute session time has ended!', 'success');
                closeVideoCall();
            } else {
                secondsLeft--;
            }
        }

        updateDisplay();
        sessionTimerInterval = setInterval(updateDisplay, 1000);
    }

    // Open Direct In-Call Screen
    function openDirectCallScreen(callType, partnerName, partnerImage) {
        ensureModals();
        currentCallType = callType;

        const modal = document.getElementById('binimoyVideoModal');
        modal.classList.add('active');

        document.getElementById('binimoyCallTitle').textContent = (callType === 'audio') ? 'Audio Call' : 'Video Call';
        document.getElementById('binimoyHeaderIcon').textContent = (callType === 'audio') ? '📞' : '📹';
        document.getElementById('binimoyCallSubtitle').textContent = `with ${partnerName}`;

        document.getElementById('jitsiMeetContainer').style.display = 'none';

        if (callType === 'video') {
            document.getElementById('binimoyDirectVideoCanvas').style.display = 'flex';
            document.getElementById('binimoyDirectAudioCanvas').style.display = 'none';

            // Connect local preview
            const localVid = document.getElementById('binimoyLocalVideo');
            if (localVid && localStream) localVid.srcObject = localStream;
        } else {
            document.getElementById('binimoyDirectAudioCanvas').style.display = 'flex';
            document.getElementById('binimoyDirectVideoCanvas').style.display = 'none';

            document.getElementById('binimoyAudioPartnerName').textContent = partnerName || 'Friend';
            const av = document.getElementById('binimoyAudioAvatar');
            if (partnerImage) av.innerHTML = `<img src="${partnerImage}">`;
            else av.textContent = getInitials(partnerName);
        }

        startCallTimer();
    }

    // Close Call & Reset Everything
    function closeVideoCall() {
        clearInterval(sessionTimerInterval);
        clearInterval(callDurationInterval);
        clearInterval(icePollInterval);
        stopRingingSound();

        // Close WebRTC
        if (peerConnection) {
            try { peerConnection.close(); } catch (e) {}
            peerConnection = null;
        }

        // Stop media tracks
        if (localStream) {
            try { localStream.getTracks().forEach(t => t.stop()); } catch (e) {}
            localStream = null;
        }

        // Close Jitsi if active
        if (currentJitsiApi) {
            try {
                currentJitsiApi.executeCommand('hangup');
                currentJitsiApi.dispose();
            } catch (e) {}
            currentJitsiApi = null;
        }

        // Notify server that call ended
        if (currentCallId) {
            const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${API}/api/users/call/cancel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ callId: currentCallId })
                }).catch(() => {});
            }
            currentCallId = null;
        }

        const modal = document.getElementById('binimoyVideoModal');
        if (modal) modal.classList.remove('active');

        const remoteVid = document.getElementById('binimoyRemoteVideo');
        if (remoteVid) remoteVid.srcObject = null;
        const localVid = document.getElementById('binimoyLocalVideo');
        if (localVid) localVid.srcObject = null;
        const remoteAud = document.getElementById('binimoyRemoteAudio');
        if (remoteAud) remoteAud.srcObject = null;

        const jitsiContainer = document.getElementById('jitsiMeetContainer');
        if (jitsiContainer) jitsiContainer.innerHTML = '';

        isMicMuted = false;
        isCamOff = false;
    }

    // ===================================================
    // Messenger-style WebRTC Direct Call Flow
    // ===================================================

    // Start ICE candidate polling for trickle candidates
    function startIcePolling(callId, role) {
        clearInterval(icePollInterval);
        const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
        const token = localStorage.getItem('token');

        let ticks = 0;
        icePollInterval = setInterval(async () => {
            ticks++;
            if (ticks > 15 || !peerConnection) { // Stop after 15 polls (~22s)
                clearInterval(icePollInterval);
                return;
            }
            try {
                const res = await fetch(`${API}/api/users/call/signal/${callId}?role=${role}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data.candidates && data.candidates.length && peerConnection) {
                    for (const cand of data.candidates) {
                        try {
                            await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
                        } catch (err) {}
                    }
                }
            } catch (e) {}
        }, 1500);
    }

    // Send ICE candidate to server
    function sendCandidate(callId, candidate, role) {
        const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
        const token = localStorage.getItem('token');
        if (!token || !candidate) return;

        fetch(`${API}/api/users/call/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ callId, candidate, role })
        }).catch(() => {});
    }

    // User A calls User B (Outgoing)
    async function startDirectCallFlow(receiverId, partnerName, partnerImage, callType = 'video') {
        ensureModals();
        currentCallType = callType;
        isCaller = true;

        const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
        const token = localStorage.getItem('token');

        // Setup Outgoing Modal
        document.getElementById('binimoyOutgoingName').textContent = partnerName || 'Friend';
        document.getElementById('binimoyOutgoingStatus').textContent = (callType === 'audio')
            ? 'Calling (Voice Call)... 🔔'
            : 'Calling (Video Call)... 🔔';

        const avatarEl = document.getElementById('binimoyOutgoingAvatar');
        if (partnerImage) avatarEl.innerHTML = `<img src="${partnerImage}">`;
        else avatarEl.textContent = getInitials(partnerName);

        document.getElementById('binimoyOutgoingCallModal').classList.add('active');
        startRingingSound(false); // Ringback tone

        try {
            // 1. Acquire Local Media (Cam + Mic for Video, Mic only for Audio)
            localStream = await acquireLocalMedia(callType);

            // 2. Create WebRTC PeerConnection
            peerConnection = new RTCPeerConnection(rtcConfig);

            // Add local tracks to peer connection
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // Listen for remote streams
            peerConnection.ontrack = (event) => {
                const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
                const remoteVid = document.getElementById('binimoyRemoteVideo');
                const remoteAud = document.getElementById('binimoyRemoteAudio');
                if (remoteVid) {
                    remoteVid.srcObject = stream;
                    remoteVid.play().catch(() => {});
                }
                if (remoteAud) {
                    remoteAud.srcObject = stream;
                    remoteAud.play().catch(() => {});
                }
            };

            // ICE Candidate handler
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && activeOutgoingCallId) {
                    sendCandidate(activeOutgoingCallId, event.candidate, 'caller');
                }
            };

            peerConnection.onconnectionstatechange = () => {
                if (peerConnection && ['disconnected', 'failed'].includes(peerConnection.connectionState)) {
                    if (typeof showNotification === 'function') showNotification('Call disconnected', 'info');
                    closeVideoCall();
                }
            };

            // 3. Create Offer
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: (callType === 'video')
            });
            await peerConnection.setLocalDescription(offer);

            // Wait for ICE candidates to gather in SDP (Vanilla ICE)
            await waitForIceGathering(peerConnection, 700);

            // 4. Send call request to backend with SDP offer
            const res = await fetch(`${API}/api/users/call/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    receiverId,
                    callType,
                    offer: peerConnection.localDescription
                })
            });

            const data = await res.json();
            if (!res.ok) {
                stopRingingSound();
                document.getElementById('binimoyOutgoingCallModal').classList.remove('active');
                if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
                if (typeof showNotification === 'function') showNotification(data.message || 'Call failed', 'error');
                return;
            }

            activeOutgoingCallId = data.callId;
            currentCallId = data.callId;

            // 5. Poll status of outgoing call every 1.5s
            clearInterval(outgoingCheckInterval);
            outgoingCheckInterval = setInterval(async () => {
                try {
                    const checkRes = await fetch(`${API}/api/users/call/check/${activeOutgoingCallId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const checkData = await checkRes.json();

                    if (checkData.status === 'accepted') {
                        clearInterval(outgoingCheckInterval);
                        stopRingingSound();
                        document.getElementById('binimoyOutgoingCallModal').classList.remove('active');

                        // Set remote description from receiver's answer!
                        if (checkData.answer && peerConnection) {
                            try {
                                await peerConnection.setRemoteDescription(new RTCSessionDescription(checkData.answer));
                            } catch (e) { console.warn('Remote description error:', e); }
                        }

                        // Open direct communication UI!
                        openDirectCallScreen(callType, partnerName, partnerImage);
                        startIcePolling(activeOutgoingCallId, 'caller');

                    } else if (checkData.status === 'rejected') {
                        clearInterval(outgoingCheckInterval);
                        stopRingingSound();
                        document.getElementById('binimoyOutgoingStatus').textContent = 'Call Declined ❌';
                        setTimeout(() => {
                            document.getElementById('binimoyOutgoingCallModal').classList.remove('active');
                            closeVideoCall();
                        }, 1800);

                    } else if (checkData.status === 'timeout') {
                        clearInterval(outgoingCheckInterval);
                        stopRingingSound();
                        document.getElementById('binimoyOutgoingStatus').textContent = 'No Answer ⏳';
                        setTimeout(() => {
                            document.getElementById('binimoyOutgoingCallModal').classList.remove('active');
                            closeVideoCall();
                        }, 1800);
                    }
                } catch (e) {}
            }, 1500);

        } catch (err) {
            stopRingingSound();
            document.getElementById('binimoyOutgoingCallModal').classList.remove('active');
            if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
            if (typeof showNotification === 'function') showNotification(err.message || 'Connection error', 'error');
        }
    }

    // User A cancels outgoing call
    async function handleCancelOutgoingCall() {
        const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
        const token = localStorage.getItem('token');

        clearInterval(outgoingCheckInterval);
        stopRingingSound();
        document.getElementById('binimoyOutgoingCallModal').classList.remove('active');

        if (activeOutgoingCallId && token) {
            try {
                await fetch(`${API}/api/users/call/cancel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ callId: activeOutgoingCallId })
                });
            } catch (e) {}
            activeOutgoingCallId = null;
        }

        if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
        if (peerConnection) { try { peerConnection.close(); } catch (e) {} peerConnection = null; }
    }

    // User B receives call -> Click "Receive"
    async function handleAcceptIncomingCall() {
        if (!currentIncomingCall) return;
        const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
        const token = localStorage.getItem('token');
        const call = currentIncomingCall;

        stopRingingSound();
        document.getElementById('binimoyIncomingCallModal').classList.remove('active');
        currentIncomingCall = null;
        currentCallId = call.callId;
        currentCallType = call.callType || 'video';
        isCaller = false;

        try {
            // 1. Acquire Local Media
            localStream = await acquireLocalMedia(currentCallType);

            // 2. Create WebRTC PeerConnection
            peerConnection = new RTCPeerConnection(rtcConfig);

            // Add local tracks
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // Listen for remote tracks
            peerConnection.ontrack = (event) => {
                const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
                const remoteVid = document.getElementById('binimoyRemoteVideo');
                const remoteAud = document.getElementById('binimoyRemoteAudio');
                if (remoteVid) {
                    remoteVid.srcObject = stream;
                    remoteVid.play().catch(() => {});
                }
                if (remoteAud) {
                    remoteAud.srcObject = stream;
                    remoteAud.play().catch(() => {});
                }
            };

            // ICE Candidate handler
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && call.callId) {
                    sendCandidate(call.callId, event.candidate, 'receiver');
                }
            };

            peerConnection.onconnectionstatechange = () => {
                if (peerConnection && ['disconnected', 'failed'].includes(peerConnection.connectionState)) {
                    if (typeof showNotification === 'function') showNotification('Call disconnected', 'info');
                    closeVideoCall();
                }
            };

            // 3. Set remote description from caller's offer
            if (call.offer) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(call.offer));
            }

            // 4. Create answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Wait for ICE candidates in SDP
            await waitForIceGathering(peerConnection, 700);

            // 5. Send accept response with SDP answer
            await fetch(`${API}/api/users/call/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    callId: call.callId,
                    action: 'accept',
                    answer: peerConnection.localDescription
                })
            });

            // 6. Open direct communication UI!
            openDirectCallScreen(currentCallType, call.callerName, call.callerImage);
            startIcePolling(call.callId, 'receiver');

        } catch (e) {
            console.error('Accept error:', e);
            if (typeof showNotification === 'function') showNotification('Failed to connect call', 'error');
            closeVideoCall();
        }
    }

    // User B receives call -> Click "Cut Call"
    async function handleDeclineIncomingCall() {
        if (!currentIncomingCall) return;
        const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
        const token = localStorage.getItem('token');
        const call = currentIncomingCall;

        stopRingingSound();
        document.getElementById('binimoyIncomingCallModal').classList.remove('active');
        currentIncomingCall = null;

        try {
            await fetch(`${API}/api/users/call/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ callId: call.callId, action: 'reject' })
            });
        } catch (e) {}
    }

    // Background poller: checks for incoming calls every 2 seconds
    function startIncomingCallPoller() {
        if (pollIncomingInterval) return;

        pollIncomingInterval = setInterval(async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Don't poll if already in an active direct call or Jitsi room
            if (peerConnection || currentJitsiApi) return;

            const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
            try {
                const res = await fetch(`${API}/api/users/call/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;

                const data = await res.json();
                if (data && data.incomingCall) {
                    const inc = data.incomingCall;

                    // If not already showing this incoming call
                    if (!currentIncomingCall || currentIncomingCall.callId !== inc.callId) {
                        currentIncomingCall = inc;
                        ensureModals();

                        document.getElementById('binimoyIncomingName').textContent = inc.callerName || 'Friend';
                        const avatarEl = document.getElementById('binimoyIncomingAvatar');
                        if (inc.callerImage) {
                            avatarEl.innerHTML = `<img src="${inc.callerImage}">`;
                        } else {
                            avatarEl.textContent = getInitials(inc.callerName);
                        }

                        // Customize substatus and icons based on callType ('audio' or 'video')
                        const isAudio = (inc.callType === 'audio');
                        document.getElementById('binimoyIncomingSubstatus').textContent = isAudio
                            ? '📞 Incoming Audio Call...'
                            : '📹 Incoming Video Call...';

                        const acceptIcon = document.getElementById('binimoyAcceptIcon');
                        if (acceptIcon) {
                            if (isAudio) {
                                acceptIcon.innerHTML = `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2z"></path>`;
                            } else {
                                acceptIcon.innerHTML = `<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>`;
                            }
                        }

                        document.getElementById('binimoyIncomingCallModal').classList.add('active');
                        startRingingSound(true);
                        startTitleFlash(isAudio ? `Incoming Audio Call from ${inc.callerName}` : `Incoming Video Call from ${inc.callerName}`);

                        // Desktop notification if permitted
                        if (window.Notification && Notification.permission === 'granted') {
                            try {
                                const notif = new Notification(isAudio ? `📞 Incoming Voice Call from ${inc.callerName}` : `📹 Incoming Video Call from ${inc.callerName}`, {
                                    body: 'Click to answer call on Skill Binimoy',
                                    icon: inc.callerImage || '',
                                    tag: 'binimoy-call-' + inc.callId
                                });
                                notif.onclick = () => {
                                    window.focus();
                                    notif.close();
                                };
                            } catch (e) {}
                        }
                    }
                } else {
                    // Call was cancelled or timed out
                    if (currentIncomingCall) {
                        currentIncomingCall = null;
                        stopRingingSound();
                        stopTitleFlash();
                        const modal = document.getElementById('binimoyIncomingCallModal');
                        if (modal) modal.classList.remove('active');
                    }
                }
            } catch (e) {}
        }, 2000);
    }

    // ===================================================
    // Jitsi Meet Rooms (For Scheduled 20-min Sessions & Group Calls)
    // ===================================================
    async function openJitsiRoom(roomName, durationMinutes, title, partnerName) {
        ensureModals();
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        document.getElementById('binimoyCallTitle').textContent = title || 'Video Call';
        document.getElementById('binimoyHeaderIcon').textContent = '📹';
        document.getElementById('binimoyCallSubtitle').textContent = partnerName ? `with ${partnerName}` : 'Skill Binimoy Session';

        const modal = document.getElementById('binimoyVideoModal');
        modal.classList.add('active');

        document.getElementById('binimoyDirectVideoCanvas').style.display = 'none';
        document.getElementById('binimoyDirectAudioCanvas').style.display = 'none';

        const container = document.getElementById('jitsiMeetContainer');
        container.style.display = 'block';
        container.innerHTML = '';

        try {
            await loadJitsiScript();
        } catch (e) {
            alert('Failed to connect to video service. Please check your internet connection.');
            closeVideoCall();
            return;
        }

        const domain = 'meet.jit.si';
        const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: container,
            userInfo: {
                displayName: user.full_name || 'Skill Binimoy Member'
            },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                prejoinPageEnabled: false,
                disableDeepLinking: true,
                enableWelcomePage: false
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                SHOW_BRAND_WATERMARK: false,
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'chat', 'raisehand',
                    'videoquality', 'tileview'
                ]
            }
        };

        currentJitsiApi = new window.JitsiMeetExternalAPI(domain, options);
        currentJitsiApi.addEventListener('videoConferenceLeft', () => {
            closeVideoCall();
        });

        if (durationMinutes) {
            startSessionCountdown(durationMinutes);
        } else {
            startCallTimer();
        }
    }

    // ===================================================
    // Main Entry Function
    // ===================================================
    async function startBinimoyVideoCall({ type, callType = 'video', targetId, title, partnerName, partnerImage }) {
        ensureModals();

        // 1. Direct call with friend: Use Native WebRTC Peer-to-Peer Communication!
        if (type === 'direct') {
            await startDirectCallFlow(targetId, partnerName, partnerImage, callType);
            return;
        }

        // 2. Scheduled session: 20-minute timer session joins Jitsi room
        if (type === 'session') {
            const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
            const token = localStorage.getItem('token');
            let roomName = `skillbinimoy-session-${targetId}`;
            let durationMinutes = 20;

            if (token && targetId) {
                try {
                    const res = await fetch(`${API}/api/users/video-room`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ type: 'session', targetId })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        roomName = data.roomName;
                        durationMinutes = data.durationMinutes || 20;
                    }
                } catch (e) {}
            }
            openJitsiRoom(roomName, durationMinutes, title || '20-Min Learning Session', partnerName);
            return;
        }

        // 3. Group video call: Direct join into group conference
        if (type === 'group') {
            const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
            const token = localStorage.getItem('token');
            let roomName = `skillbinimoy-group-${targetId}`;

            if (token && targetId) {
                try {
                    const res = await fetch(`${API}/api/users/video-room`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ type: 'group', targetId })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        roomName = data.roomName;
                    }
                } catch (e) {}
            }
            openJitsiRoom(roomName, null, title || 'Group Video Call', partnerName);
            return;
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        ensureModals();
        startIncomingCallPoller();
    });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        ensureModals();
        startIncomingCallPoller();
    }

    // Expose globals
    window.startBinimoyVideoCall = startBinimoyVideoCall;
    window.closeBinimoyVideoCall = closeVideoCall;
})();
