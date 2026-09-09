// ==========================================
// GLOBAL APP JS
// ==========================================
const API = window.API_URL || 'https://skill-binimoy-backend.onrender.com';

function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || '{}'); }

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.textContent = message;
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;z-index:9999;font-weight:500;color:white;background:${type==='success'?'#10b981':type==='error'?'#ef4444':'#3b82f6'};box-shadow:0 4px 12px rgba(0,0,0,0.3);`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// Theme toggle
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
        });
        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }

    // Set user initials everywhere
    const user = getUser();
    if (user && user.full_name) {
        const parts = user.full_name.split(' ');
        const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
        document.querySelectorAll('.user-avatar, .user-initials').forEach(el => {
            if (!el.querySelector('img')) el.textContent = initials;
        });
    }

    // Profile icon click -> profile page
    document.querySelectorAll('.user-avatar, .user-menu').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => { window.location.href = 'profile.html'; });
    });

    // Logo click -> home
    document.querySelectorAll('.logo, .logo span, .sidebar-logo').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => { window.location.href = 'index.html'; });
    });
});
