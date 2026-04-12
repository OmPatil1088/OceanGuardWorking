// ========================================
// Alerts System
// ========================================

// Sample Alert Data
const alertsData = [
    {
        id: 'A-001',
        title: 'Flood Warning - Downtown District',
        type: 'flood',
        area: 'Downtown District, City Center',
        severity: 'critical',
        distance: 2.5,
        description: 'Heavy rainfall has caused significant flooding in the downtown area. Residents are advised to evacuate immediately.',
        timestamp: new Date(Date.now() - 30 * 60000),
        source: 'Meteorological Department'
    },
    {
        id: 'A-002',
        title: 'Fire Alert - Industrial Zone',
        type: 'fire',
        area: 'Industrial Zone, East Sector',
        severity: 'high',
        distance: 5.2,
        description: 'A fire has been reported in the industrial complex. Fire department is on the way. Keep windows and doors closed.',
        timestamp: new Date(Date.now() - 45 * 60000),
        source: 'Fire Department'
    },
    {
        id: 'A-003',
        title: 'Earthquake Alert',
        type: 'earthquake',
        area: 'Citywide',
        severity: 'medium',
        distance: 0,
        description: 'A moderate earthquake with magnitude 4.2 was detected. Check for structural damage and move away from hazards.',
        timestamp: new Date(Date.now() - 60 * 60000),
        source: 'Seismic Monitoring Center'
    },
    {
        id: 'A-004',
        title: 'Storm Alert - Northern Region',
        type: 'storm',
        area: 'Northern Region',
        severity: 'medium',
        distance: 8.7,
        description: 'Thunderstorm with heavy winds and hail expected. Secure loose objects and stay indoors.',
        timestamp: new Date(Date.now() - 90 * 60000),
        source: 'Weather Bureau'
    },
    {
        id: 'A-005',
        title: 'Landslide Risk - Mountain Area',
        type: 'landslide',
        area: 'Mountain Area, North Ridge',
        severity: 'low',
        distance: 12.3,
        description: 'Heavy rainfall has increased landslide risk in mountainous regions. Monitor conditions closely.',
        timestamp: new Date(Date.now() - 120 * 60000),
        source: 'Geological Survey'
    },
    {
        id: 'A-006',
        title: 'Flood Warning - River Valley',
        type: 'flood',
        area: 'River Valley, West Side',
        severity: 'high',
        distance: 7.8,
        description: 'River levels are rising due to upstream heavy rainfall. Evacuate low-lying areas.',
        timestamp: new Date(Date.now() - 150 * 60000),
        source: 'Water Resources Department'
    }
];

let currentAlerts = [...alertsData];
let alertHistory = [];
let userLocation = null;

// Cache for frequently accessed DOM elements
const alertsCache = {
    feed: null,
    filters: {},
    handlers: {
        distance: null,
        disaster: null,
        severity: null
    }
};

function cacheAlertElements() {
    alertsCache.feed = document.getElementById('alertsFeed');
    alertsCache.filters.distance = document.getElementById('distanceFilter');
    alertsCache.filters.disaster = document.getElementById('alertDisasterFilter');
    alertsCache.filters.severity = document.getElementById('alertSeverityFilter');
}

function initializeAlerts() {
    cacheAlertElements();
    renderAlerts(currentAlerts);
    initializeAlertFilters();
    initializeSubscriptionHandlers();
}

// ========================================
// A) Real-Time Alerts Feed with Optimization
// ========================================

function renderAlerts(alerts) {
    const alertsFeed = alertsCache.feed || document.getElementById('alertsFeed');
    if (!alertsFeed) return;
    
    alertsFeed.innerHTML = '';

    if (alerts.length === 0) {
        alertsFeed.innerHTML = '<p style="text-align: center; color: var(--gray); padding: var(--space-lg);">No alerts match your filters</p>';
        return;
    }

    // Use DocumentFragment for batch DOM insertion
    const fragment = document.createDocumentFragment();
    
    alerts.forEach(alert => {
        const card = createAlertCard(alert);
        fragment.appendChild(card);
    });
    
    // Single DOM operation
    alertsFeed.appendChild(fragment);
}

