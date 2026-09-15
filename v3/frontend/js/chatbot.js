// ===================================================
// Binimoy AI Chatbot Client Script
// ===================================================

(function () {
    // Avoid double injection
    if (document.getElementById('binimoyChatbotRoot')) return;

    const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';
    let chatHistory = [];
    let isWaitingForResponse = false;

    // Helper: format markdown-like text to HTML
    function formatMessageText(text) {
        if (!text) return '';
        let escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Bold **text**
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic *text*
        escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Inline code `code`
        escaped = escaped.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 4px;border-radius:4px;font-size:0.85em">$1</code>');
        // Bullet points
        escaped = escaped.replace(/^\s*[-*•]\s+(.*)$/gm, '<li style="margin-left:14px;margin-bottom:4px">$1</li>');
        // Numbered list
        escaped = escaped.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li style="margin-left:14px;margin-bottom:4px;list-style-type:decimal">$2</li>');
        // Line breaks
        escaped = escaped.replace(/\n/g, '<br>');

        return escaped;
    }

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Build Chatbot DOM Elements
    const root = document.createElement('div');
    root.id = 'binimoyChatbotRoot';
    root.innerHTML = `
        <!-- Floating Launcher Button -->
        <button class="binimoy-chatbot-launcher" id="binimoyChatLauncher" title="Ask Binimoy AI">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>

        <!-- Chat Window -->
        <div class="binimoy-chat-window" id="binimoyChatWindow">
            <div class="binimoy-chat-header">
                <div class="binimoy-chat-profile">
                    <div class="binimoy-bot-avatar">🤖</div>
                    <div class="binimoy-bot-meta">
                        <h4>Binimoy AI</h4>
                        <p><span class="binimoy-status-dot"></span> Online Assistant</p>
                    </div>
                </div>
                <button class="binimoy-chat-close-btn" id="binimoyChatClose" title="Close chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Messages Area -->
            <div class="binimoy-chat-messages" id="binimoyChatMessages">
                <!-- Initial Welcome -->
                <div class="binimoy-msg-wrap bot">
                    <div class="binimoy-msg-bubble">
                        👋 Hi! I am <strong>Binimoy AI</strong>, your skill exchange assistant.
                        <br><br>
                        Have a question about Skill Binimoy or want skill learning roadmaps? Ask me below!
                    </div>
                    <span class="binimoy-msg-time">${getCurrentTime()}</span>
                </div>

                <!-- Quick Prompts -->
                <div class="binimoy-quick-prompts" id="binimoyQuickPrompts">
                    <button class="binimoy-chip" data-query="How does Skill Binimoy work?">💡 How does it work?</button>
                    <button class="binimoy-chip" data-query="How do I schedule a session?">📅 Schedule session</button>
                    <button class="binimoy-chip" data-query="Recommend Web Development skills">💻 Web Dev roadmap</button>
                    <button class="binimoy-chip" data-query="How do I add skills to my profile?">🎯 Add my skills</button>
                </div>
            </div>

            <!-- Chat Footer -->
            <div class="binimoy-chat-footer">
                <input type="text" class="binimoy-chat-input" id="binimoyChatInput" placeholder="Ask a question..." autocomplete="off">
                <button class="binimoy-send-btn" id="binimoySendBtn" title="Send message">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(root);

    // Elements
    const launcher = document.getElementById('binimoyChatLauncher');
    const windowEl = document.getElementById('binimoyChatWindow');
    const closeBtn = document.getElementById('binimoyChatClose');
    const messagesEl = document.getElementById('binimoyChatMessages');
    const inputEl = document.getElementById('binimoyChatInput');
    const sendBtn = document.getElementById('binimoySendBtn');
    const quickPrompts = document.getElementById('binimoyQuickPrompts');

    // Toggle Window
    function toggleChat(open) {
        const isOpen = open !== undefined ? open : !windowEl.classList.contains('open');
        windowEl.classList.toggle('open', isOpen);
        launcher.classList.toggle('active', isOpen);
        if (isOpen) {
            inputEl.focus();
            scrollToBottom();
        }
    }

    launcher.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    function scrollToBottom() {
        setTimeout(() => {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }, 50);
    }

    // Append Message to UI
    function appendMessage(role, text) {
        const wrap = document.createElement('div');
        wrap.className = `binimoy-msg-wrap ${role}`;

        const bubble = document.createElement('div');
        bubble.className = 'binimoy-msg-bubble';
        bubble.innerHTML = role === 'bot' ? formatMessageText(text) : text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const time = document.createElement('span');
        time.className = 'binimoy-msg-time';
        time.textContent = getCurrentTime();

        wrap.appendChild(bubble);
        wrap.appendChild(time);
        messagesEl.appendChild(wrap);
        scrollToBottom();
    }

    // Typing Indicator
    function showTyping() {
        const ind = document.createElement('div');
        ind.id = 'binimoyTyping';
        ind.className = 'binimoy-typing-indicator';
        ind.innerHTML = `
            <div class="binimoy-dot"></div>
            <div class="binimoy-dot"></div>
            <div class="binimoy-dot"></div>
        `;
        messagesEl.appendChild(ind);
        scrollToBottom();
    }

    function removeTyping() {
        const ind = document.getElementById('binimoyTyping');
        if (ind) ind.remove();
    }

    // Send Message Handler
    async function sendMessage(text) {
        const msg = (text || inputEl.value).trim();
        if (!msg || isWaitingForResponse) return;

        // Hide quick prompts once user chats
        if (quickPrompts) quickPrompts.style.display = 'none';

        inputEl.value = '';
        appendMessage('user', msg);
        chatHistory.push({ role: 'user', text: msg });

        isWaitingForResponse = true;
        sendBtn.disabled = true;
        showTyping();

        // Render wake-up hint if backend takes time
        const wakeUpNotice = setTimeout(() => {
            if (isWaitingForResponse) {
                const notice = document.createElement('div');
                notice.id = 'binimoyWakeUpNotice';
                notice.style.cssText = 'font-size:0.75rem;color:#94a3b8;text-align:center;padding:4px;';
                notice.textContent = '⏳ Render server is waking up, thanks for your patience...';
                messagesEl.appendChild(notice);
                scrollToBottom();
            }
        }, 4500);

        try {
            const res = await fetch(`${API}/api/users/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    history: chatHistory.slice(-6)
                })
            });

            clearTimeout(wakeUpNotice);
            const noticeEl = document.getElementById('binimoyWakeUpNotice');
            if (noticeEl) noticeEl.remove();

            removeTyping();

            if (!res.ok) {
                appendMessage('bot', "Sorry, I couldn't process that right now. Please try again in a few seconds!");
                return;
            }

            const data = await res.json();
            const botReply = data.reply || "I'm here! What else would you like to know?";
            appendMessage('bot', botReply);
            chatHistory.push({ role: 'model', text: botReply });

        } catch (err) {
            clearTimeout(wakeUpNotice);
            const noticeEl = document.getElementById('binimoyWakeUpNotice');
            if (noticeEl) noticeEl.remove();
            removeTyping();

            appendMessage('bot', "Could not reach the server. Please make sure the backend is running on Render and your internet connection is active!");
        } finally {
            isWaitingForResponse = false;
            sendBtn.disabled = false;
            inputEl.focus();
        }
    }

    // Input Events
    sendBtn.addEventListener('click', () => sendMessage());
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    // Quick Prompt Buttons
    if (quickPrompts) {
        quickPrompts.addEventListener('click', (e) => {
            const chip = e.target.closest('.binimoy-chip');
            if (chip) {
                const query = chip.getAttribute('data-query');
                if (query) sendMessage(query);
            }
        });
    }
})();
