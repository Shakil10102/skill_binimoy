// ===================================================
// Skill Binimoy Video Calling Client (Jitsi Meet)
// ===================================================

(function () {
    if (window.startBinimoyVideoCall) return;

    let currentJitsiApi = null;
    let timerInterval = null;
    let warned5Min = false;
    let warned1Min = false;

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

    // Inject Video Modal DOM
    function ensureModal() {
        if (document.getElementById('binimoyVideoModal')) return;

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
        warned5Min = false;
        warned1Min = false;

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

    // Close and Cleanup Call
    function closeVideoCall() {
        clearInterval(timerInterval);

        if (currentJitsiApi) {
            try {
                currentJitsiApi.executeCommand('hangup');
                currentJitsiApi.dispose();
            } catch (e) {
                console.warn('Jitsi dispose notice:', e);
            }
            currentJitsiApi = null;
        }

        const modal = document.getElementById('binimoyVideoModal');
        if (modal) {
            modal.classList.remove('active');
        }

        const container = document.getElementById('jitsiMeetContainer');
        if (container) container.innerHTML = '';
    }

    // Launch Video Call
    async function startBinimoyVideoCall({ type, targetId, title, partnerName, fallbackRoom }) {
        ensureModal();
        const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        let roomName = fallbackRoom;
        let durationMinutes = type === 'session' ? 20 : null;
        let callTitle = title || 'Video Call';
        let callSubtitle = partnerName ? `with ${partnerName}` : 'Skill Binimoy Video';

        // Attempt to generate/validate room from backend
        if (token && targetId) {
            try {
                const res = await fetch(`${API}/api/users/video-room`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ type, targetId })
                });

                if (res.ok) {
                    const data = await res.json();
                    roomName = data.roomName;
                    durationMinutes = data.durationMinutes;
                    if (data.title) callTitle = data.title;
                    if (data.partnerName) callSubtitle = `with ${data.partnerName}`;
                } else {
                    const err = await res.json();
                    if (typeof showNotification === 'function') {
                        showNotification(err.message || 'Cannot start video call', 'error');
                    }
                    return;
                }
            } catch (netErr) {
                console.warn('Backend room check error, using direct room fallback:', netErr);
            }
        }

        if (!roomName) {
            roomName = `skillbinimoy-${type || 'call'}-${targetId || Date.now()}`;
        }

        // Set Header Details
        document.getElementById('binimoyCallTitle').textContent = callTitle;
        document.getElementById('binimoyCallSubtitle').textContent = callSubtitle;

        // Show Modal
        const modal = document.getElementById('binimoyVideoModal');
        modal.classList.add('active');

        // Load Jitsi Meet API
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

        // Listen for Hangup event inside Jitsi
        currentJitsiApi.addEventListener('videoConferenceLeft', () => {
            closeVideoCall();
        });

        // Start countdown timer if session call
        startCountdown(durationMinutes);
    }

    // Expose globals
    window.startBinimoyVideoCall = startBinimoyVideoCall;
    window.closeBinimoyVideoCall = closeVideoCall;
})();
