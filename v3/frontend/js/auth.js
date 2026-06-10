// Auth guard - redirect to login if no token
(function() {
    const publicPages = ['index.html', 'login.html', 'register.html', ''];
    const page = window.location.pathname.split('/').pop();
    const token = localStorage.getItem('token');
    if (!publicPages.includes(page) && !token) {
        window.location.href = 'login.html';
    }
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
})();
