// ========================================
// Chat JavaScript
// ========================================

// Chat functionality
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');

// Send message
function sendMessage() {
    if (!messageInput || !chatMessages) return;
    
    const message = messageInput.value.trim();
    if (message === '') return;
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message sent';
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${formatTime(new Date())}</span>
        </div>
    `;
    
    // Add to chat
    chatMessages.appendChild(messageDiv);
    
    // Clear input
    messageInput.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate response
    setTimeout(() => {
        const responseDiv = document.createElement('div');
        responseDiv.className = 'message received';
        responseDiv.innerHTML = `
            <div class="message-avatar">AM</div>
            <div class="message-content">
                <p>Thanks for your message! I'll get back to you soon.</p>
                <span class="message-time">${formatTime(new Date())}</span>
            </div>
        `;
        chatMessages.appendChild(responseDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
}

// Send button click
if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}

// Enter key to send
if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Chat item selection
document.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', function() {
        // Remove active from all
        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        
        // Add active to clicked
        this.classList.add('active');
        
        // Update chat window header
        const userName = this.getAttribute('data-user');
        const chatWindowHeader = document.querySelector('.chat-window-header h3');
        if (chatWindowHeader) {
            chatWindowHeader.textContent = userName;
        }
        
        // Remove unread badge
        const unreadBadge = this.querySelector('.unread-badge');
        if (unreadBadge) {
            unreadBadge.remove();
        }
    });
});

// Auto scroll to bottom on load
if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
