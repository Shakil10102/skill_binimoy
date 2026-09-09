// ===================================================
// Skill Binimoy Video Calling Client (Jitsi Meet & Messenger-style Call Alerts)
// ===================================================

(function () {
    if (window.startBinimoyVideoCall) return;

    let currentJitsiApi = null;
    let timerInterval = null;
    let pollIncomingInterval = null;
    let activeOutgoingCallId = null;
    let outgoingCheckInterval = null;
    let currentIncomingCall = null;

    // Web Audio API Ringtone Synthesizer
    let audioCtx = null;
    let ringtoneTimer = null;
    let titleFlashInterval = null;
    let originalDocTitle = document.title;

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

    // Auto-unlock audio on any user interaction
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

    function playTone(freq, type, duration, startTime, gainLevel = 0.15) {
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
                // Pleasant Messenger-style bell chime: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz)
                playTone(659, 'sine', 0.2, now, 0.2);
                playTone(830, 'sine', 0.22, now + 0.18, 0.22);
                playTone(987, 'sine', 0.4, now + 0.36, 0.25);
            } else {
                // Standard ringback tone: 440Hz + 480Hz
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

    function startTitleFlash(callerName) {
        stopTitleFlash();
        originalDocTitle = document.title;
        let toggle = false;
        titleFlashInterval = setInterval(() => {
            document.title = toggle ? `🔔 Incoming Call from ${callerName}!` : `📞 Ringing... (${callerName})`;
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

    // Load Jitsi Meet External Script dynamically
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
            script.onerror = () => reject(new Error('Failed to load Jitsi Meet script'));
            document.head.appendChild(script);
        });
    }

    function getInitials(name) {
        return (name || 'U').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }

    // Ensure all Modals (Video Call, Incoming Dialog, Outgoing Dialog) exist in DOM
    function ensureModals() {
        // 1. Video Call Modal
        if (!document.getElementById('binimoyVideoModal')) {
            const modal = document.createElement('div');
            modal.id = 'binimoyVideoModal';
            modal.className = 'binimoy-video-modal';
            modal.innerHTML = `
                <div class="binimoy-video-header">
                    <div class="binimoy-video-info">
                        <div class="binimoy-video-icon">📹</div>
                        <div>
                            <h3 class="binimoy-video-title" id="binimoyCallTitle">Video Call</h3>
                            <p class="binimoy-video-subtitle" id="binimoyCallSubtitle">Skill Binimoy Session</p>
                        </div>
                    </div>

                    <!-- 20-Minute Countdown Timer -->
                    <div class="binimoy-call-timer" id="binimoyCallTimerWrap" style="display:none">
                        <span class="binimoy-timer-icon">⏳</span>
                        <span id="binimoyCallTimer">20:00</span>
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
                    <div id="jitsiMeetContainer"></div>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('binimoyEndCallBtn').addEventListener('click', closeVideoCall);
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
                    <p class="binimoy-call-substatus">📹 Incoming Video Call...</p>
                    <div class="binimoy-call-buttons-row">
                        <div style="display:flex;flex-direction:column;align-items:center">
                            <button class="binimoy-call-btn-circle accept" id="binimoyAcceptCallBtn" title="Accept Call">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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

    // Start Timer Countdown (20 minutes max for learning sessions)
    function startCountdown(durationMinutes) {
        clearInterval(timerInterval);
        const timerWrap = document.getElementById('binimoyCallTimerWrap');
        const timerEl = document.getElementById('binimoyCallTimer');

        if (!durationMinutes) {
            timerWrap.style.display = 'none';
            return;
        }

        timerWrap.style.display = 'flex';
        timerWrap.className = 'binimoy-call-timer';
        let warned5Min = false;
        let warned1Min = false;

        let secondsLeft = Math.floor(durationMinutes * 60);

        function updateDisplay() {
            const m = Math.floor(secondsLeft / 60);
            const s = secondsLeft % 60;
            timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (secondsLeft <= 60) {
                timerWrap.className = 'binimoy-call-timer urgent';
                if (!warned1Min) {
                    warned1Min = true;
                    if (typeof showNotification === 'function') {
                        showNotification('⚠️ 1 minute remaining in this session!', 'error');
                    }
                }
            } else if (secondsLeft <= 300) {
                timerWrap.className = 'binimoy-call-timer warning';
                if (!warned5Min) {
                    warned5Min = true;
                    if (typeof showNotification === 'function') {
                        showNotification('⏳ 5 minutes remaining in this 20-minute session.', 'info');
                    }
                }
            } else {
                timerWrap.className = 'binimoy-call-timer';
            }

            if (secondsLeft <= 0) {
                clearInterval(timerInterval);
                if (typeof showNotification === 'function') {
                    showNotification('⏰ 20-minute session time has ended! Great job sharing knowledge.', 'success');
                }
                closeVideoCall();
            } else {
                secondsLeft--;
            }
        }

        updateDisplay();
        timerInterval = setInterval(updateDisplay, 1000);
    }

    // Close Video Call Frame
    function closeVideoCall() {
        clearInterval(timerInterval);
        stopRingingSound();

        if (currentJitsiApi) {
            try {
                currentJitsiApi.executeCommand('hangup');
                currentJitsiApi.dispose();
            } catch (e) {}
            currentJitsiApi = null;
        }

        const modal = document.getElementById('binimoyVideoModal');
        if (modal) modal.classList.remove('active');

        const container = document.getElementById('jitsiMeetContainer');
        if (container) container.innerHTML = '';
    }

    // Embed and Open Jitsi Room
    async function openJitsiRoom(roomName, durationMinutes, title, partnerName) {
        ensureModals();
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        document.getElementById('binimoyCallTitle').textContent = title || 'Video Call';
        document.getElementById('binimoyCallSubtitle').textContent = partnerName ? `with ${partnerName}` : 'Skill Binimoy Video';

        const modal = document.getElementById('binimoyVideoModal');
        modal.classList.add('active');

        try {
            await loadJitsiScript();
        } catch (e) {
            alert('Failed to connect to video service. Please check your internet connection.');
            closeVideoCall();
            return;
        }

        const container = document.getElementById('jitsiMeetContainer');
        container.innerHTML = '';

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

        startCountdown(durationMinutes);
    }

    // ===================================================
    // Messenger-style Call Flow (Direct Friend Calls)
    // ===================================================

    // User A clicks Call -> Initiate Outgoing Call
    async function startDirectCallFlow(receiverId, partnerName, partnerImage) {
        ensureModals();
        const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
        const token = localStorage.getItem('token');

        // Setup Outgoing Modal
        document.getElementById('binimoyOutgoingName').textContent = partnerName || 'Friend';
        document.getElementById('binimoyOutgoingStatus').textContent = 'Calling... 🔔';
        const avatarEl = document.getElementById('binimoyOutgoingAvatar');
        if (partnerImage) {
            avatarEl.innerHTML = `<img src="${partnerImage}">`;
        } else {
            avatarEl.textContent = getInitials(partnerName);
        }

        document.getElementById('binimoyOutgoingCallModal').classList.add('active');
        startRingingSound(false); // Outgoing ringback chime

        try {
            const res = await fetch(`${API}/api/users/call/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ receiverId })
            });

            const data = await res.json();
            if (!res.ok) {
                stopRingingSound();
                document.getElementById('binimoyOutgoingCallModal').classList.remove('active');
                if (typeof showNotification === 'function') showNotification(data.message || 'Call failed', 'error');
                return;
            }

            activeOutgoingCallId = data.callId;

            // Poll status of outgoing call every 1.5s
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
                        // Open video room!
                        openJitsiRoom(data.roomName, null, `Video Call with ${partnerName}`, partnerName);
                    } else if (checkData.status === 'rejected') {
                        clearInterval(outgoingCheckInterval);
                        stopRingingSound();
                        document.getElementById('binimoyOutgoingStatus').textContent = 'Call Declined ❌';
                        setTimeout(() => {
                            document.getElementById('binimoyOutgoingCallModal').classList.remove('active');
                        }, 1800);
                    } else if (checkData.status === 'timeout') {
                        clearInterval(outgoingCheckInterval);
                        stopRingingSound();
                        document.getElementById('binimoyOutgoingStatus').textContent = 'No Answer ⏳';
                        setTimeout(() => {
                            document.getElementById('binimoyOutgoingCallModal').classList.remove('active');
                        }, 1800);
                    }
                } catch (e) {}
            }, 1500);

        } catch (err) {
            stopRingingSound();
            document.getElementById('binimoyOutgoingCallModal').classList.remove('active');
            if (typeof showNotification === 'function') showNotification('Connection error', 'error');
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
    }

    // User B receives call -> Accept button clicked
    async function handleAcceptIncomingCall() {
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
                body: JSON.stringify({ callId: call.callId, action: 'accept' })
            });
            // Open video room!
            openJitsiRoom(call.roomName, null, `Video Call with ${call.callerName}`, call.callerName);
        } catch (e) {
            if (typeof showNotification === 'function') showNotification('Failed to accept call', 'error');
        }
    }

    // User B receives call -> Decline/Cut button clicked
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

            // Don't poll if already in an active video call
            if (currentJitsiApi) return;

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

                        document.getElementById('binimoyIncomingCallModal').classList.add('active');
                        startRingingSound(true); // Incoming Messenger-style ringing chime
                        startTitleFlash(inc.callerName || 'Friend');

                        // Show system notification if supported and permitted
                        if (window.Notification && Notification.permission === 'granted') {
                            try {
                                const notif = new Notification(`📹 Incoming Call from ${inc.callerName || 'Friend'}`, {
                                    body: 'Click to answer video call on Skill Binimoy',
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

    // Main Entry Function
    async function startBinimoyVideoCall({ type, targetId, title, partnerName, partnerImage }) {
        ensureModals();

        // 1. Direct call with friend: Use Messenger ringing & accept/cut flow!
        if (type === 'direct') {
            await startDirectCallFlow(targetId, partnerName, partnerImage);
            return;
        }

        // 2. Scheduled session: 20-minute timer session directly joins room
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

    // Start poller immediately if DOM already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        ensureModals();
        startIncomingCallPoller();
    }

    // Expose globals
    window.startBinimoyVideoCall = startBinimoyVideoCall;
    window.closeBinimoyVideoCall = closeVideoCall;
})();
