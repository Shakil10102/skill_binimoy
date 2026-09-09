// ========================================
// Marketplace JavaScript
// ========================================

// Sample marketplace data
const marketplaceData = [
    {
        id: 1,
        name: 'Ahmed Mahmud',
        avatar: 'AM',
        location: 'Dhaka, Bangladesh',
        skillsOffered: ['Graphic Design', 'Illustration', 'Photoshop'],
        skillsWanted: ['Web Development', 'JavaScript'],
        rating: 4.8,
        sessions: 24,
        bio: 'Professional graphic designer with 5+ years of experience. Looking to learn web development.'
    },
    {
        id: 2,
        name: 'Sara Rahman',
        avatar: 'SR',
        location: 'Chittagong, Bangladesh',
        skillsOffered: ['Photography', 'Photo Editing', 'Lightroom'],
        skillsWanted: ['Video Editing', 'Premiere Pro'],
        rating: 4.9,
        sessions: 18,
        bio: 'Passionate photographer wanting to expand into video content creation.'
    },
    {
        id: 3,
        name: 'Kamal Ahmed',
        avatar: 'KA',
        location: 'Sylhet, Bangladesh',
        skillsOffered: ['Video Editing', 'Motion Graphics', 'After Effects'],
        skillsWanted: ['Web Design', 'UI/UX'],
        rating: 4.7,
        sessions: 32,
        bio: 'Video editor and motion graphics artist. Interested in transitioning to UI/UX design.'
    },
    {
        id: 4,
        name: 'Nadia Islam',
        avatar: 'NI',
        location: 'Dhaka, Bangladesh',
        skillsOffered: ['UI/UX Design', 'Figma', 'User Research'],
        skillsWanted: ['Frontend Development', 'React'],
        rating: 4.9,
        sessions: 27,
        bio: 'UI/UX designer looking to learn frontend development to better collaborate with developers.'
    },
    {
        id: 5,
        name: 'Rakib Hossain',
        avatar: 'RH',
        location: 'Khulna, Bangladesh',
        skillsOffered: ['Digital Marketing', 'SEO', 'Social Media'],
        skillsWanted: ['Graphic Design', 'Branding'],
        rating: 4.6,
        sessions: 15,
        bio: 'Digital marketing specialist wanting to learn graphic design for better content creation.'
    },
    {
        id: 6,
        name: 'Fatima Begum',
        avatar: 'FB',
        location: 'Rajshahi, Bangladesh',
        skillsOffered: ['Content Writing', 'Copywriting', 'Blog Writing'],
        skillsWanted: ['Digital Marketing', 'SEO'],
        rating: 4.8,
        sessions: 21,
        bio: 'Professional content writer seeking to understand SEO and digital marketing strategies.'
    }
];

// Load marketplace cards
function loadMarketplace(data = marketplaceData) {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    data.forEach(user => {
        const card = document.createElement('div');
        card.className = 'marketplace-card';
        card.innerHTML = `
            <div class="card-image">
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; background: linear-gradient(135deg, #6C63FF, #00C2FF);">
                    ${user.avatar}
                </div>
                <div class="card-badge">${user.sessions} Sessions</div>
            </div>
            <div class="card-body">
                <div class="card-user">
                    <div class="card-user-avatar">${user.avatar}</div>
                    <div class="card-user-info">
                        <h4>${user.name}</h4>
                        <p>${user.location}</p>
                    </div>
                </div>
                <div class="card-skills">
                    <h5>Offers:</h5>
                    <div class="card-skill-tags">
                        ${user.skillsOffered.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                <div class="card-skills">
                    <h5>Wants:</h5>
                    <div class="card-skill-tags">
                        ${user.skillsWanted.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-rating">
                        <span>⭐</span>
                        <span>${user.rating}</span>
                    </div>
                    <button class="card-action" onclick="viewUserDetail(${user.id})">Exchange</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// View user detail
function viewUserDetail(userId) {
    const user = marketplaceData.find(u => u.id === userId);
    if (!user) return;
    
    const modal = document.getElementById('skillModal');
    const modalBody = document.getElementById('modalBody');
    
    if (modal && modalBody) {
        modalBody.innerHTML = `
            <h2>Skill Exchange Request</h2>
            <div class="modal-user-header">
                <div class="modal-avatar">${user.avatar}</div>
                <div class="modal-user-details">
                    <h3>${user.name}</h3>
                    <p>${user.location} • ${user.sessions} Sessions • ⭐ ${user.rating}</p>
                </div>
            </div>
            <div class="modal-section">
                <h4>About</h4>
                <p>${user.bio}</p>
            </div>
            <div class="modal-section">
                <h4>Skills Offered</h4>
                <div class="skill-tags">
                    ${user.skillsOffered.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            <div class="modal-section">
                <h4>Skills Wanted</h4>
                <div class="skill-tags">
                    ${user.skillsWanted.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="sendExchangeRequest(${userId})">Send Request</button>
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            </div>
        `;
        modal.classList.add('active');
    }
}

// Send exchange request
function sendExchangeRequest(userId) {
    showNotification('Exchange request sent!', 'success');
    closeModal();
}

// Close modal
function closeModal() {
    const modal = document.getElementById('skillModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Modal close button
const modalClose = document.getElementById('modalClose');
if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

// Close modal on outside click
const skillModal = document.getElementById('skillModal');
if (skillModal) {
    skillModal.addEventListener('click', (e) => {
        if (e.target === skillModal) {
            closeModal();
        }
    });
}

// Search functionality
const searchInput = document.getElementById('marketplaceSearch');
if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = marketplaceData.filter(user => {
            return user.name.toLowerCase().includes(searchTerm) ||
                   user.skillsOffered.some(skill => skill.toLowerCase().includes(searchTerm)) ||
                   user.skillsWanted.some(skill => skill.toLowerCase().includes(searchTerm));
        });
        loadMarketplace(filtered);
    }, 300));
}

// Category filter
const categoryFilter = document.getElementById('categoryFilter');
if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
        const category = e.target.value;
        if (category === 'all') {
            loadMarketplace(marketplaceData);
        } else {
            const filtered = marketplaceData.filter(user => {
                return user.skillsOffered.some(skill => 
                    skill.toLowerCase().includes(category.toLowerCase())
                );
            });
            loadMarketplace(filtered);
        }
    });
}

// Sort filter
const sortFilter = document.getElementById('sortFilter');
if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
        const sortBy = e.target.value;
        let sorted = [...marketplaceData];
        
        if (sortBy === 'rating') {
            sorted.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'popular') {
            sorted.sort((a, b) => b.sessions - a.sessions);
        }
        
        loadMarketplace(sorted);
    });
}

// Initialize marketplace
loadMarketplace();
