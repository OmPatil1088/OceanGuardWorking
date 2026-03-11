// ========================================
// Community Features
// ========================================

// Sample community incidents data
const communityIncidents = [
    {
        id: 'CI-001',
        type: 'Flood',
        location: 'Downtown, Central City',
        description: 'Street flooding in downtown area due to heavy rainfall. Water level rising rapidly.',
        user: 'John Smith',
        timestamp: '2024-02-11 14:30',
        severity: 'critical',
        verified: 8,
        unverified: 2,
        images: [
            { url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23E8F4F8"/%3E%3Cpath d="M0 200 Q100 150 200 180 T400 150 L400 300 L0 300 Z" fill="%234A90E2" opacity="0.7"/%3E%3Ccircle cx="200" cy="100" r="40" fill="%23FFD700"/%3E%3C/svg%3E', timestamp: '2024-02-11 14:25' }
        ],
        comments: [
            { author: 'Emergency Response Team', text: 'Evacuation in progress', time: 'Just now' },
            { author: 'Local Resident', text: 'Water level rising at a rapid pace', time: '5 mins ago' }
        ]
    },
    {
        id: 'CI-002',
        type: 'Fire',
        location: 'Industrial Zone, North District',
        description: 'Fire reported at industrial building. Fire department responding.',
        user: 'Jane Doe',
        timestamp: '2024-02-11 13:45',
        severity: 'critical',
        verified: 15,
        unverified: 1,
        images: [],
        comments: [
            { author: 'Fire Chief', text: 'Fire suppression in progress', time: '2 mins ago' }
        ]
    },
    {
        id: 'CI-003',
        type: 'Earthquake',
        location: 'Residential Area, East Side',
        description: 'Minor tremors felt in residential areas. No major damage reported.',
        user: 'Bob Johnson',
        timestamp: '2024-02-11 12:15',
        severity: 'medium',
        verified: 6,
        unverified: 3,
        images: [],
        comments: []
    },
    {
        id: 'CI-004',
        type: 'Landslide',
        location: 'Hilly Region, West County',
        description: 'Small landslide blocking mountain road. Authorities investigating.',
        user: 'Alice Wilson',
        timestamp: '2024-02-11 11:00',
        severity: 'medium',
        verified: 4,
        unverified: 2,
        images: [],
        comments: [
            { author: 'Traffic Control', text: 'Road closure in effect', time: '1 hour ago' }
        ]
    },
    {
        id: 'CI-005',
        type: 'Storm',
        location: 'Coastal Area, South Bay',
        description: 'Strong winds and heavy rainfall expected in coastal regions.',
        user: 'Charlie Brown',
        timestamp: '2024-02-11 09:30',
        severity: 'low',
        verified: 5,
        unverified: 1,
        images: [],
        comments: []
    }
];

let selectedIncidentId = null;
let userVotes = {}; // Track user votes: { incidentId: 'upvote' | 'downvote' | null }

function initializeCommunity() {
    loadCommunityData();
    setupCommentListener();
}

function loadCommunityData() {
    renderIncidentsFeed(communityIncidents);
    initializeCommunityFilters();
    initializeMediaUpload();
}

function renderIncidentsFeed(incidents) {
    const feed = document.getElementById('incidentsFeed');
    feed.innerHTML = '';

    incidents.forEach(incident => {
        const card = createIncidentCard(incident);
        feed.appendChild(card);
    });
}

function createIncidentCard(incident) {
    const card = document.createElement('div');
    card.className = 'incident-card';
    if (selectedIncidentId === incident.id) {
        card.classList.add('selected');
    }

    const verifiedStatus = incident.verified >= 5 ? 'Verified' : 'Unverified';
    const badgeClass = incident.verified >= 5 ? 'verified-badge' : 'unverified-badge';

    card.innerHTML = `
        <div class="incident-header">
            <div class="incident-type-location">
                <div class="incident-type">
                    ${getDisasterIcon(incident.type)}
                    ${incident.type}
                </div>
                <div class="incident-location">${incident.location}</div>
            </div>
            <span class="incident-badge ${badgeClass}">${verifiedStatus}</span>
        </div>
        <div class="incident-info">
            <span>By: ${incident.user}</span>
            <span>${incident.timestamp}</span>
            <span class="severity-badge severity-${incident.severity}">${incident.severity}</span>
        </div>
        <div class="incident-description">${incident.description}</div>
        <div class="incident-meta">
            <span>👍 ${incident.verified} verified</span>
            <span>⚠️ ${incident.unverified} reports</span>
            <span>💬 ${incident.comments.length} comments</span>
        </div>
    `;

    card.addEventListener('click', () => {
        selectIncident(incident);
    });

    return card;
}

function selectIncident(incident) {
    selectedIncidentId = incident.id;

    // Update card selection
    document.querySelectorAll('.incident-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Update verification panel
    updateVerificationPanel(incident);

    // Update media viewer
    updateMediaViewer(incident);

    // Update comments
    updateComments(incident);
}

function updateVerificationPanel(incident) {
    const verificationContent = document.getElementById('verificationContent');
    const verificationPercentage = Math.round((incident.verified / (incident.verified + incident.unverified)) * 100);

    verificationContent.innerHTML = `
        <div class="trust-score-section">
            <div class="trust-score-bar">
                <span class="score-label">Trust Score:</span>
                <div class="score-bar-bg">
                    <div class="score-bar-fill" style="width: ${verificationPercentage}%"></div>
                </div>
                <span class="trust-number">${verificationPercentage}%</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--gray); text-align: center;">
                Verified by ${incident.verified} users
            </p>
        </div>

        <div class="vote-buttons">
            <button class="vote-btn upvote ${userVotes[incident.id] === 'upvote' ? 'active' : ''}" onclick="voteIncident('${incident.id}', 'upvote')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                </svg>
                Upvote
            </button>
            <button class="vote-btn downvote ${userVotes[incident.id] === 'downvote' ? 'active' : ''}" onclick="voteIncident('${incident.id}', 'downvote')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                    <polyline points="17 18 23 18 23 12"/>
                </svg>
                Downvote
            </button>
        </div>

        <button class="report-false-btn" onclick="reportFalseIncident('${incident.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 0.5rem;">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Report as False
        </button>
    `;
}

function updateMediaViewer(incident) {
    const mediaViewer = document.getElementById('mediaViewer');

    if (incident.images.length > 0) {
        const img = incident.images[0];
        mediaViewer.innerHTML = `
            <div style="text-align: center;">
                <img src="${img.url}" alt="Incident image" class="media-image" onclick="openLightbox('${img.url}')">
                <div class="media-timestamp">📸 ${img.timestamp}</div>
            </div>
        `;
    } else {
        mediaViewer.innerHTML = '<p class="placeholder-text">No media uploaded yet</p>';
    }
}

function updateComments(incident) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '';

    if (incident.comments.length > 0) {
        incident.comments.forEach(comment => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            commentItem.innerHTML = `
                <div class="comment-author">${comment.author}</div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-time">${comment.time}</div>
            `;
            commentsList.appendChild(commentItem);
        });
    } else {
        commentsList.innerHTML = '<p class="placeholder-text">No comments yet. Be the first to comment!</p>';
    }
}

