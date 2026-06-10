// ==========================================
// Profile Page JavaScript
// ==========================================

const API = window.API_URL || 'http://localhost:5000';

// Load profile data on page load
async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) return;

        const user = data.user;

        // Update profile display
        const nameEl = document.getElementById('profileName');
        const bioEl = document.getElementById('profileBio');
        const initialsEl = document.getElementById('profileInitials');
        const editNameEl = document.getElementById('editName');
        const editEmailEl = document.getElementById('editEmail');
        const editBioEl = document.getElementById('editBio');

        if (nameEl) nameEl.textContent = user.full_name || '';
        if (bioEl) bioEl.textContent = user.bio || 'No bio added yet.';
        if (initialsEl) {
            const parts = (user.full_name || 'U').split(' ');
            initialsEl.textContent = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
        }
        if (editNameEl) editNameEl.value = user.full_name || '';
        if (editEmailEl) editEmailEl.value = user.email || '';
        if (editBioEl) editBioEl.value = user.bio || '';

    } catch (err) {
        console.error('Load profile error:', err);
    }
}

// Update profile form submit
const editProfileForm = document.getElementById('editProfileForm');
if (editProfileForm) {
    editProfileForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const full_name = document.getElementById('editName').value.trim();
        const bio = document.getElementById('editBio') ? document.getElementById('editBio').value.trim() : '';

        const submitBtn = editProfileForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ full_name, bio })
            });

            const data = await response.json();

            if (response.ok) {
                // Update localStorage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.full_name = full_name;
                localStorage.setItem('user', JSON.stringify(user));

                showNotification('Profile updated successfully!', 'success');

                // Close modal and reload data
                const modal = document.getElementById('editProfileModal');
                if (modal) modal.classList.remove('active');
                loadProfile();
            } else {
                showNotification(data.message || 'Update failed', 'error');
            }
        } catch (err) {
            showNotification('Cannot connect to server.', 'error');
        } finally {
            submitBtn.textContent = 'Save Changes';
            submitBtn.disabled = false;
        }
    });
}

// Load profile when page is ready
document.addEventListener('DOMContentLoaded', loadProfile);
