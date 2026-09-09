// ========================================
// Dashboard JavaScript
// ========================================

// Sidebar Toggle for Mobile
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Edit Profile Modal
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const editModalClose = document.getElementById('editModalClose');
const cancelEdit = document.getElementById('cancelEdit');
const editProfileForm = document.getElementById('editProfileForm');

if (editProfileBtn && editProfileModal) {
    editProfileBtn.addEventListener('click', () => {
        editProfileModal.classList.add('active');
    });
    
    if (editModalClose) {
        editModalClose.addEventListener('click', () => {
            editProfileModal.classList.remove('active');
        });
    }
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', () => {
            editProfileModal.classList.remove('active');
        });
    }
    
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Profile updated successfully!', 'success');
            editProfileModal.classList.remove('active');
        });
    }
}

// Close modal when clicking outside
if (editProfileModal) {
    editProfileModal.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            editProfileModal.classList.remove('active');
        }
    });
}

// Skill Tag Removal
document.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const tag = this.closest('.skill-tag');
        if (tag) {
            tag.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => tag.remove(), 300);
            showNotification('Skill removed', 'info');
        }
    });
});

// Add animation for fade out
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.8);
        }
    }
`;
document.head.appendChild(fadeOutStyle);

// Active Navigation Highlight
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

setActiveNav();

// Stats Counter Animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
}

// Animate stats on page load
window.addEventListener('load', () => {
    document.querySelectorAll('.stat-info h3').forEach(el => {
        const value = parseInt(el.textContent.replace(/,/g, ''));
        if (!isNaN(value)) {
            animateCounter(el, value);
        }
    });
});

// Calendar (Simple Implementation)
const calendarNav = {
    prevBtn: document.getElementById('prevMonth'),
    nextBtn: document.getElementById('nextMonth'),
    currentMonthEl: document.getElementById('currentMonth')
};

let currentDate = new Date();

if (calendarNav.prevBtn && calendarNav.nextBtn) {
    calendarNav.prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });
    
    calendarNav.nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });
}

function updateCalendar() {
    if (calendarNav.currentMonthEl) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        calendarNav.currentMonthEl.textContent = 
            `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
}

updateCalendar();

// New Session Button
const newSessionBtn = document.getElementById('newSessionBtn');
if (newSessionBtn) {
    newSessionBtn.addEventListener('click', () => {
        showNotification('Session creation feature coming soon!', 'info');
    });
}