function voteIncident(incidentId, voteType) {
    const incident = communityIncidents.find(i => i.id === incidentId);
    if (!incident) return;

    // Update vote tracking
    if (userVotes[incidentId] === voteType) {
        delete userVotes[incidentId];
    } else {
        userVotes[incidentId] = voteType;
        if (voteType === 'upvote') {
            incident.verified++;
        } else {
            incident.unverified++;
        }
    }

    // Refresh the panel
    updateVerificationPanel(incident);
}

function reportFalseIncident(incidentId) {
    const incident = communityIncidents.find(i => i.id === incidentId);
    if (!incident) return;

    if (confirm(`Report "${incident.type}" incident as false?\n\nThis will notify administrators for review.`)) {
        alert('Thank you for reporting. Our team will review this incident.');
        incident.unverified++;
        updateVerificationPanel(incident);
    }
}

function initializeCommunityFilters() {
    const filters = ['disasterTypeFilter', 'severityFilter', 'locationFilter', 'verificationFilter'];

    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
}

function applyFilters() {
    const disasterType = document.getElementById('disasterTypeFilter').value;
    const severity = document.getElementById('severityFilter').value;
    const location = document.getElementById('locationFilter').value.toLowerCase();
    const verification = document.getElementById('verificationFilter').value;

    let filtered = communityIncidents;

    if (disasterType !== 'all') {
        filtered = filtered.filter(i => i.type.toLowerCase() === disasterType.toLowerCase());
    }

    if (severity !== 'all') {
        filtered = filtered.filter(i => i.severity === severity);
    }

    if (location) {
        filtered = filtered.filter(i => i.location.toLowerCase().includes(location));
    }

    if (verification !== 'all') {
        if (verification === 'verified') {
            filtered = filtered.filter(i => i.verified >= 5);
        } else {
            filtered = filtered.filter(i => i.verified < 5);
        }
    }

    renderIncidentsFeed(filtered);
}

function initializeMediaUpload() {
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && selectedIncidentId) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const incident = communityIncidents.find(i => i.id === selectedIncidentId);
                    if (incident) {
                        incident.images.push({
                            url: event.target.result,
                            timestamp: new Date().toLocaleString()
                        });
                        updateMediaViewer(incident);
                        alert('Image uploaded successfully!');
                    }
                };
                reader.readAsDataURL(file);
            } else if (!selectedIncidentId) {
                alert('Please select an incident first');
            }
        });
    }
}

function getDisasterIcon(type) {
    const icons = {
        'Flood': '💧',
        'Fire': '🔥',
        'Earthquake': '🌍',
        'Landslide': '⛰️',
        'Storm': '⛈️',
        'Accident': '🚗'
    };
    return icons[type] || '📍';
}

function openLightbox(imageUrl) {
    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox active';
    lightbox.innerHTML = `
        <img src="${imageUrl}" alt="Full size image" class="lightbox-image">
        <button class="lightbox-close" onclick="this.parentElement.remove()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.remove();
        }
    });
}

function setupCommentListener() {
    const commentBtn = document.getElementById('commentBtn');
    if (commentBtn) {
        commentBtn.addEventListener('click', postComment);
    }
}

function postComment() {
    const commentInput = document.getElementById('commentInput');
    const text = commentInput.value.trim();

    if (!text) {
        alert('Please enter a comment');
        return;
    }

    if (!selectedIncidentId) {
        alert('Please select an incident first');
        return;
    }

    const incident = communityIncidents.find(i => i.id === selectedIncidentId);
    if (incident) {
        incident.comments.push({
            author: sessionStorage.getItem('username') || 'Anonymous',
            text: text,
            time: 'Just now'
        });

        commentInput.value = '';
        updateComments(incident);
    }
}