function createAlertCard(alert) {
    const card = document.createElement('div');
    card.className = `alert-card severity-${alert.severity}`;

    const typeEmoji = {
        'flood': '💧',
        'fire': '🔥',
        'earthquake': '📍',
        'landslide': '⛰️',
        'storm': '⛈️',
        'accident': '🚨'
    };

    const timeAgo = getTimeAgo(alert.timestamp);

    card.innerHTML = `
        <div class="alert-header">
            <div class="alert-title">${typeEmoji[alert.type] || '⚠️'} ${alert.title}</div>
            <span class="alert-severity ${alert.severity}">
                ${alert.severity.toUpperCase()}
            </span>
        </div>
        <div class="alert-content">
            <div class="alert-area">📍 ${alert.area}</div>
            <div class="alert-description">${alert.description}</div>
        </div>
        <div class="alert-meta">
            <span>🕐 ${timeAgo}</span>
            <span>📡 ${alert.source}</span>
            <span>📏 ${alert.distance > 0 ? alert.distance + ' km away' : 'In your area'}</span>
        </div>
    `;

    // Use arrow function to avoid context issues
    card.addEventListener('click', () => {
        addToAlertHistory(alert);
    });

    return card;
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// ========================================
// B) Alert Filters with Optimization
// ========================================

function initializeAlertFilters() {
    if (!alertsCache.filters.distance) cacheAlertElements();
    
    const handlers = [
        alertsCache.filters.distance,
        alertsCache.filters.disaster,
        alertsCache.filters.severity
    ];

    handlers.forEach(filter => {
        if (filter) {
            // Use debounced filter to prevent excessive renders
            const debouncedFilter = debounceFilter(applyAlertFilters, 200);
            filter.addEventListener('change', debouncedFilter);
        }
    });
}

function debounceFilter(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function applyAlertFilters() {
    const distanceFilter = alertsCache.filters.distance?.value || 'all';
    const disasterFilter = alertsCache.filters.disaster?.value || 'all';
    const severityFilter = alertsCache.filters.severity?.value || 'all';

    currentAlerts = alertsData.filter(alert => {
        // Distance filter
        if (distanceFilter !== 'all') {
            const maxDistance = parseInt(distanceFilter);
            if (alert.distance > maxDistance) return false;
        }

        // Disaster type filter
        if (disasterFilter !== 'all' && alert.type !== disasterFilter) {
            return false;
        }

        // Severity filter
        if (severityFilter !== 'all' && alert.severity !== severityFilter) {
            return false;
        }

        return true;
    });

    renderAlerts(currentAlerts);
}

// ========================================
// C) Alert Subscription Settings
// ========================================

function initializeSubscriptionHandlers() {
    const severeAlertsOnly = document.getElementById('severeAlertsOnly');
    const radiusAlerts = document.getElementById('radiusAlerts');
    const smsAlerts = document.getElementById('smsAlerts');
    const emailAlerts = document.getElementById('emailAlerts');

    const checkboxes = [severeAlertsOnly, radiusAlerts, smsAlerts, emailAlerts];

    checkboxes.forEach(checkbox => {
        if (checkbox) {
            // Load saved preferences
            const saved = localStorage.getItem(`alert-${checkbox.id}`);
            if (saved !== null) {
                checkbox.checked = JSON.parse(saved);
            }

            // Save preferences on change
            checkbox.addEventListener('change', function() {
                localStorage.setItem(`alert-${this.id}`, JSON.stringify(this.checked));
            });
        }
    });
}

// ========================================
// D) Alert History
// ========================================

function addToAlertHistory(alert) {
    // Avoid duplicates
    if (alertHistory.find(h => h.id === alert.id)) {
        return;
    }

    // Add to history (keep last 10)
    alertHistory.unshift({
        ...alert,
        viewedAt: new Date()
    });

    if (alertHistory.length > 10) {
        alertHistory.pop();
    }

    renderAlertHistory();
    saveAlertHistory();
}

function renderAlertHistory() {
    const historyContainer = document.getElementById('alertHistory');
    if (!historyContainer) return;

    historyContainer.innerHTML = '';

    if (alertHistory.length === 0) {
        historyContainer.innerHTML = '<p class="placeholder-text">No alert history yet</p>';
        return;
    }

    alertHistory.forEach(alert => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const typeEmoji = {
            'flood': '💧',
            'fire': '🔥',
            'earthquake': '📍',
            'landslide': '⛰️',
            'storm': '⛈️',
            'accident': '🚨'
        };

        item.innerHTML = `
            <div class="history-item-title">${typeEmoji[alert.type]} ${alert.title}</div>
            <div class="history-item-time">Viewed ${getTimeAgo(alert.viewedAt)}</div>
        `;

        historyContainer.appendChild(item);
    });
}

function saveAlertHistory() {
    localStorage.setItem('alertHistory', JSON.stringify(alertHistory));
}

function loadAlertHistory() {
    const saved = localStorage.getItem('alertHistory');
    if (saved) {
        alertHistory = JSON.parse(saved).map(alert => ({
            ...alert,
            timestamp: new Date(alert.timestamp),
            viewedAt: new Date(alert.viewedAt)
        }));
        renderAlertHistory();
    }
}

// Load history on initialization
loadAlertHistory();
