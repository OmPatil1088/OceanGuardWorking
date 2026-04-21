// ========================================
// Dashboard JavaScript
// ========================================

// Import Firebase modules (run in browser)
// These are loaded via CDN in HTML, accessible via window.firebase

// User Reports Storage Key
const USER_REPORTS_STORAGE_KEY = 'userReportedCases';
// Public Incidents Storage Key (for community feed)
const PUBLIC_INCIDENTS_STORAGE_KEY = 'publicIncidents';

// Firebase Config
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCFYKtb_fNUtLA3Yz0Ssx4PoBoKQIQxOM0",
    authDomain: "disaster-ai-240b7.firebaseapp.com",
    projectId: "disaster-ai-240b7"
};

// ========================================
// USER AUTHENTICATION & AUTHORIZATION
// ========================================

// Admin credentials (stores as hash for basic security)
// Supports multiple admin emails
const ADMIN_CREDENTIALS = {
    emails: [
        'admin@oceanguard.gov.in',
        'ompatil@hazardwatch.com'
    ],
    role: 'admin'
};

// User roles
const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest'
};

/**
 * Check if user is logged in
 */
function isUserLoggedIn() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Get current logged-in user email
 */
function getCurrentUserEmail() {
    return sessionStorage.getItem('username') || null;
}

/**
 * Get current user role
 */
function getCurrentUserRole() {
    return sessionStorage.getItem('userRole') || USER_ROLES.GUEST;
}

/**
 * Check if current user is admin
 */
function isAdmin() {
    return getCurrentUserRole() === USER_ROLES.ADMIN;
}

/**
 * Set user role based on email
 */
function setUserRoleByEmail(email) {
    const role = ADMIN_CREDENTIALS.emails.includes(email) ? USER_ROLES.ADMIN : USER_ROLES.USER;
    sessionStorage.setItem('userRole', role);
    console.log(`✓ User role set to '${role}' for email: ${email}`);
    return role;
}

/**
 * Show button only for admin users
 */
function showAdminOnly(element) {
    if (element) {
        element.style.display = isAdmin() ? 'block' : 'none';
    }
}

/**
 * Hide button for users (only show for admin)
 */
function hideForNonAdmin(element) {
    if (element) {
        element.style.display = isAdmin() ? 'inline-block' : 'none';
    }
}

/**
 * Check authorization for action
 */
function checkAuthorization(action, currentUserEmail) {
    const role = getCurrentUserRole();
    const isAdminUser = ADMIN_CREDENTIALS.emails.includes(currentUserEmail);
    
    const permissions = {
        'report_case': ['user', 'admin'],
        'vote_case': ['user', 'admin'],
        'edit_case': ['admin'],
        'delete_case': ['admin'],
        'modify_status': ['admin'],
        'view_all_cases': ['admin']
    };
    
    const hasPermission = permissions[action]?.includes(role) || false;
    
    // Additional check: for delete_case, verify admin email matches
    if (action === 'delete_case' && !isAdminUser) {
        console.warn(`⛔ UNAUTHORIZED: ${currentUserEmail} attempted to delete case but is not an admin.`);
        return false;
    }
    
    return hasPermission;
}

/**
 * Redirect to login if not authenticated
 */
function checkAuthAndRedirect() {
    if (!isUserLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ========================================
// DOM ELEMENT CACHE (Performance Optimization)
// ========================================
const domCache = new Map();

function getElement(selector, noCache = false) {
    if (noCache) return document.getElementById(selector) || document.querySelector(selector);
    if (domCache.has(selector)) return domCache.get(selector);
    const el = document.getElementById(selector) || document.querySelector(selector);
    if (el) domCache.set(selector, el);
    return el;
}

function getElements(selector) {
    return document.querySelectorAll(selector);
}

function clearDOMCache() {
    domCache.clear();
}

// ========================================
// DEBOUNCE & THROTTLE UTILITIES
// ========================================
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// PERFORMANCE MONITORING
// ========================================
const performanceMetrics = {};

function markStart(label) {
    performanceMetrics[label] = { start: performance.now() };
}

function markEnd(label) {
    if (performanceMetrics[label]) {
        const duration = performance.now() - performanceMetrics[label].start;
        performanceMetrics[label].duration = duration;
        // Log only if duration > 50ms (potential bottleneck)
        if (duration > 50) {
            console.log(`⏱️  [${label}] took ${duration.toFixed(2)}ms`);
        }
    }
}

function getMetrics() {
    return performanceMetrics;
}

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    checkAuth();

    // Initialize components
    initializeMap();
    loadNews();
    loadCases();
    updateLastUpdated();
    initializeModals();
    initializeNavigation();
    initializeMobileMenu();
    initializeMyReports();
    initializeAIAssistant();
    
    // Initialize profile display in header and modals
    loadUserProfile();

    // Set up auto-refresh
    setInterval(updateLastUpdated, 60000); // Update every minute
});

// ========================================
// Mobile Menu
// ========================================

function initializeMobileMenu() {
    const menuToggle = getElement('menuToggle');
    const sidebar = getElement('sidebar');

    if (!menuToggle) return;

    menuToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside (mobile only)
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Close sidebar when a nav item is clicked
    const navItems = getElements('.nav-item');
    navItems.forEach(item => {
        if (item.id !== 'reportCaseBtn') {
            item.addEventListener('click', function () {
                if (window.innerWidth <= 1024) {
                    sidebar.classList.remove('active');
                }
            });
        }
    });

    // Handle window resize with throttling
    const throttledResize = throttle(function () {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('active');
        }
    }, 150);
    
    window.addEventListener('resize', throttledResize);
}

// ========================================
// Authentication
// ========================================

function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    // Update user display with role badge
    const username = sessionStorage.getItem('username');
    const userRole = sessionStorage.getItem('userRole') || 'user';
    
    if (username) {
        const userNameElement = getElement('user-name', true);
        if (userNameElement) {
            const roleBadge = userRole === 'admin' ? ' 👑 ADMIN' : '';
            userNameElement.textContent = username + roleBadge;
            userNameElement.title = `User: ${username}\nRole: ${userRole.toUpperCase()}`;
        }
    }
    
    console.log(`✅ User authenticated: ${username} (Role: ${userRole})`);
}

// Logout functionality
const logoutBtn = getElement('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('isAdmin');
            window.location.href = 'index.html';
        }
    });
}

// ========================================
// Map Initialization
// ========================================

let map;
let markers = [];
let incidentsData = [];
let casesInitialized = false;

// Store precise location from locate button (for Report Case)
let lastPreciseLocationLat = null;
let lastPreciseLocationLng = null;

const API_BASE = 'http://localhost:5000';
const INCIDENTS_BACKEND_COOLDOWN_MS = 10 * 60 * 1000;
const NEWS_FAILURE_COOLDOWN_MS = 60 * 60 * 1000;

let incidentsBackendDisabledUntil = 0;
let incidentsBackendWarned = false;
const newsFetchState = {
    inFlight: false,
    cooldownUntil: 0,
    reason: ''
};

// API Caching & Rate Limiting
const API_CACHE = {
    news: { data: null, timestamp: 0, ttl: 30 * 60 * 1000 }, // 30 minutes cache
    incidents: { data: null, timestamp: 0, ttl: 15 * 60 * 1000 } // 15 minutes cache
};

function isCacheValid(cacheKey) {
    const cache = API_CACHE[cacheKey];
    if (!cache || !cache.data) return false;
    return (Date.now() - cache.timestamp) < cache.ttl;
}

function getFromCache(cacheKey) {
    if (isCacheValid(cacheKey)) {
        console.log(`📦 Using cached ${cacheKey} data`);
        return API_CACHE[cacheKey].data;
    }
    return null;
}

function saveToCache(cacheKey, data) {
    API_CACHE[cacheKey] = {
        data: data,
        timestamp: Date.now(),
        ttl: API_CACHE[cacheKey].ttl
    };
}

// Sample incident data for demonstration
const sampleIncidents = [
    {
        _id: 'CASE-001',
        caseId: 'DS-FLOOD-2024001',
        type: 'Flood',
        description: 'Heavy rainfall causing severe flooding in residential areas. Multiple families displaced.',
        location: 'Dharavi, Mumbai',
        severity: 'critical',
        status: 'active',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        lat: 19.0176,
        lng: 72.8479,
        contact: '+91-9876543210',
        people: '45 persons affected'
    },
    {
        _id: 'CASE-002',
        caseId: 'DS-FIRE-2024002',
        type: 'Fire',
        description: 'Commercial building fire reported. Fire brigade deployed to the scene.',
        location: 'Bandra, Mumbai',
        severity: 'critical',
        status: 'active',
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        lat: 19.0596,
        lng: 72.8295,
        contact: '+91-9876543211',
        people: '12 persons evacuated'
    },
    {
        _id: 'CASE-003',
        caseId: 'DS-LANDSLIDE-2024003',
        type: 'Landslide',
        description: 'Landslide in hilly area due to prolonged rainfall. Road blocked completely.',
        location: 'Lavasa, Pune',
        severity: 'medium',
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        lat: 18.7574,
        lng: 73.2314,
        contact: '+91-9876543212',
        people: '8 persons stranded'
    },
    {
        _id: 'CASE-004',
        caseId: 'DS-STORM-2024004',
        type: 'Storm',
        description: 'Severe thunderstorm with heavy wind. Trees uprooted, power lines damaged.',
        location: 'Dadar, Mumbai',
        severity: 'medium',
        status: 'resolved',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        lat: 19.0176,
        lng: 72.8294,
        contact: '+91-9876543213',
        people: '25 persons assisted'
    },
    {
        _id: 'CASE-005',
        caseId: 'DS-EARTHQUAKE-2024005',
        type: 'Earthquake',
        description: 'Moderate earthquake tremors felt. Structural damage assessment in progress.',
        location: 'Powai, Mumbai',
        severity: 'low',
        status: 'resolved',
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        lat: 19.1136,
        lng: 72.9068,
        contact: '+91-9876543214',
        people: 'No casualties reported'
    },
    {
        _id: 'CASE-006',
        caseId: 'DS-ACCIDENT-2024006',
        type: 'Accident',
        description: 'Multi-vehicle accident on highway. Emergency medical services deployed.',
        location: 'Eastern Express Highway, Mumbai',
        severity: 'medium',
        status: 'active',
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        lat: 19.0522,
        lng: 72.8537,
        contact: '+91-9876543215',
        people: '18 persons injured'
    }
];

function initializeMap() {

    // Create map first (temporary center)
    map = L.map('map').setView([19.0760, 72.8777], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Move map to user location
                map.setView([userLat, userLng], 13);

                // Add marker for user
                L.marker([userLat, userLng])
                    .addTo(map)
                    .bindPopup("You are here")
                    .openPopup();

            },
            function (error) {
                console.log("Location access denied. Using default Mumbai.");
            }
        );
    }

    // Load incidents from backend (MongoDB)
    loadIncidents();

    // Map filter controls with enhanced functionality
    const filterBtns = document.querySelectorAll('.map-control-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            // Remove active class from all buttons
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.style.transform = 'scale(1)';
            });
            
            // Add active class to clicked button with animation
            this.classList.add('active');
            this.style.transform = 'scale(1.05)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);

            const filter = this.getAttribute('data-filter');
            console.log(`🔍 Filtering map by: ${filter}`);
            filterMarkers(filter);
            
            // Update filter info display
            updateFilterInfo(filter);
        });
    });

    // Set initial filter to 'all'
    updateFilterInfo('all');
}

function addMarker(incident) {
    const color = getMarkerColor(incident.severity);
    
    // Add special styling for user-reported cases
    const isUserReported = incident.isUserReported === true;
    const borderStyle = isUserReported ? 'dashed' : 'solid';
    const borderColor = isUserReported ? color : 'white';
    const boxShadow = isUserReported 
        ? `0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 2px ${color}`
        : '0 2px 8px rgba(0,0,0,0.3)';

    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 24px;
            height: 24px;
            background: ${color};
            border: 3px ${borderStyle} ${borderColor};
            border-radius: 50%;
            box-shadow: ${boxShadow};
            animation: pulse 2s ease-in-out infinite;
            position: relative;
        ">
        ${isUserReported ? `<div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 16px;
            height: 16px;
            background: #2B9FD9;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
        ">👤</div>` : ''}
        </div>`,
        iconSize: [24, 24]
    });

    const marker = L.marker([incident.lat, incident.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
            <div style="font-family: 'Barlow', sans-serif; min-width: 200px;">
                <strong style="font-size: 14px; color: #0F1419;">${incident.type}</strong><br>
                <span style="font-size: 12px; color: #6B7785;">${incident.caseId}</span><br>
                ${incident.isUserReported ? `<span style="
                    display: inline-block;
                    padding: 2px 6px;
                    background: #E3F2FD;
                    color: #2B9FD9;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 700;
                    margin-top: 4px;
                    margin-bottom: 4px;
                ">👤 User Reported by ${incident.reportedBy || 'Anonymous'}</span><br>` : ''}
                <p style="font-size: 12px; margin: 8px 0; color: #3A4556;">${incident.description}</p>
                <span style="
                    display: inline-block;
                    padding: 2px 8px;
                    background: ${color}20;
                    color: ${color};
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                >${incident.severity}</span>
            </div>
        `);

    marker.incident = incident;
    markers.push(marker);
}

function getMarkerColor(severity) {
    switch (severity) {
        case 'critical': return '#EF233C';
        case 'medium': return '#FFB703';
        case 'low': return '#06D6A0';
        default: return '#6B7785';
    }
}

function filterMarkers(filter) {
    let visibleCount = 0;
    let totalCount = markers.length;
    const visibleMarkers = [];

    // Clear all markers from map first
    markers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    // Re-add only matching markers
    markers.forEach(marker => {
        const markerSeverity = marker.incident?.severity || 'unknown';
        const shouldShow = filter === 'all' || markerSeverity === filter;

        if (shouldShow) {
            marker.addTo(map);
            visibleMarkers.push(marker);
            visibleCount++;
            
            // Add visual emphasis to matching markers
            if (marker._icon) {
                marker._icon.style.opacity = '1';
                marker._icon.style.filter = 'drop-shadow(0 0 6px rgba(0,0,0,0.5))';
            }
        }
    });

    console.log(`📍 Filter: ${filter} | Showing ${visibleCount}/${totalCount} incidents`);

    // Auto-locate/zoom to filtered incidents
    if (visibleMarkers.length > 0) {
        setTimeout(() => {
            locateFilteredIncidents(visibleMarkers, filter);
        }, 300);
    }

    // Update stats display
    const statsMsg = filter === 'all' 
        ? `Showing all ${totalCount} incidents`
        : `Showing ${visibleCount} ${filter} incident${visibleCount !== 1 ? 's' : ''} (${Math.round((visibleCount/totalCount)*100)}%)`;
    
    const filterInfoEl = document.getElementById('filterInfo');
    if (filterInfoEl) {
        filterInfoEl.textContent = statsMsg;
        filterInfoEl.style.animation = 'slideUpIn 0.3s ease-out';
    }
}

function locateFilteredIncidents(visibleMarkers, filterType) {
    if (!map || visibleMarkers.length === 0) return;

    if (visibleMarkers.length === 1) {
        // Single incident - zoom in and center on it
        const marker = visibleMarkers[0];
        const latlng = marker.getLatLng();
        
        map.setView(latlng, 15, {
            animate: true,
            duration: 1
        });
        
        // Open popup for single marker
        setTimeout(() => {
            marker.openPopup();
        }, 1000);
        
        console.log(`📍 Zooming to single ${filterType} incident at ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    } else {
        // Multiple incidents - fit all to map with bounds
        const group = L.featureGroup(visibleMarkers);
        const bounds = group.getBounds();
        
        map.fitBounds(bounds, {
            padding: [50, 50],
            animate: true,
            duration: 1
        });
        
        const center = bounds.getCenter();
        console.log(`📍 Map fitted to ${visibleMarkers.length} ${filterType} incidents centered at ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);
    }
}

function updateFilterInfo(filter) {
    let visibleCount = 0;
    let criticalCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    markers.forEach(marker => {
        const severity = marker.incident?.severity || 'unknown';
        
        if (severity === 'critical') criticalCount++;
        if (severity === 'medium') mediumCount++;
        if (severity === 'low') lowCount++;
        
        if (filter === 'all' || severity === filter) {
            visibleCount++;
        }
    });

    // Update button counts
    updateButtonCounts(criticalCount, mediumCount, lowCount);

    // Update info text
    const filterInfoEl = document.getElementById('filterInfo');
    if (filterInfoEl) {
        let infoText;
        if (filter === 'all') {
            infoText = `All Incidents (${markers.length} total)`;
        } else {
            const severityLabel = filter.charAt(0).toUpperCase() + filter.slice(1);
            infoText = `${severityLabel} Incidents (${visibleCount} on map)`;
        }
        filterInfoEl.textContent = infoText;
        filterInfoEl.style.animation = 'fadeIn 0.3s ease-out';
    }
}

function updateButtonCounts(criticalCount, mediumCount, lowCount) {
    const allBtn = document.querySelector('[data-filter="all"]');
    const criticalBtn = document.querySelector('[data-filter="critical"]');
    const mediumBtn = document.querySelector('[data-filter="medium"]');
    const lowBtn = document.querySelector('[data-filter="low"]');

    const totalCount = criticalCount + mediumCount + lowCount;

    // Helper function to update or create badge
    function updateBadge(btn, count, categoryClass = '') {
        if (!btn) return;
        
        let badge = btn.querySelector('.filter-count');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = `filter-count${categoryClass ? ' ' + categoryClass : ''}`;
            btn.appendChild(badge);
        }
        badge.textContent = count;
    }

    // Update badges
    updateBadge(allBtn, totalCount);
    updateBadge(criticalBtn, criticalCount, 'critical');
    updateBadge(mediumBtn, mediumCount, 'medium');
    updateBadge(lowBtn, lowCount, 'low');

    console.log(`📊 Updated filter counts - Critical: ${criticalCount}, Medium: ${mediumCount}, Low: ${lowCount}`);
}

function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

function renderMapMarkers() {
    markStart('renderMapMarkers');
    if (!map) {
        markEnd('renderMapMarkers');
        return;
    }
    clearMarkers();

    console.log(`📍 Rendering ${incidentsData.length} incidents on map...`);

    incidentsData.forEach((incident, index) => {
        if (typeof incident.lat === 'number' && typeof incident.lng === 'number' && (incident.lat !== 0 || incident.lng !== 0)) {
            addMarker(incident);
        } else {
            console.warn(`⚠️  Incident ${incident.caseId} missing valid coordinates`, { lat: incident.lat, lng: incident.lng });
        }
    });

    // Initialize filter info after markers are added
    setTimeout(() => {
        updateFilterInfo('all');
    }, 100);

    markEnd('renderMapMarkers');
}

/**
 * Refresh map with reported cases - call this after cases are reported/deleted
 */
function refreshMapWithReportedCases() {
    // Reload all incidents and merge with reported cases
    const cachedIncidents = getFromCache('incidents') || sampleIncidents;
    updateMapAndCases(cachedIncidents);
    console.log('🔄 Map refreshed with latest reported cases');
}

async function loadIncidents() {
    markStart('loadIncidents');
    // Check cache first
    const cachedIncidents = getFromCache('incidents');
    if (cachedIncidents) {
        console.log('✅ Using cached incidents');
        updateMapAndCases(cachedIncidents);
        markEnd('loadIncidents');
        return;
    }

    // If backend disabled, use sample data
    if (!API_BASE) {
        console.log('📦 Backend disabled - using sample incident data');
        saveToCache('incidents', sampleIncidents);
        updateMapAndCases(sampleIncidents);
        markEnd('loadIncidents');
        return;
    }

    if (Date.now() < incidentsBackendDisabledUntil) {
        if (!incidentsBackendWarned) {
            const minsRemaining = Math.ceil((incidentsBackendDisabledUntil - Date.now()) / 60000);
            console.warn(`⚠️  Incidents backend is temporarily unreachable. Using fallback data for ${minsRemaining} more minute(s).`);
            incidentsBackendWarned = true;
        }
        saveToCache('incidents', sampleIncidents);
        updateMapAndCases(sampleIncidents);
        markEnd('loadIncidents');
        return;
    }

    try {
        console.log(`🔗 Fetching incidents from ${API_BASE}/api/incidents...`);
        const response = await fetch(`${API_BASE}/api/incidents`, { signal: AbortSignal.timeout(5000) });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();

        // Use sample data if API returns empty array
        const incidentsToUse = data && data.length > 0 ? data : sampleIncidents;

        if (Array.isArray(incidentsToUse) && incidentsToUse.length > 0) {
            console.log(`✅ Loaded ${incidentsToUse.length} incidents from backend`);
            saveToCache('incidents', incidentsToUse);
            updateMapAndCases(incidentsToUse);
        } else {
            throw new Error("No incidents data from API");
        }
    } catch (error) {
        console.warn(`⚠️  Failed to load incidents from backend (${API_BASE}):`, error.message);
        incidentsBackendDisabledUntil = Date.now() + INCIDENTS_BACKEND_COOLDOWN_MS;
        incidentsBackendWarned = false;
        console.log('📦 Using sample incident data as fallback');
        saveToCache('incidents', sampleIncidents);
        updateMapAndCases(sampleIncidents);
    }
    markEnd('loadIncidents');
}

/**
 * Get reported cases from localStorage and format them
 */
function getReportedCasesForMap() {
    try {
        const stored = localStorage.getItem(USER_REPORTS_STORAGE_KEY);
        if (!stored) return [];
        
        const reportedCases = JSON.parse(stored);
        return Array.isArray(reportedCases) ? reportedCases : [];
    } catch (error) {
        console.error('Error loading reported cases:', error);
        return [];
    }
}

function updateMapAndCases(incidents) {
    markStart('updateMapAndCases');
    
    // Normalize official incidents
    const normalizedIncidents = incidents.map(i => ({
        id: i._id || i.id,
        caseId: i.caseId || i._id || i.id,
        type: i.type || 'Unknown',
        description: i.description || '',
        location: i.location || '',
        severity: i.severity || 'low',
        status: i.status || 'active',
        reported: i.createdAt ? new Date(i.createdAt).toLocaleString() : (i.reported || 'Just now'),
        lat: typeof i.lat === 'number' ? i.lat : 0,
        lng: typeof i.lng === 'number' ? i.lng : 0,
        contact: i.contact || '',
        people: i.people || '',
        isUserReported: false
    }));

    // Load and normalize reported cases from localStorage
    const reportedCases = getReportedCasesForMap();
    const normalizedReported = reportedCases.map(r => ({
        id: r._id || r.id || `user-${Date.now()}-${Math.random()}`,
        caseId: r.caseId || r.id || `REPORTED-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        type: r.type || 'Unknown',
        description: r.description || '',
        location: r.location || '',
        severity: r.severity || 'low',
        status: r.status || 'reported',
        reported: r.reportedAt ? new Date(r.reportedAt).toLocaleString() : (r.reported || 'Just now'),
        lat: typeof r.lat === 'number' ? r.lat : 0,
        lng: typeof r.lng === 'number' ? r.lng : 0,
        contact: r.contact || '',
        people: r.people || '',
        reportedBy: r.reportedBy || 'Anonymous',
        isUserReported: true
    }));

    // Combine official incidents and reported cases
    incidentsData = [...normalizedIncidents, ...normalizedReported];

    console.log(`📊 Map data: ${normalizedIncidents.length} official incident(s) + ${normalizedReported.length} user-reported case(s) = ${incidentsData.length} total`);

    // Use the same data for cases and map
    casesData = incidentsData;

    renderMapMarkers();
    renderCases(casesData);
    updateStats();
    markEnd('updateMapAndCases');
}

// ========================================
// News Updates
// ========================================

const newsData = [
    {
        badge: 'breaking',
        title: 'Major earthquake detected in California region - Emergency response teams deployed',
        time: '5 minutes ago'
    },
    {
        badge: 'update',
        title: 'Flood situation improving in coastal areas - Water levels receding',
        time: '23 minutes ago'
    },
    {
        badge: 'alert',
        title: 'Storm warning issued for northeastern states - Residents advised to take precautions',
        time: '1 hour ago'
    },
    {
        badge: 'breaking',
        title: 'Wildfire contained in forest area - No casualties reported',
        time: '2 hours ago'
    },
    {
        badge: 'update',
        title: 'Emergency shelter capacity increased in affected zones',
        time: '3 hours ago'
    },
    {
        badge: 'alert',
        title: 'Weather advisory: Heavy rainfall expected in midwest region',
        time: '4 hours ago'
    }
];

async function loadNews() {
    markStart('loadNews');
    const newsList = getElement('newsList');
    if (!newsList) return;
    newsList.innerHTML = '';

    // Check cache first (24 hour validity)
    const cachedNews = getFromCache('news');
    const now = Date.now();
    if (cachedNews) {
        // Check if cache is fresh (less than 24 hours old)
        const cacheAge = cachedNews.timestamp ? (now - cachedNews.timestamp) : 0;
        const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < MAX_CACHE_AGE) {
            console.log(`✅ Using cached news (${Math.round(cacheAge / 1000 / 60)}m old, expires in ${Math.round((MAX_CACHE_AGE - cacheAge) / 1000 / 60)}m)`);
            markStart('renderNewsList');
            renderNewsList(cachedNews.articles || cachedNews);
            markEnd('renderNewsList');
            markEnd('loadNews');
            return;
        }
    }

    // Show sample news immediately (don't block UI)
    loadSampleNews();

    if (newsFetchState.inFlight) {
        markEnd('loadNews');
        return;
    }

    if (Date.now() < newsFetchState.cooldownUntil) {
        const minsRemaining = Math.ceil((newsFetchState.cooldownUntil - Date.now()) / 60000);
        console.log(`ℹ️ [News] Skipping live fetch for ${minsRemaining} minute(s): ${newsFetchState.reason}`);
        markEnd('loadNews');
        return;
    }
    
    // Try to update from GNews API in background (don't block UI)
    console.log('🔄 Updating news from GNews API in background...');
    
    newsFetchState.inFlight = true;

    fetch('/api/news', { signal: AbortSignal.timeout(5000) })
        .then(response => {
            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('⚠️ [GNews] Rate limit reached. Next update in 24 hours.');
                    newsFetchState.cooldownUntil = Date.now() + 24 * 60 * 60 * 1000;
                    newsFetchState.reason = 'Rate limited by news provider';
                } else if (response.status === 401 || response.status === 403) {
                    console.warn(`⚠️ [News] API authorization failed (${response.status}). Check server-side GNEWS_API_KEY.`);
                    newsFetchState.cooldownUntil = Date.now() + 12 * 60 * 60 * 1000;
                    newsFetchState.reason = 'Missing/invalid server-side API key';
                } else {
                    console.warn(`⚠️ [News] API error: ${response.status}`);
                    newsFetchState.cooldownUntil = Date.now() + NEWS_FAILURE_COOLDOWN_MS;
                    newsFetchState.reason = `HTTP ${response.status}`;
                }
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.articles && data.articles.length > 0) {
                console.log(`✅ Updated ${data.articles.length} news articles from API`);
                saveToCache('news', {
                    articles: data.articles,
                    timestamp: Date.now()
                });
                newsFetchState.cooldownUntil = 0;
                newsFetchState.reason = '';
                // Update UI with fresh news
                renderNewsList(data.articles);
            }
        })
        .catch(error => {
            console.warn('⚠️ [News] Failed to fetch live news:', error.message);
            newsFetchState.cooldownUntil = Date.now() + NEWS_FAILURE_COOLDOWN_MS;
            newsFetchState.reason = error.message || 'Network failure';
        })
        .finally(() => {
            newsFetchState.inFlight = false;
        });
    
    markEnd('loadNews');
}

function renderNewsList(articles) {
    const newsList = getElement('newsList');
    const featuredNews = getElement('featuredNews');
    if (!newsList) return;
    
    const fragment = document.createDocumentFragment();
    newsList.innerHTML = '';

    // Show featured breaking news (first article)
    if (articles && articles.length > 0) {
        const featuredArticle = articles[0];
        const featuredBadge = getBadgeType(featuredArticle.title || '');
        const featuredTitle = featuredArticle.title || '';
        const featuredTime = featuredArticle.publishedAt ? formatTime(featuredArticle.publishedAt) : (featuredArticle.time || 'Recently');
        
        if (featuredNews) {
            document.getElementById('featuredTitle').textContent = featuredTitle;
            document.getElementById('featuredTime').textContent = featuredTime;
            if (featuredArticle.url) {
                document.getElementById('featuredLink').href = featuredArticle.url;
            }
            featuredNews.style.display = 'block';
        }
    }

    // Render remaining news items (skip first one since it's featured)
    const newsItemsToRender = articles && articles.length > 1 ? articles.slice(1) : articles;
    
    newsItemsToRender.forEach((article, index) => {
        const badge = getBadgeType(article.title || article.badge);
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.style.animationDelay = `${index * 0.1}s`;
        newsItem.style.animation = 'fadeIn 0.4s ease-out both';

        const displayTitle = article.title || (typeof article === 'string' ? article : '');
        const displayTime = article.publishedAt ? formatTime(article.publishedAt) : (article.time || 'Recently');

        newsItem.innerHTML = `
            <div class="news-badge badge-${badge}">${badge}</div>
            <div class="news-title">${displayTitle}</div>
            <div class="news-time">${displayTime}</div>
        `;

        if (article.url) {
            newsItem.addEventListener('click', function () {
                window.open(article.url, "_blank");
            });
            newsItem.style.cursor = 'pointer';
        }

        fragment.appendChild(newsItem);
    });
    
    // Single DOM operation
    newsList.appendChild(fragment);
}

function loadSampleNews() {
    const newsList = document.getElementById('newsList');
    const featuredNews = document.getElementById('featuredNews');
    newsList.innerHTML = '';

    const sampleLiveNews = [
        {
            badge: 'breaking',
            title: 'Heavy rainfall triggers flash floods in coastal districts - Urgent evacuation underway',
            time: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
            badge: 'breaking',
            title: 'Strong earthquake tremors felt across multiple states - No casualties reported yet',
            time: new Date(Date.now() - 45 * 60000).toISOString()
        },
        {
            badge: 'alert',
            title: 'Severe weather alert issued for tomorrow - Heavy wind and rain expected',
            time: new Date(Date.now() - 90 * 60000).toISOString()
        },
        {
            badge: 'update',
            title: 'Rescue operations continue in flood-affected areas - Over 500 people evacuated',
            time: new Date(Date.now() - 2.5 * 3600000).toISOString()
        },
        {
            badge: 'update',
            title: 'Government opens 25 relief centers in disaster zones - Medical aid being provided',
            time: new Date(Date.now() - 3.5 * 3600000).toISOString()
        },
        {
            badge: 'alert',
            title: 'Landslide risk warning for hilly regions - Residents advised to stay alert',
            time: new Date(Date.now() - 4.5 * 3600000).toISOString()
        }
    ];

    // Show featured breaking news
    if (sampleLiveNews.length > 0) {
        const featured = sampleLiveNews[0];
        if (featuredNews) {
            document.getElementById('featuredTitle').textContent = featured.title;
            document.getElementById('featuredTime').textContent = formatTime(featured.time);
            document.getElementById('featuredLink').href = '#';
            featuredNews.style.display = 'block';
        }
    }

    // Show remaining news items (skip first one)
    sampleLiveNews.slice(1).forEach((news, index) => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.style.animationDelay = `${index * 0.1}s`;
        newsItem.style.animation = 'fadeIn 0.4s ease-out both';

        newsItem.innerHTML = `
            <div class="news-badge badge-${news.badge}">${news.badge}</div>
            <div class="news-title">${news.title}</div>
            <div class="news-time">${formatTime(news.time)}</div>
        `;

        newsList.appendChild(newsItem);
    });
}

function getBadgeType(title) {
    const text = title.toLowerCase();

    if (text.includes("earthquake") || text.includes("cyclone") || text.includes("tsunami")) {
        return "breaking";
    }

    if (text.includes("warning") || text.includes("alert")) {
        return "alert";
    }

    return "update";
}

function formatTime(dateString) {
    const published = new Date(dateString);
    const now = new Date();

    const diff = Math.floor((now - published) / 1000);

    const minutes = Math.floor(diff / 60);
    const hours = Math.floor(diff / 3600);

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;

    return published.toLocaleDateString();
}

// Refresh news
document.getElementById('refreshNews').addEventListener('click', function () {
    this.style.transform = 'rotate(360deg)';
    this.style.transition = 'transform 0.4s ease-out';
    // Clear news cache to force fresh fetch
    API_CACHE.news = { data: null, timestamp: 0, ttl: 30 * 60 * 1000 };
    setTimeout(() => {
        this.style.transform = 'rotate(0deg)';
        loadNews();
    }, 400);
});

// ========================================
// Cases Table
// ========================================

let casesData = [];
let debouncedSearch, debouncedFilter;

function loadCases() {
    if (!casesInitialized) {
        // Search functionality with debouncing
        const searchInput = getElement('searchCases');
        if (searchInput) {
            debouncedSearch = debounce(function(searchTerm) {
                const filtered = casesData.filter(c =>
                    c.id.toLowerCase().includes(searchTerm) ||
                    c.type.toLowerCase().includes(searchTerm) ||
                    c.location.toLowerCase().includes(searchTerm)
                );
                renderCases(filtered);
            }, 300);
            
            searchInput.addEventListener('input', function (e) {
                debouncedSearch(e.target.value.toLowerCase());
            });
        }

        // Filter functionality
        const filterSelect = getElement('filterStatus');
        if (filterSelect) {
            debouncedFilter = debounce(function(filterValue) {
                const filtered = filterValue === 'all'
                    ? casesData
                    : casesData.filter(c => c.severity === filterValue || c.status === filterValue);
                renderCases(filtered);
            }, 300);
            
            filterSelect.addEventListener('change', function (e) {
                debouncedFilter(e.target.value);
            });
        }

        casesInitialized = true;
    }

    renderCases(casesData);
}

function renderCases(cases) {
    const tbody = getElement('casesTableBody');
    if (!tbody) return;
    
    // Use DocumentFragment for batch DOM insertions
    const fragment = document.createDocumentFragment();
    tbody.innerHTML = '';

    const isAdminUser = isAdmin();

    cases.forEach((caseItem, index) => {
        const row = document.createElement('tr');
        row.style.animation = `slideUpIn 0.4s ease-out ${index * 0.05}s both`;
        
        // Build action buttons - always show view, conditionally show edit/delete
        let actionsHTML = `
            <button class="btn-action" onclick="viewCase('${caseItem.id}')" title="View details">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </button>`;

        // Only show edit/delete buttons for admin users
        if (isAdminUser) {
            actionsHTML += `
            <button class="btn-action" onclick="editCase('${caseItem.id}')" title="Edit case">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </button>
            <button class="btn-action" onclick="deleteCase('${caseItem.id}')" title="Delete case">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>`;
        }

        row.innerHTML = `
            <td><span class="case-id">${caseItem.id}</span></td>
            <td><span class="case-type">${caseItem.type}</span></td>
            <td>${caseItem.location}</td>
            <td>
                <span class="severity-badge severity-${caseItem.severity}">
                    ${caseItem.severity}
                </span>
            </td>
            <td>
                <span class="status-badge-table ${caseItem.status === 'resolved' ? 'status-resolved' : 'status-active-table'}">
                    ${caseItem.status}
                </span>
            </td>
            <td>${caseItem.reported}</td>
            <td>
                <div class="case-actions">
                    ${actionsHTML}
                </div>
            </td>
        `;
        fragment.appendChild(row);
    });
    
    // Single DOM operation
    tbody.appendChild(fragment);
}

// Case actions
function viewCase(id) {
    // First try to find in global cases data
    let caseItem = casesData.find(c => c.id === id);
    
    // If not found, try to find in user's reports (localStorage)
    if (!caseItem) {
        try {
            const stored = localStorage.getItem(USER_REPORTS_STORAGE_KEY);
            if (stored) {
                const userReports = JSON.parse(stored);
                caseItem = userReports.find(c => (c.id === id || c.caseId === id));
            }
        } catch (error) {
            console.error('Error loading case from reports:', error);
        }
    }
    
    if (caseItem) {
        const caseDetailsModal = document.getElementById('caseDetailsModal');
        const caseDetailsTitle = document.getElementById('caseDetailsTitle');
        const caseDetailsId = document.getElementById('caseDetailsId');
        const caseDetailsType = document.getElementById('caseDetailsType');
        const caseDetailsSeverity = document.getElementById('caseDetailsSeverity');
        const caseDetailsStatus = document.getElementById('caseDetailsStatus');
        const caseDetailsLocation = document.getElementById('caseDetailsLocation');
        const caseDetailsReported = document.getElementById('caseDetailsReported');
        const caseDetailsContact = document.getElementById('caseDetailsContact');
        const caseDetailsPeople = document.getElementById('caseDetailsPeople');
        const caseDetailsDescription = document.getElementById('caseDetailsDescription');
        const caseDetailsMediaImage = document.getElementById('caseDetailsMediaImage');
        const caseDetailsMediaFallback = document.getElementById('caseDetailsMediaFallback');
        const caseDetailsMediaMeta = document.getElementById('caseDetailsMediaMeta');

        const mediaProof = caseItem.mediaProof || {};
        const mediaPreviewUrl = mediaProof.previewUrl || mediaProof.previewDataUrl || mediaProof.dataUrl || '';
        const mediaUploadedAt = mediaProof.uploadedAt ? new Date(mediaProof.uploadedAt).toLocaleString() : 'N/A';
        const mediaFileSize = mediaProof.fileSize || 'N/A';

        if (caseDetailsTitle) caseDetailsTitle.textContent = `${caseItem.type || 'Case'} Details`;
        if (caseDetailsId) caseDetailsId.textContent = caseItem.id || caseItem.caseId || 'N/A';
        if (caseDetailsType) caseDetailsType.textContent = caseItem.type || 'N/A';
        if (caseDetailsSeverity) caseDetailsSeverity.textContent = (caseItem.severity || 'N/A').toString().toUpperCase();
        if (caseDetailsStatus) caseDetailsStatus.textContent = (caseItem.status || 'N/A').toString().toUpperCase();
        if (caseDetailsLocation) caseDetailsLocation.textContent = caseItem.location || 'N/A';
        if (caseDetailsReported) caseDetailsReported.textContent = caseItem.reported || caseItem.reportedAt || 'N/A';
        if (caseDetailsContact) caseDetailsContact.textContent = caseItem.contact || 'N/A';
        if (caseDetailsPeople) caseDetailsPeople.textContent = caseItem.people || 'N/A';
        if (caseDetailsDescription) caseDetailsDescription.textContent = caseItem.description || 'No description provided.';

        if (caseDetailsMediaImage && caseDetailsMediaFallback && caseDetailsMediaMeta) {
            const isImageMedia = mediaPreviewUrl && (!mediaProof.fileType || mediaProof.fileType.startsWith('image/'));

            if (isImageMedia) {
                caseDetailsMediaImage.src = mediaPreviewUrl;
                caseDetailsMediaImage.style.display = 'block';
                caseDetailsMediaFallback.style.display = 'none';
                caseDetailsMediaMeta.textContent = `File: ${mediaProof.fileName || 'Unknown'} | Size: ${mediaFileSize} | Uploaded: ${mediaUploadedAt}`;
            } else {
                caseDetailsMediaImage.removeAttribute('src');
                caseDetailsMediaImage.style.display = 'none';
                caseDetailsMediaFallback.style.display = 'flex';
                caseDetailsMediaMeta.textContent = mediaProof.fileName
                    ? `File: ${mediaProof.fileName} | Uploaded: ${mediaUploadedAt}`
                    : 'No media attached';
            }
        }

        if (caseDetailsModal) {
            caseDetailsModal.classList.add('active');
        } else {
            alert(`❌ Case ${id} details are available, but the details modal is missing.`);
        }
    } else {
        alert(`❌ Case ${id} not found. It may have been deleted.`);
    }
}

function editCase(id) {
    // Check authorization
    if (!checkAuthorization('edit_case', getCurrentUserEmail())) {
        alert('❌ Only administrators can edit cases.');
        return;
    }
    alert(`✏️ Edit functionality for case ${id} would be implemented here`);
}

async function deleteCase(id) {
    // Get current user info
    const currentUserEmail = getCurrentUserEmail();
    const userRole = getCurrentUserRole();
    
    // Verify user is logged in
    if (!currentUserEmail) {
        alert('❌ You must be logged in to delete cases.');
        console.warn('⚠️ Deletion attempted without login');
        return;
    }

    // Verify user is an admin (double-check)
    const isAdminUser = ADMIN_CREDENTIALS.emails.includes(currentUserEmail);
    if (!isAdminUser || userRole !== USER_ROLES.ADMIN) {
        alert(`❌ Only administrators can delete cases.\n\nYour email: ${currentUserEmail}\nYour role: ${userRole}`);
        console.error(`🚫 UNAUTHORIZED DELETION ATTEMPT - Email: ${currentUserEmail}, Role: ${userRole}`);
        return;
    }

    // Check authorization
    if (!checkAuthorization('delete_case', currentUserEmail)) {
        alert('❌ You do not have permission to delete cases.');
        console.error(`🚫 Authorization check failed for ${currentUserEmail}`);
        return;
    }
    
    const caseToDelete = casesData.find(c => c.id === id || c.caseId === id);
    if (!caseToDelete) {
        alert('❌ Case not found.');
        console.warn(`⚠️ Case ${id} not found in data`);
        return;
    }
    
    if (!confirm(`Are you sure you want to delete case ${caseToDelete.caseId || id}?`)) return;

    try {
        console.log(`🗑️ Admin (${currentUserEmail}) deleting case ${caseToDelete.caseId || id}...`);
        
        // Try API deletion first (if backend available)
        if (API_BASE && API_BASE.includes('localhost')) {
            try {
                const apiResponse = await fetch(`${API_BASE}/api/incidents/${id}`, { 
                    method: 'DELETE',
                    signal: AbortSignal.timeout(3000)
                });
                if (!apiResponse.ok) throw new Error(`API returned ${apiResponse.status}`);
                console.log(`✅ Case ${id} deleted from API`);
            } catch (apiError) {
                console.warn(`⚠️ API deletion failed, using local deletion:`, apiError.message);
                // Continue to local deletion
            }
        }

        // Local deletion fallback (always executed)
        const initialLength = casesData.length;
        casesData = casesData.filter(c => c.id !== id && c.caseId !== id);
        
        if (casesData.length === initialLength) {
            throw new Error('Case not found in local data');
        }

        // If it's a user-reported case, also remove from user reports storage
        if (caseToDelete.isUserReported) {
            try {
                let userReports = [];
                const stored = localStorage.getItem(USER_REPORTS_STORAGE_KEY);
                if (stored) {
                    userReports = JSON.parse(stored);
                }

                userReports = userReports.filter(r => 
                    r.id !== id && r.caseId !== id
                );

                localStorage.setItem(USER_REPORTS_STORAGE_KEY, JSON.stringify(userReports));
                console.log(`✅ Case ${id} removed from user reports`);
            } catch (err) {
                console.warn(`⚠️ Could not remove from user reports:`, err);
            }
        }

        // Refresh UI
        renderCases(casesData);
        refreshMapWithReportedCases();
        updateStats();

        console.log(`✨ Case ${caseToDelete.caseId || id} deleted successfully by ${currentUserEmail}`);
        alert(`✅ Case ${caseToDelete.caseId || id} deleted successfully`);
    } catch (error) {
        console.error('❌ Failed to delete case:', error);
        alert(`❌ Failed to delete case: ${error.message}`);
    }
}

// ========================================
// Modals
// ========================================

function initializeModals() {
    // Report Case Modal
    const reportModal = document.getElementById('reportModal');
    const reportBtn = document.getElementById('reportCaseBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelReport = document.getElementById('cancelReport');
    const reportForm = document.getElementById('reportForm');

    reportBtn.addEventListener('click', function (e) {
        e.preventDefault();
        reportModal.classList.add('active');
    });

    closeModal.addEventListener('click', function () {
        reportModal.classList.remove('active');
        reportForm.reset();
        // Reset stored location coordinates
        lastPreciseLocationLat = null;
        lastPreciseLocationLng = null;
    });

    cancelReport.addEventListener('click', function () {
        reportModal.classList.remove('active');
        reportForm.reset();
        // Reset stored location coordinates
        lastPreciseLocationLat = null;
        lastPreciseLocationLng = null;
    });

    reportModal.addEventListener('click', function (e) {
        if (e.target === reportModal) {
            reportModal.classList.remove('active');
            reportForm.reset();
        }
    });

    const caseDetailsModal = document.getElementById('caseDetailsModal');
    const closeCaseDetailsModal = document.getElementById('closeCaseDetailsModal');

    if (caseDetailsModal && closeCaseDetailsModal) {
        closeCaseDetailsModal.addEventListener('click', function () {
            caseDetailsModal.classList.remove('active');
        });

        caseDetailsModal.addEventListener('click', function (e) {
            if (e.target === caseDetailsModal) {
                caseDetailsModal.classList.remove('active');
            }
        });
    }

    // Handle media file selection visual feedback
    const mediaInput = document.getElementById('caseMediaProof');
    if (mediaInput) {
        mediaInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const fileSize = (file.size / (1024 * 1024)).toFixed(2);
                console.log(`📸 Media file selected: ${file.name} (${fileSize} MB)`);
            }
        });

        function readFileAsDataUrl(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Unable to read media file for preview.'));
                reader.readAsDataURL(file);
            });
        }
    }

    // Fetch location button handler
    const fetchLocationBtn = document.getElementById('fetchLocationBtn');
    if (fetchLocationBtn) {
        fetchLocationBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
            this.disabled = true;

            if (!navigator.geolocation) {
                alert('❌ Geolocation is not supported by your browser.');
                this.innerHTML = originalText;
                this.disabled = false;
                return;
            }

            try {
                navigator.geolocation.getCurrentPosition(
                    async function (position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const accuracy = position.coords.accuracy;

                        // Store precise coordinates for later use in form submission
                        lastPreciseLocationLat = lat;
                        lastPreciseLocationLng = lng;

                        try {
                            // Use Nominatim (OpenStreetMap) for reverse geocoding
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                            );
                            const data = await response.json();
                            
                            // Extract location name from address
                            let locationName = '';
                            if (data.address) {
                                // Try to build a meaningful location name
                                const addr = data.address;
                                locationName = addr.village || addr.town || addr.city || addr.county || 'Unknown Location';
                                if (addr.state) {
                                    locationName += ', ' + addr.state;
                                }
                            }

                            if (!locationName) {
                                locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                            }

                            document.getElementById('caseLocation').value = locationName;
                            alert(`✅ Location fetched successfully!\n\n📍 ${locationName}\n📊 GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n🎯 Accuracy: ±${accuracy.toFixed(0)}m`);
                        } catch (error) {
                            // Fallback: just show coordinates
                            const fallbackLocation = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                            document.getElementById('caseLocation').value = fallbackLocation;
                            alert(`✅ Location fetched (coordinates only):\n📍 ${fallbackLocation}\n🎯 Accuracy: ±${accuracy.toFixed(0)}m`);
                        }
                        
                        // Reset button
                        fetchLocationBtn.innerHTML = originalText;
                        fetchLocationBtn.disabled = false;
                    },
                    function (error) {
                        let errorMsg = '';
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMsg = '❌ Location permission denied. Please enable location access in your browser settings.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMsg = '❌ Location information is unavailable. Please try again.';
                                break;
                            case error.TIMEOUT:
                                errorMsg = '❌ Location request timed out. Please try again.';
                                break;
                            default:
                                errorMsg = '❌ An error occurred while fetching location.';
                        }
                        alert(errorMsg);
                        fetchLocationBtn.innerHTML = originalText;
                        fetchLocationBtn.disabled = false;
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } catch (error) {
                console.error('Geolocation error:', error);
                alert('❌ Failed to fetch location. Please try again.');
                this.innerHTML = originalText;
                this.disabled = false;
            }
        });
    }

    reportForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate media proof upload
        const mediaInput = document.getElementById('caseMediaProof');
        const mediaFile = mediaInput?.files[0];
        
        if (!mediaFile) {
            alert('❌ Media proof is required! Please upload an image or video of the incident.');
            mediaInput?.focus();
            return;
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (mediaFile.size > maxSize) {
            alert('❌ File size is too large! Maximum allowed size is 50MB.');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
        if (!allowedTypes.includes(mediaFile.type)) {
            alert('❌ Invalid file type! Only images (JPG, PNG, GIF, WEBP) and videos (MP4, MOV, AVI) are allowed.');
            return;
        }

        let mediaPreviewUrl = '';
        if (mediaFile.type.startsWith('image/')) {
            try {
                mediaPreviewUrl = await readFileAsDataUrl(mediaFile);
            } catch (previewError) {
                console.warn('Unable to create image preview, continuing without it:', previewError);
            }
        }

        const formData = {
            type: document.getElementById('caseType').value,
            severity: document.getElementById('caseSeverity').value,
            location: document.getElementById('caseLocation').value,
            description: document.getElementById('caseDescription').value,
            contact: document.getElementById('caseContact').value,
            people: document.getElementById('casePeople').value,
            mediaFileName: mediaFile.name,
            mediaFileSize: (mediaFile.size / (1024 * 1024)).toFixed(2) + ' MB'
        };

        // Use precise location from locate button if available, otherwise use map center as fallback
        let lat = 19.0760;  // Default Mumbai
        let lng = 72.8777;

        // Check if we have precise location from the locate button
        if (lastPreciseLocationLat !== null && lastPreciseLocationLng !== null) {
            lat = lastPreciseLocationLat;
            lng = lastPreciseLocationLng;
            console.log('✅ Using precise location from locate button:', lat, lng);
        } else if (map && typeof map.getCenter === 'function') {
            // Fallback to map center if available
            try {
                const center = map.getCenter();
                if (center && typeof center.lat === 'function') {
                    lat = center.lat();
                    lng = center.lng();
                } else if (center && typeof center.lat === 'number') {
                    lat = center.lat;
                    lng = center.lng;
                }
            } catch (e) {
                console.warn('Could not get map center:', e);
            }
        }

        // Generate a case ID (frontend side)
        const newId = `DS-${Date.now()}`;

        const payload = {
            caseId: newId,
            type: formData.type.charAt(0).toUpperCase() + formData.type.slice(1),
            location: formData.location,
            description: formData.description,
            severity: formData.severity,
            status: 'active',
            contact: formData.contact,
            people: formData.people,
            lat: lat,
            lng: lng,
            mediaProof: {
                fileName: formData.mediaFileName,
                fileSize: formData.mediaFileSize,
                fileType: mediaFile.type,
                uploadedAt: new Date().toISOString()
            }
        };

        const localMediaProof = {
            ...payload.mediaProof,
            previewUrl: mediaPreviewUrl
        };

        try {
            const response = await fetch(`${API_BASE}/api/incidents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const created = await response.json();
            console.log('Case created:', created);

            // Add the newly created case to the local data immediately (optimistic update)
            const newCase = {
                id: created._id || newId,
                caseId: created.caseId || newId,
                type: payload.type,
                description: payload.description,
                location: payload.location,
                severity: payload.severity,
                status: 'active',
                reported: new Date().toLocaleString(),
                lat: payload.lat,
                lng: payload.lng,
                contact: payload.contact,
                people: payload.people,
                reportedBy: sessionStorage.getItem('username') || 'Anonymous',
                reportedAt: new Date().toISOString(),
                isUserReported: true,
                mediaProof: localMediaProof
            };

            // Add to the beginning of cases array
            casesData.unshift(newCase);
            
            // Track in user's reports
            addToUserReports(newCase);
            
            // Add to community public incidents feed
            addToPublicIncidents(newCase);

            // Re-render the table and map
            renderCases(casesData);
            refreshMapWithReportedCases();
            updateStats();

            alert(`✅ Case ${payload.caseId} has been successfully reported!\n\nType: ${payload.type}\nLocation: ${payload.location}\nSeverity: ${payload.severity}\nMedia Proof: ${formData.mediaFileName} (${formData.mediaFileSize})\n\nThis incident is now visible in the Community Public Feed!`);

        } catch (error) {
            console.error('Error reporting case:', error);
            
            // Show error but still add to local data for offline support
            const newCase = {
                id: newId,
                caseId: newId,
                type: payload.type,
                description: payload.description,
                location: payload.location,
                severity: payload.severity,
                status: 'active',
                reported: new Date().toLocaleString(),
                lat: payload.lat,
                lng: payload.lng,
                contact: payload.contact,
                people: payload.people,
                reportedBy: sessionStorage.getItem('username') || 'Anonymous',
                reportedAt: new Date().toISOString(),
                isUserReported: true,
                mediaProof: localMediaProof
            };

            // Add to the beginning of cases array
            casesData.unshift(newCase);
            
            // Track in user's reports
            addToUserReports(newCase);
            
            // Add to community public incidents feed
            addToPublicIncidents(newCase);

            // Re-render the table and map
            renderCases(casesData);
            refreshMapWithReportedCases();
            updateStats();

            alert(`⚠️ Case ${newId} reported locally (server may be offline).\n\nType: ${payload.type}\nLocation: ${payload.location}\nSeverity: ${payload.severity}\n\nThis incident will be visible in the Community Public Feed once online!`);
        } finally {
            reportModal.classList.remove('active');
            reportForm.reset();
        }
    });

    // Profile Modal
    const profileModal = document.getElementById('profileModal');
    const profileBtn = document.getElementById('profileBtn');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const btnEditProfile = document.getElementById('btnEditProfile');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const editProfileForm = document.getElementById('editProfileForm');
    const profileView = document.getElementById('profileView');
    const profileEdit = document.getElementById('profileEdit');

    profileBtn.addEventListener('click', function (e) {
        e.preventDefault();
        profileModal.classList.add('active');
        loadUserProfile();  // Load profile when modal opens
    });

    closeProfileModal.addEventListener('click', function () {
        profileModal.classList.remove('active');
    });

    profileModal.addEventListener('click', function (e) {
        if (e.target === profileModal) {
            profileModal.classList.remove('active');
        }
    });

    // Edit Profile Button
    btnEditProfile.addEventListener('click', function () {
        loadProfileFormData();  // Load current data into form
        profileView.style.display = 'none';
        profileEdit.style.display = 'block';
    });

    // Cancel Edit Button
    btnCancelEdit.addEventListener('click', function () {
        profileView.style.display = 'block';
        profileEdit.style.display = 'none';
    });

    // Save Profile Form
    editProfileForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveUserProfile();
    });
}

// ========================================
// User Profile Management
// ========================================

async function loadUserProfile() {
    const email = getCurrentUserEmail();
    if (!email) {
        console.warn('No user logged in');
        return;
    }

    try {
        // Try to load from localStorage first (as backup)
        const localProfile = localStorage.getItem(`profile_${email}`);
        if (localProfile) {
            const profile = JSON.parse(localProfile);
            displayProfile(profile);
            return;
        }

        // Try to load from Firebase Firestore
        if (window.firebase && window.firebase.firestore) {
            const db = window.firebase.firestore();
            const profileRef = db.collection('userProfiles').doc(email);
            const doc = await profileRef.get();
            
            if (doc.exists) {
                const profile = doc.data();
                localStorage.setItem(`profile_${email}`, JSON.stringify(profile));
                displayProfile(profile);
                console.log('✅ Profile loaded from Firebase');
                return;
            }
        }

        // If no profile found, create default one
        const defaultProfile = {
            name: email.split('@')[0],
            email: email,
            phone: '+91 0000 0000 00',
            department: 'Emergency Response',
            location: 'Not Set',
            role: getCurrentUserRole(),
            bio: ''
        };
        
        displayProfile(defaultProfile);
        console.log('📝 Displaying default profile');

    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function displayProfile(profile) {
    document.getElementById('profileName').textContent = profile.name || 'User';
    document.getElementById('profileEmail').textContent = profile.email || '';
    document.getElementById('profilePhone').textContent = profile.phone || 'Not Set';
    document.getElementById('profileDept').textContent = profile.department || 'Not Set';
    document.getElementById('profileLocation').textContent = profile.location || 'Not Set';
    document.getElementById('profileRole').textContent = profile.role || 'user';
    
    // Update avatar initials
    const initials = (profile.name || 'User')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    
    const avatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23667eea'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='40' font-family='Arial'%3E${initials}%3C/text%3E%3C/svg%3E`;
    document.getElementById('profileAvatarImg').src = avatarSvg;
    
    // ALSO UPDATE HEADER/SIDEBAR PROFILE
    updateHeaderProfile(profile);
}

/**
 * Update header/sidebar profile display
 */
function updateHeaderProfile(profile) {
    // Update sidebar header profile
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarRole = document.getElementById('sidebarUserRole');
    const sidebarAvatar = document.getElementById('sidebarAvatarImg');
    
    if (sidebarName) sidebarName.textContent = profile.name || 'User';
    if (sidebarRole) sidebarRole.textContent = profile.role || 'user';
    
    if (sidebarAvatar) {
        const initials = (profile.name || 'User')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        const avatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23667eea'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='40' font-family='Arial'%3E${initials}%3C/text%3E%3C/svg%3E`;
        sidebarAvatar.src = avatarSvg;
    }
    
    console.log('✅ Header profile updated:', profile.name);
}

function loadProfileFormData() {
    const email = getCurrentUserEmail();
    if (!email) return;

    // Get profile data from localStorage or default
    const localProfile = localStorage.getItem(`profile_${email}`);
    if (localProfile) {
        const profile = JSON.parse(localProfile);
        document.getElementById('editName').value = profile.name || '';
        document.getElementById('editPhone').value = profile.phone || '';
        document.getElementById('editDept').value = profile.department || '';
        document.getElementById('editLocation').value = profile.location || '';
        document.getElementById('editBio').value = profile.bio || '';
    } else {
        // Default values
        document.getElementById('editName').value = email.split('@')[0];
        document.getElementById('editPhone').value = '+91 0000 0000 00';
        document.getElementById('editDept').value = 'Emergency Response';
        document.getElementById('editLocation').value = '';
        document.getElementById('editBio').value = '';
    }
}

async function saveUserProfile() {
    const email = getCurrentUserEmail();
    if (!email) {
        alert('❌ No user logged in');
        return;
    }

    const profile = {
        name: document.getElementById('editName').value,
        email: email,
        phone: document.getElementById('editPhone').value,
        department: document.getElementById('editDept').value,
        location: document.getElementById('editLocation').value,
        bio: document.getElementById('editBio').value,
        role: getCurrentUserRole(),
        updatedAt: new Date().toISOString()
    };

    try {
        // Save to localStorage first (always works)
        localStorage.setItem(`profile_${email}`, JSON.stringify(profile));
        console.log('✅ Profile saved to localStorage:', profile);

        // Try to save to Firebase
        if (window.firebase && window.firebase.firestore) {
            try {
                const db = window.firebase.firestore();
                await db.collection('userProfiles').doc(email).set(profile, { merge: true });
                console.log('✅ Profile saved to Firebase');
            } catch (firebaseError) {
                console.warn('⚠️  Firebase save failed:', firebaseError.message);
            }
        }

        // UPDATE BOTH MODAL AND HEADER
        console.log('🔄 Updating display with new profile...');
        displayProfile(profile);
        updateHeaderProfile(profile);
        
        alert('✅ Profile updated successfully!');
        
        // Switch back to view mode
        document.getElementById('profileView').style.display = 'block';
        document.getElementById('profileEdit').style.display = 'none';
        
        console.log('✅ Profile update complete');

    } catch (error) {
        console.error('Error saving profile:', error);
        alert('⚠️  Profile saved locally. Firebase sync may have failed.');
    }
}

// ========================================
// Stats Update
// ========================================

function updateStats() {
    const activeCases = casesData.filter(c => c.status === 'active').length;
    const resolvedCases = casesData.filter(c => c.status === 'resolved').length;
    const criticalCases = casesData.filter(c => c.severity === 'critical' && c.status === 'active').length;

    document.getElementById('activeCases').textContent = activeCases;
    document.getElementById('resolvedCases').textContent = resolvedCases;
    document.getElementById('criticalCases').textContent = criticalCases;
}

// ========================================
// Last Updated Time
// ========================================

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = timeString;
}

// ========================================
// Navigation
// ========================================

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            // Don't prevent default for report case button (handled by modal)
            if (this.id !== 'reportCaseBtn') {
                e.preventDefault();
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');

                // Get the menu item text for future use
                const menuText = this.textContent.trim();
                console.log('Navigating to:', menuText);

                // Handle navigation
                showSection(menuText);
            }
        });
    });
}

function showSection(sectionName) {
    const statsCards = document.querySelector('.stats-cards');
    const contentGrid = document.querySelector('.content-grid');
    const casesSection = document.getElementById('casesSection');
    const communitySection = document.getElementById('communitySection');
    const myReportsSection = document.getElementById('myReportsSection');
    const emergencyResourcesSection = document.getElementById('emergencyResourcesSection');
    const alertsSection = document.getElementById('alertsSection');
    const settingsSection = document.getElementById('settingsSection');
    const aiAssistantSection = document.getElementById('aiAssistantSection');

    // Hide all sections
    casesSection.style.display = 'none';
    communitySection.style.display = 'none';
    myReportsSection.style.display = 'none';
    emergencyResourcesSection.style.display = 'none';
    alertsSection.style.display = 'none';
    settingsSection.style.display = 'none';
    aiAssistantSection.style.display = 'none';

    if (sectionName === 'Community') {
        statsCards.style.display = 'none';
        contentGrid.style.display = 'none';
        communitySection.style.display = 'block';
        if (typeof initializeCommunity === 'function') {
            initializeCommunity();
        } else {
            console.error('initializeCommunity function not found. Make sure community.js is loaded.');
        }
    } else if (sectionName === 'My Reports') {
        statsCards.style.display = 'none';
        contentGrid.style.display = 'none';
        myReportsSection.style.display = 'block';
        loadAndDisplayUserReports();
    } else if (sectionName === 'AI Assistant') {
        statsCards.style.display = 'none';
        contentGrid.style.display = 'none';
        aiAssistantSection.style.display = 'block';
    } else if (sectionName === 'Emergency Resources') {
        statsCards.style.display = 'none';
        contentGrid.style.display = 'none';
        emergencyResourcesSection.style.display = 'block';
        if (typeof initializeEmergencyResources === 'function') {
            initializeEmergencyResources();
        }
    } else if (sectionName === 'Alerts') {
        statsCards.style.display = 'none';
        contentGrid.style.display = 'none';
        alertsSection.style.display = 'block';
        if (typeof initializeAlerts === 'function') {
            initializeAlerts();
        }
    } else if (sectionName === 'Settings') {
        statsCards.style.display = 'none';
        contentGrid.style.display = 'none';
        settingsSection.style.display = 'block';
        if (typeof initializeSettings === 'function') {
            initializeSettings();
        }
    } else {
        statsCards.style.display = 'grid';
        contentGrid.style.display = 'grid';
        casesSection.style.display = 'block';
    }
}

// Community Features section moved to community.js
// Emergency Resources section moved to emergency-resources.js

// ========================================
// Advanced AI Assistant Chatbot
// ========================================

/**
 * Conversation history for context awareness
 */
let conversationHistory = [];

/**
 * Comprehensive AI Knowledge Base
 */
const aiKnowledgeBase = {
    flood: {
        keywords: ['flood', 'flooding', 'water', 'rainfall', 'heavy rain', 'rising water', 'inundation'],
        topics: ['preparation', 'safety', 'evacuation', 'during', 'after'],
        responses: {
            preparation: [
                "🌊 Flood Preparedness involves several key steps:\n\n1. Know your area - Research flood-prone zones near your home\n2. Create an evacuation plan with multiple routes\n3. Build an emergency kit with:\n   • Bottled water (1 gallon/person/day)\n   • Non-perishable food\n   • First aid kit\n   • Important documents in waterproof container\n   • Medications\n   • Flashlight and batteries\n4. Sign up for emergency alerts\n5. Practice your evacuation plan with family\n\n💡 Keep your kit in an accessible location and review it quarterly.",
                "Before flood season, you should:\n• Check insurance coverage (standard homeowners insurance doesn't cover floods)\n• Install check valves in plumbing\n• Raise utilities (AC, electrical panels) off ground floor\n• Seal cracks in basement walls\n• Install backflow preventers\n• Know your community's flood warning system\n\n📍 Contact your local emergency management office for detailed local information.",
                "Flood-resistant home improvements include:\n• Installing flood vents in foundation\n• Elevating your home on stilts or columns\n• Using flood-resistant materials in vulnerable areas\n• Installing sump pump and backup power\n• Creating rain gardens to absorb excess water\n• Maintaining gutters and drainage systems\n\nConsult with structural engineers for your specific property."
            ],
            safety: [
                "⚠️ During a flood, prioritize SAFETY:\n\n✓ Move to higher ground IMMEDIATELY\n✓ Never drive through flooded areas (\"Turn Around, Don't Drown\")\n✓ Avoid walking through moving water\n✓ Don't touch electrical equipment if wet\n✓ Avoid dark water (hidden dangers)\n✓ Stay away from downed power lines\n✓ Keep away from fast-moving water\n\n🚨 If trapped: Call 911, signal from window, not roof (unless immediate danger).\nHelp will come - floods recede.",
                "Water flow hazards:\n• 6 inches of moving water can knock you down\n• 12 inches of water can carry away a car\n• Floodwater is often contaminated with sewage and chemicals\n• Fast-moving water is extremely dangerous\n• Underwater debris and holes create hazards\n\nPriority: Personal safety > property protection. No possession is worth your life."
            ],
            evacuation: [
                "🚪 Flood Evacuation Checklist:\n\nBEFORE you leave:\n1. Shut off gas at meter/valve\n2. Leave lights ON so rescuers know you evacuated\n3. Close windows/doors (slows water entry)\n4. Take emergency supplies\n5. Lock your door\n\nEvacuation kit should include:\n• Copies (not originals) of important docs\n• Flash drive with photos of property\n• Medications\n• Cash and credit cards\n• Pet carriers and pet supplies\n• Comfortable walking shoes\n\nGo to designated shelter or stay with friends/family.",
                "When evacuating:\n• Follow official routes only\n• Fill gas tank before evacuation order\n• Leave early - don't wait\n• Tell someone where you're going\n• Take northern/western routes if possible\n• Keep phone charged\n• Use public transport if available\n• Don't stop to sightsee\n\nReturn home only when officials declare it safe."
            ],
            during: [
                "If caught in flooding:\n\n🏠 Inside home:\n• Move to higher floor immediately\n• Stay away from windows\n• Have emergency supplies accessible\n• Keep phone charged\n• Avoid basement completely\n• Don't use elevator\n• Signal from window if rescue needed\n\n🚗 In vehicle:\n• Abandon immediately if flood waters rising\n• Don't try to push through water\n• Climb to roof as last resort if water level rising fast\n• Wait for rescue\n\n🌊 Outdoors:\n• Move uphill immediately\n• Don't try to outrun water\n• Climb to elevated ground\n• Hold onto stable object\n• Call 911 if trapped"
            ],
            after: [
                "✅ After flood waters recede:\n\n1. Return home only when safe\n2. Check for structural damage\n3. Watch for hazards:\n   • Gas leaks (smell of rotten eggs)\n   • Downed power lines\n   • Contaminated water\n   • Mold growth (24-48 hours)\n4. Pump out basement slowly\n5. Use bottled water until tap water tested\n6. Document damage (photos/video) for insurance\n7. Throw away contaminated food\n8. Wash hands frequently\n\n🏥 Watch for illness - floodwater carries pathogens.\n📞 Contact insurance and FEMA (if applicable)."
            ]
        }
    },
    earthquake: {
        keywords: ['earthquake', 'quake', 'tremor', 'seismic', 'aftershock', 'temblor'],
        topics: ['preparation', 'during', 'safety', 'after'],
        responses: {
            preparation: [
                "🏚️ Earthquake Preparedness Strategies:\n\n1. Secure furniture & appliances:\n   • Bolt bookcases to walls\n   • Secure water heater\n   • Anchor TV to stand\n   • Use flexible connections for gas/water\n\n2. Home safety improvements:\n   • Reinforce foundation bolts\n   • Install seismic bracing for chimney\n   • Use door latches on cabinets\n   • Store heavy items low\n\n3. Emergency supplies:\n   • Water (1 gallon/person/day, 2 weeks)\n   • Non-perishable food\n   • First aid kit\n   • Sturdy shoes\n   • Flashlight\n   • Radio (battery/hand-crank)\n\n4. Practice Drop-Cover-Hold On drills\n5. Know safe spots in each room\n6. Have communication plan",
                "Earthquake-proofing your home:\n• Use earthquake straps for gas appliances\n• Install cabinet latches\n• Place bed away from windows\n• Secure mirrors and artwork\n• Use non-slip pads under electronics\n• Know how to shut off utilities\n• Install flexible water/gas connectors\n\n💡 Consult local building department for retrofitting options."
            ],
            during: [
                "🆘 DURING EARTHQUAKE:\n\n✋ DROP → COVER → HOLD ON\n\n1. DROP to hands and knees IMMEDIATELY\n2. COVER head/neck:\n   • Under sturdy desk/table, OR\n   • Against interior wall\n   • Hands over head/neck\n3. HOLD ON until shaking stops\n\n📍 INSIDE: Under table in doorway (not in doorframe)\n📍 OUTSIDE: Move away from buildings, power lines, trees\n📍 IN VEHICLE: Pull over, stay inside, avoid overpasses\n📍 IN BED: Roll out and get under bed frame\n\n⚠️ Do NOT run outside during shaking (debris falling)\n⏱️ Shaking typically lasts 10-60 seconds",
                "Stay calm during earthquake:\n• Shaking usually stops in seconds\n• Adrenaline helps you respond\n• Don't panic - most earthquakes cause no injury\n• Focus on protection position\n• Wait for shaking to completely stop\n• Then assess for hazards before moving\n\n📢 If with others: Help protect them first\n🐕 Keep pets calm by staying calm yourself"
            ],
            after: [
                "✅ After the earthquake stops:\n\n1. Check yourself for injuries\n2. Check others nearby\n3. Look for hazards:\n   • Gas smell (shut off at meter)\n   • Downed power lines (stay away)\n   • Broken glass\n   • Structural damage\n   • Fire/smoke\n\n4. If safe:\n   • Exit building slowly\n   • Use stairs (never elevators)\n   • Watch for falling objects\n   • Check surroundings carefully\n\n5. If trapped:\n   • Don't shout unless you hear rescuers\n   • Use whistle or tap on pipes\n   • Conserve energy\n   • Stay calm - rescue comes\n\n⚠️ Expect aftershocks - they can cause additional damage"
            ],
            safety: [
                "Common earthquake dangers:\n• Falling objects (books, pictures, dishes)\n• Broken glass and sharp debris\n• Downed power lines (electrocution)\n• Gas leaks (explosion risk)\n• Structural collapse\n• Fires from ruptured gas lines\n\nProtection priorities:\n1. Life safety (protect body)\n2. Eye safety (from flying debris)\n3. Head/neck protection\n4. Stay low to ground\n\n🚫 MYTHS:\n❌ Doorways are safest (actually not)\n❌ Run outside (dangerous - flying debris)\n❌ Elevators are safe (mechanical failure)"
            ]
        }
    },
    fire: {
        keywords: ['fire', 'wildfire', 'blaze', 'burn', 'flames', 'smoke', 'burning'],
        topics: ['prevention', 'escape', 'safety', 'evacuation'],
        responses: {
            prevention: [
                "🔥 Fire Prevention at Home:\n\n🚨 Smoke Detectors:\n• Install on every level and each bedroom\n• Test monthly\n• Replace batteries twice yearly\n• Replace units every 10 years\n\n🧯 Fire Extinguishers:\n• Keep in kitchen\n• Know how to use (PASS: Pull-Aim-Squeeze-Sweep)\n• Check pressure gauge monthly\n\n⚡ Electrical Safety:\n• Don't overload outlets\n• Use surge protectors\n• Replace frayed cords\n• Keep flammables away from outlets\n\n🕯️ Candle Safety:\n• Keep away from curtains/papers\n• Never leave burning unattended\n• Use holders, not bare flames\n\n🔌 Appliance Safety:\n• Unplug when not in use\n• Keep away from water\n• Don't use damaged appliances",
                "Wildfire preparation:\n• Clear 5-30 feet around home (defensible space)\n• Remove dead branches\n• Prune trees up 6-10 feet\n• Clear gutters of debris\n• Use fire-resistant plants\n• Seal gaps in roof\n• Use metal gutters\n• Clear dead leaves/needles\n\n🏡 Home hardening:\n• Use fire-resistant roofing\n• Install metal screening\n• Enclose deck/patio\n• Use tempered glass windows\n• Install exterior sprinklers\n\nCreate evacuation plan with family."
            ],
            escape: [
                "🚪 FIRE ESCAPE PLAN:\n\n1. Plan 2 escape routes from each room\n2. Identify meeting spot outside\n3. Practice escape once yearly\n\nIF THERE'S FIRE:\n✓ Alert others by shouting\n✓ Leave immediately - don't fight fire\n✓ Feel doors before opening:\n  • Hot = fire behind it\n  • Proceed to alternate route\n✓ Stay low below smoke\n✓ Don't stop for possessions\n✓ Help others if safe\n✓ Close doors behind you to slow fire\n✓ Meet at designated spot\n✓ Call 911 from outside\n\n⏱️ You have 2-3 minutes before escape becomes impossible",
                "If trapped by fire:\n\n🏠 In building:\n1. Close door to room\n2. Seal cracks with wet cloth\n3. Open window for air/signaling\n4. Stay low below smoke\n5. Signal for help (flashlight, wave)\n6. Don't jump unless last resort\n\nIf clothing catches fire:\n→ STOP, DROP, ROLL\n→ Don't run (spreads flames)\n→ Roll in blanket if available\n→ Cool water if available\n\n🧊 Burn treatment:\n• Cool with water for 10-20 minutes\n• Remove jewelry\n• Don't apply ice\n• Cover with clean cloth\n• Seek medical help\n• Don't pop blisters"
            ],
            evacuation: [
                "🚗 Wildfire Evacuation:\n\nWhen ordered to evacuate - LEAVE IMMEDIATELY:\n\n1. Turn on car lights\n2. Close all windows/doors\n3. Don't lock doors (rescuers need access)\n4. Take pre-packed evacuation kit\n5. Follow official routes\n6. Don't stop for photos/sightseeing\n7. Drive calmly without rushing\n8. Watch for firefighters\n\nEvacuation kit:\n• Important documents\n• Medications\n• Irreplaceable items (photos)\n• Pet carriers\n• Cash/credit cards\n• Phone charger\n• Comfortable shoes\n\nGo to designated shelter or relative's home.\nDon't return until authorities clear it."
            ],
            safety: [
                "🚨 Fire Safety Tips:\n\nSmoke inhalation danger:\n• Smoke kills more than flames\n• Fire produces toxic gases\n• Crawl below smoke to breathe cooler air\n• Carbon monoxide = silent killer\n\nFire behavior:\n• Fire spreads quickly (up to 8 mph)\n• Heat kills before flames reach you\n• Visibility very low in smoke\n• Panic is biggest danger\n\nStay calm:\n✓ Remember: Most people survive fires\n✓ Speed and calmness save lives\n✓ Have plan, reduce panic\n✓ Know exits before emergency\n\n🏥 Call 911 even for small fires\n💾 Keep important docs in fireproof safe"
            ]
        }
    },
    hurricane: {
        keywords: ['hurricane', 'typhoon', 'cyclone', 'storm', 'severe weather', 'tropical storm'],
        topics: ['preparation', 'during', 'after'],
        responses: {
            preparation: [
                "🌀 Hurricane Preparedness Checklist:\n\n📋 Before Season Starts:\n1. Trim trees & secure outdoor items\n2. Reinforce roof & doors\n3. Install storm shutters\n4. Know evacuation zone\n5. Stock supplies:\n   • Water (1 gal/person/day × 14 days)\n   • Food (non-perishable, 2 weeks)\n   • Battery-powered radio\n   • Flashlights & batteries\n   • First aid kit\n   • Medications (30-day supply)\n   • Important documents\n   • Cash & credit cards\n6. Create family communication plan",
                "Home hurricane-proofing:\n• Install metal storm shutters\n• Secure roof with clips\n• Use impact-resistant windows\n• Board windows with plywood\n• Secure AC unit\n• Clear gutters & drains\n• Trim branches 6 feet from roof\n• Secure propane grills\n• Install straps for water heater\n• Know water/gas shut-off locations\n\n🏠 Mobile home residents must evacuate"
            ],
            during: [
                "🏠 DURING HURRICANE:\n\n✓ Stay indoors in interior room:\n  • Lowest floor\n  • Away from windows\n  • Bathroom or hallway (small room = less wind)\n\n✗ DON'T:\n  • Go outside \"to check on things\"\n  • Resist urge to look at conditions\n  • Stand near windows\n  • Open windows to \"equalize pressure\"\n  • Venture onto roof for inspection\n\n✓ DO:\n  • Listen to weather updates\n  • Keep phone charged\n  • Have flashlight ready\n  • Help family members stay calm\n  • Stay hydrated\n\n⚠️ Eye of storm = brief calm\nDon't go out! Back side often worse",
                "If forced to evacuate:\n1. Leave early (before traffic\n2. Follow designated routes\n3. Use public transport if available\n4. Take evacuation kit\n5. Don't return early\n6. Fill gas tank first\n7. Leave note of destination\n\nIf trapped indoors:\n• Stay put - rescue will come\n• Use emergency supplies\n• Stay calm\n• Monitor local news\n• Signal for help if stranded outside"
            ],
            after: [
                "✅ After Hurricane:\n\n1. Check for injuries - provide first aid\n2. Exit building cautiously:\n   • Watch for downed lines\n   • Avoid debris\n   • Stay on streets\n   • Wear protective gear\n3. Document damage (photos/video for insurance)\n4. Use tap water only if okayed (boil if unsure)\n5. Avoid floodwaters\n6. Stay out of damaged buildings\n7. Watch for delayed hazards:\n   • Structural collapse\n   • Electrical hazards\n   • Gas leaks\n   • Contamination\n8. File insurance claim quickly\n\n📞 Contact utility companies about damage\n⛑️ Avoid cleanup alone - have helpers"
            ]
        }
    },
    firstaid: {
        keywords: ['first aid', 'injury', 'wound', 'bleeding', 'cpr', 'medical', 'health', 'fracture'],
        topics: ['cpr', 'bleeding', 'burns', 'choking'],
        responses: {
            cpr: [
                "❤️ CPR STEPS (For unresponsive person not breathing):\n\n1️⃣ CALL 911 immediately\n\n2️⃣ Place person on firm surface\n\n3️⃣ CHEST COMPRESSIONS (100-120/min):\n   • Place heel of hand on center of chest\n   • Place other hand on top\n   • Push hard and fast\n   • Go at least 2 inches deep\n   • Let chest rise between compressions\n\n4️⃣ RESCUE BREATHS (after 30 compressions):\n   • Tilt head, lift chin\n   • Pinch nose closed\n   • Create seal over mouth\n   • Blow for 2 seconds\n   • Watch chest rise\n\n5️⃣ REPEAT 30 compressions : 2 breaths until:\n   • Emergency arrives\n   • Person starts breathing\n   • You're too exhausted\n\n💡 If unsure about breathing, do CPR anyway!",
                "CPR for children/infants:\n\nChildren (1-8 years):\n• Same technique as adults\n• Use one hand for compressions\n• Push 1.5-2 inches\n• Gentle rescue breaths\n\nInfants (under 1 year):\n• Use 2 fingers for compressions\n• Push about 1.5 inches\n• Gentle breaths don't plug nose\n• Place fingers on sternum (below nipple line)\n\n🔊 If you don't know CPR, ask 911 for guidance\nThey can talk you through it!"
            ],
            bleeding: [
                "🩸 SEVERE BLEEDING Response:\n\n1. CALL 911 for severe bleeding\n\n2. APPLY DIRECT PRESSURE:\n   • Use clean cloth\n   • Press firmly on wound\n   • Don't peek at wound\n   • If soaks through, add cloth (don't remove first)\n   • Maintain pressure 10-15 minutes\n\n3. ELEVATE limb above heart (if safe)\n\n4. APPLY PRESSURE POINTS for major arteries:\n   • Inner arm (brachial artery)\n   • Inner leg (femoral artery)\n\n5. USE TOURNIQUET if:\n   • Massive bleeding\n   • Amputation\n   • Can't control with pressure\n   • Apply 2-3 inches above wound\n   • Write time applied on tourniquet\n\n6. Monitor for shock:\n   • Lay flat\n   • Elevate legs\n   • Keep warm\n   • Reassure patient"
            ],
            burns: [
                "🔥 BURN TREATMENT:\n\n1st Degree (superficial, red):\n• Cool with water 10-20 min\n• Apply aloe vera\n• Take pain reliever\n• Use sunscreen when healed\n\n2nd Degree (blistering, red/blotchy):\n• Cool with water 15-20 min\n• Remove jewelry\n• Don't pop blisters!\n• Cover with sterile gauze\n• Use antibiotic ointment\n• Pain relief medication\n• See doctor if large\n\n3rd Degree (charred, white/brown, painless):\n• CALL 911 - DON'T DELAY\n• Don't remove stuck clothing\n• Cover with clean, dry cloth\n• Don't apply ice directly\n• Elevate above heart if possible\n• Give small sips water if conscious\n• Monitor for shock\n\n🧊 DON'T use ice/ointment/butter\n📞 Seek medical attention for facial/joint burns"
            ],
            choking: [
                "😷 CHOKING Response (adult):\n\n1. Encourage to cough if possible\n\n2. If can't cough/speak/breathe:\n   → USE HEIMLICH MANEUVER\n\n3. Stand behind person\n\n4. Place fist slightly above navel\n\n5. Grasp fist with other hand\n\n6. Quick, upward thrusts toward ribs\n\n7. Repeat until object dislodges\n\n8. If becomes unconscious:\n   → Start CPR\n   → Object may dislodge\n\nFor INFANT (choking without cough):\n• Support head\n• Give 5 back blows\n• Turn over\n• Give 5 chest thrusts\n• Repeat until object out\n\n🚨 CALL 911 for severe choking"
            ]
        }
    },
    evacuation: {
        keywords: ['evacuation', 'evacuate', 'escape', 'leave', 'exit', 'route'],
        topics: ['planning', 'procedures', 'supplies'],
        responses: {
            planning: [
                "🗺️ CREATE EVACUATION PLAN:\n\n1. IDENTIFY HAZARDS:\n   • What disasters affect your area?\n   • Flash floods, earthquakes, wildfires?\n   • Hazmat facilities nearby?\n\n2. KNOW YOUR ZONE:\n   • Find evacuation zone for your address\n   • Contact local emergency management\n   • Check county/city website\n\n3. MAP ROUTES:\n   • Know 2-3 evacuation routes\n   • Avoid major highways\n   • Practice driving routes\n   • Know Northern/Western routes\n\n4. ESTABLISH COMMUNICATION:\n   • Out-of-state contact (easier to reach)\n   • Share number with all family\n   • Have list written down\n   • Practice communication plan",
                "Family evacuation meeting point:\n• Pick location outside immediate area\n• Easy to find\n• Safe from disasters\n• Familiar to all\n• Write down address\n• Keep in wallet\n\nSpecial needs planning:\n• Elderly/disabled require transport\n• Arrange help in advance\n• Have backup plan\n• Medical equipment? Take it\n• Service animals? Know shelter policies\n• Medications? 30-day supply minimum\n\n🐕 Pet planning:\n• Carriers for each pet\n• Leashes/ID tags\n• Food & medications\n• Recent photos\n• Know pet-friendly shelters"
            ],
            procedures: [
                "🚗 EVACUATION PROCEDURES:\n\nWhen ordered to evacuate:\n✓ LEAVE IMMEDIATELY (delay = danger)\n✓ Don't wait for explicit order\n✓ Don't try to lock home\n✓ Turn on car lights\n✓ Close windows/doors\n✓ Take evacuation kit only\n✓ Don't stop for sightseeing\n✓ Stay aware of surroundings\n✓ Keep phone charged\n✓ Follow marked routes\n\nIf traffic jam:\n• Stay in vehicle\n• Keep gas tank 1/2 full\n• Listen to radio updates\n• Don't panic\n• Help others if safe\n\nIf traffic stops:\n• Turn off engine to save fuel\n• Stay calm\n• Monitor updates\n• Don't abandon vehicle"
            ],
            supplies: [
                "🎒 EVACUATION KIT ESSENTIALS:\n\n📄 Documents:\n• IDs, passports\n• Insurance policies (photos of backup)\n• Deeds/titles\n• Medical records\n• Financial account info\n• USB with digital copies\n\n💊 Health:\n• Prescription medications (30+ days)\n• Over-the-counter meds\n• Glasses/contacts\n• Hearing aids\n• Medical alert bracelet\n\n💰 Valuables:\n• Cash & credit cards\n• Jewelry\n• Heirlooms\n• Irreplaceable photos\n\n🧳 Necessities:\n• Change of clothes\n• Comfortable shoes\n• Phone chargers\n• Important contacts list\n\n🐕 If pets:\n• Carriers\n• Leashes\n• Food & water\n• Medications\n• Recent photo\n\n📦 Keep in bag, ready to grab"
            ]
        }
    },
    supplies: {
        keywords: ['supply', 'kit', 'prepare', 'stock', 'emergency kit', 'supplies', 'stockpile'],
        topics: ['basic', 'extended', 'special'],
        responses: {
            basic: [
                "📦 BASIC EMERGENCY KIT (72 hours):\n\n💧 WATER:\n• 1 gallon per person per day\n• Minimum 3-day supply\n• Bottled water or stored containers\n• Replace every 6 months\n• 2 weeks recommended for families\n\n🍖 FOOD (non-perishable):\n• Ready-to-eat (no cooking needed)\n• Canned goods with pull-tabs\n• Granola bars, nuts, dried fruits\n• Peanut butter, crackers\n• Pasta, rice (if stove works)\n• High calorie foods\n• Baby food/formula if needed\n\n💡 LIGHT & POWER:\n• Flashlight (LED)\n• Extra batteries (multiple types)\n• Glow sticks\n• Hand-crank flashlight\n• Phone chargers (battery + car)\n\n🩹 FIRST AID:\n• Bandages, gauze, tape\n• Antiseptic wipes\n• Pain relievers\n• Stomach medication\n• Prescription medications\n• EpiPens (if needed)",
                "🚨 COMMUNICATION & SAFETY:\n• Phone chargers\n• Whistle (signaling)\n• Important contacts list\n• Cash & cards\n• ID documents\n• Sturdy shoes\n• Gloves, N95 masks\n• Tools (knife, can opener)\n\n📻 INFORMATION:\n• Battery/hand-crank radio\n• NOAA Weather Radio\n• Local emergency alerts\n\n📋 DOCUMENTATION:\n• Insurance policies copy\n• Medical records\n• Property photos\n• Important numbers\n• Emergency plan copy\n\n❓ KEEP KIT:\n• Accessible but out of way\n• Cool, dry location\n• Check twice yearly\n• Update for seasonal needs"
            ],
            extended: [
                "📦 EXTENDED KIT (2 weeks+):\n\nIncrease quantities:\n• Water: 2 gallons/person/day\n• Food: 2 weeks non-perishable\n• Medications: 30-day supply\n• Diapers/formula (if needed)\n\nADD sanitation items:\n• Moist wipes/baby wipes\n• Feminine hygiene products\n• Personal hygiene items\n• Hand sanitizer\n• Toilet paper, plastic bags\n• Trash bags\n• Soap\n• Toothbrush, toothpaste\n\nADD comfort items:\n• Blankets/sleeping bags\n• Change of clothes\n• Books/games for children\n• Pet food & supplies\n• Comfort foods\n\nADD outdoor tools:\n• Shovel\n• Rope\n• Duct tape\n• Work gloves\n• Crowbar\n• Plastic sheeting\n\n❄️ For winter add:\n• Blankets, warm clothing\n• Frostbite cream\n• Hand warmers\n• Ice melt\n\n☀️ For summer add:\n• Sunscreen\n• Insect repellent\n• Heat illness treatment"
            ]
        }
    }
};

/**
 * Advanced AI response generation with context awareness and follow-ups
 */
function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    const username = sessionStorage.getItem('username') || 'friend';
    let bestMatch = null;
    let highestScore = 0;
    let topicMatch = 'default';
    
    // Analyze message for intent and context
    for (const [category, data] of Object.entries(aiKnowledgeBase)) {
        if (category !== 'supplies') {
            const keywords = data.keywords;
            
            // Calculate match score
            let score = 0;
            keywords.forEach(keyword => {
                if (message.includes(keyword)) {
                    score += 10;
                }
            });
            
            // Bonus for exact phrase matches
            if (message.includes(category)) {
                score += 20;
            }
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = data;
                topicMatch = category;
            }
        }
    }
    
    // If no category match, provide general response
    if (highestScore === 0) {
        return generateDefaultResponse(userMessage);
    }
    
    // Determine specific topic within category
    let topic = 'default';
    if (bestMatch.topics) {
        for (const t of bestMatch.topics) {
            if (message.includes(t) || message.includes(t.replace('_', ' '))) {
                topic = t;
                break;
            }
        }
    }
    
    // Get response from knowledge base
    let responses = [];
    if (topic !== 'default' && bestMatch.responses && bestMatch.responses[topic]) {
        responses = bestMatch.responses[topic];
    } else if (bestMatch.responses) {
        // Get first available responses
        for (const [key, value] of Object.entries(bestMatch.responses)) {
            responses = value;
            break;
        }
    }
    
    // Select random response from category
    if (responses.length > 0) {
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Store in conversation history for context awareness
        conversationHistory.push({
            user: userMessage,
            category: topicMatch,
            topic: topic,
            response: response,
            timestamp: new Date()
        });
        
        // Add natural follow-up to make conversation feel more engaging
        const followUps = [
            `\n\n💡 Would you like to know more about any specific step, ${username}?`,
            `\n\n📋 Do you have any other questions about this? I'm here to help!`,
            `\n\n🔍 Is there a particular aspect you'd like me to go deeper into?`,
            `\n\n👍 Hope this helps! Want to explore related topics?`,
            `\n\n🤔 Does this answer your question? Feel free to ask more!`
        ];
        
        // Randomly add follow-up to 60% of responses (make conversation natural)
        if (Math.random() > 0.4) {
            return response + followUps[Math.floor(Math.random() * followUps.length)];
        }
        
        return response;
    }
    
    return generateDefaultResponse(userMessage);
}

/**
 * Generate contextual default response with natural conversation style
 */
function generateDefaultResponse(userMessage) {
    const username = sessionStorage.getItem('username') || 'friend';
    
    const defaultResponses = [
        `That's a great question, ${username}! "${userMessage}" - I appreciate your curiosity.\n\nWhile I specialize in emergency management, I'd love to help! I provide in-depth guidance on:\n\n🌊 Flood safety - from preparation to recovery\n🏣 Earthquake readiness - what to do before, during, and after\n🔥 Fire prevention and escape strategies\n🌀 Hurricane and storm preparation\n🩹 First aid techniques and medical emergencies\n🚪 Evacuation planning and procedures\n🎒 Building your emergency kit\n\nWould you like to explore any of these topics? I'm here to help you stay safe! 💪`,
        
        `I love your question about "${userMessage}"! That shows you're thinking about safety, which is fantastic.\n\nWhile that specific topic isn't my specialty, I'm really well-equipped to help with:\n• Preparing for floods and water emergencies\n• Staying safe during earthquakes\n• Fire prevention and escape plans\n• Hurricane and storm readiness\n• First aid and emergency response\n• Family evacuation plans\n• Emergency supplies and kits\n\nIs there an emergency preparedness topic I can help you with? I promise detailed, practical advice! 😊`,
        
        `${username}, great question about "${userMessage}"! I really appreciate someone who's proactively thinking about safety.\n\nWhile that's outside my main expertise, I specialize in real, actionable emergency management guidance:\n\n✓ How to prepare for natural disasters\n✓ What to do when emergencies happen\n✓ Building family emergency plans\n✓ Creating survival supply kits\n✓ First aid and medical emergencies\n✓ Safe evacuation procedures\n\nPick any area above, and I'll give you detailed, life-saving information! Which interests you most? 🤔`,
        
        `That's interesting, ${username}! I hear what you're asking about "${userMessage}".\n\nHonestly, my strongest skills are in emergency preparedness - and I can tell you TONS about:\n📚 Flood management strategies\n📚 Earthquake safety protocols\n📚 Fire prevention and response\n📚 Hurricane readiness\n📚 First aid techniques\n📚 Emergency evacuation\n📚 Disaster recovery\n\nLet me guide you through one of these areas with expert, practical advice - what do you say? 🤝`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/**
 * Send message in chat with AI thinking
 */
function sendMessage(message = null) {
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const quickSuggestions = document.getElementById('quickSuggestions');
    
    // Get message from input or parameter
    const userMessage = message || messageInput.value.trim();
    
    if (!userMessage) return;
    
    // Hide quick suggestions after first message
    if (quickSuggestions && quickSuggestions.style.display !== 'none') {
        quickSuggestions.style.display = 'none';
    }
    
    // Add user message to chat
    const userMessageEl = document.createElement('div');
    userMessageEl.className = 'chat-message user-message';
    userMessageEl.style.animation = 'slideUpIn 0.3s ease-out';
    userMessageEl.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(userMessage)}</p>
        </div>
        <span class="message-time">Just now</span>
    `;
    chatMessages.appendChild(userMessageEl);
    
    // Clear input
    messageInput.value = '';
    
    // Show AI thinking indicator
    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'chat-message ai-message thinking-state';
    thinkingEl.id = 'thinkingIndicator';
    thinkingEl.innerHTML = `
        <div class="message-content thinking-content">
            <div class="thinking-icon">🤔</div>
            <div class="thinking-text">
                <p style="margin: 0; font-size: 0.85rem; color: #6B7785;">Thinking and processing...</p>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(thinkingEl);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate AI thinking delay (1-3 seconds)
    setTimeout(() => {
        // Remove thinking indicator
        const thinking = document.getElementById('thinkingIndicator');
        if (thinking) thinking.remove();
        
        // Get AI response
        const aiResponse = generateAIResponse(userMessage);
        
        // Add AI message to chat
        const aiMessageEl = document.createElement('div');
        aiMessageEl.className = 'chat-message ai-message';
        aiMessageEl.style.animation = 'slideUpIn 0.3s ease-out';
        aiMessageEl.innerHTML = `
            <div class="message-content">
                <p>${escapeHtml(aiResponse).replace(/\n/g, '<br>')}</p>
            </div>
            <span class="message-time">Just now</span>
        `;
        chatMessages.appendChild(aiMessageEl);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 800 + Math.random() * 1500);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Initialize AI Assistant with personalized greeting
 */
function initializeAIAssistant() {
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const username = sessionStorage.getItem('username') || 'there';
    
    if (messageInput) {
        // Send message on Enter key
        messageInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Focus on input when entering AI section
        setTimeout(() => messageInput.focus(), 500);
    }
    
    // Check if this is first time opening AI Assistant
    if (chatMessages && chatMessages.children.length === 1) {
        // Only the default greeting exists, this is first load
        showPersonalizedGreeting(chatMessages, username);
    }
}

/**
 * Show personalized greeting when user opens AI section
 */
function showPersonalizedGreeting(chatMessages, username) {
    // Find and replace the default greeting message
    const existingGreeting = chatMessages.querySelector('.ai-message');
    
    if (existingGreeting) {
        const greeting = `Hi ${username}! 👋 I'm your AI Emergency Assistant, and I'm here to help you stay safe and prepared for any emergency.

I can assist you with:
• 🌊 Flood preparedness and safety tips
• 🏚️ Earthquake readiness and response
• 🔥 Fire prevention and escape plans
• 🌀 Hurricane and storm preparation
• 🩹 First aid and medical guidance
• 🚪 Evacuation procedures
• 🎒 Emergency supply checklists
• 📍 Disaster management strategies

Just ask me anything about emergency management, or click one of the quick suggestions below to get started!

What can I help you with today?`;
        
        existingGreeting.innerHTML = `
            <div class="message-content">
                <p>${greeting.split('\n').join('<br>')}</p>
            </div>
            <span class="message-time">Just now</span>
        `;
    }
}

// Community Features section moved to community.js
// Emergency Resources section moved to emergency-resources.js

// ========================================
// My Reports Management
// ========================================

/**
 * Initialize My Reports section - set up search and filter listeners
 */
function initializeMyReports() {
    const searchInput = document.getElementById('searchMyReports');
    const statusFilter = document.getElementById('filterMyReportsStatus');

    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            filterAndDisplayUserReports(searchTerm, statusFilter ? statusFilter.value : 'all');
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', function (e) {
            const status = e.target.value;
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            filterAndDisplayUserReports(searchTerm, status);
        });
    }

    // Load reports on first initialization
    loadAndDisplayUserReports();
}

/**
 * Add a case to the user's reported cases in localStorage
 */
function addToUserReports(caseObj) {
    try {
        const username = sessionStorage.getItem('username') || 'Anonymous';
        
        // Get existing reports
        let userReports = [];
        const stored = localStorage.getItem(USER_REPORTS_STORAGE_KEY);
        if (stored) {
            userReports = JSON.parse(stored);
        }

        // Add the new case with user tracking
        const reportedCase = {
            ...caseObj,
            reportedBy: username,
            reportedAt: new Date().toISOString()
        };

        userReports.push(reportedCase);

        // Save back to localStorage
        localStorage.setItem(USER_REPORTS_STORAGE_KEY, JSON.stringify(userReports));

        console.log(`Case ${caseObj.caseId || caseObj.id} added to ${username}'s reports`);
    } catch (error) {
        console.error('Error adding case to user reports:', error);
    }
}

/**
 * Add case to public community incidents feed
 */
function addToPublicIncidents(caseData) {
    try {
        let publicIncidents = [];
        const stored = localStorage.getItem(PUBLIC_INCIDENTS_STORAGE_KEY);
        if (stored) {
            publicIncidents = JSON.parse(stored);
        }

        const mediaImages = [];
        if (caseData.mediaProof?.previewUrl) {
            mediaImages.push({
                url: caseData.mediaProof.previewUrl,
                timestamp: caseData.mediaProof.uploadedAt
                    ? new Date(caseData.mediaProof.uploadedAt).toLocaleString()
                    : new Date().toLocaleString()
            });
        }
        
        // Convert case to community incident format
        const communityIncident = {
            id: caseData.id || caseData.caseId,
            type: caseData.type,
            location: caseData.location,
            description: caseData.description,
            user: caseData.reportedBy || sessionStorage.getItem('username') || 'Anonymous',
            timestamp: new Date(caseData.reportedAt || new Date()).toLocaleString(),
            severity: caseData.severity,
            verified: 0,
            unverified: 0,
            images: mediaImages,
            mediaProof: caseData.mediaProof || null,
            comments: [],
            isUserReport: true  // Mark as user-reported case
        };
        
        // Add to beginning of public incidents
        publicIncidents.unshift(communityIncident);
        
        // Keep last 100 incidents
        if (publicIncidents.length > 100) {
            publicIncidents = publicIncidents.slice(0, 100);
        }
        
        localStorage.setItem(PUBLIC_INCIDENTS_STORAGE_KEY, JSON.stringify(publicIncidents));
    } catch (error) {
        console.error('Error adding case to public incidents:', error);
    }
}

/**
 * Load and display user's reported cases in My Reports section
 */
function loadAndDisplayUserReports(filterTerm = '', filterStatus = 'all') {
    try {
        const username = sessionStorage.getItem('username') || 'Anonymous';
        const reportsList = document.getElementById('myReportsList');
        const emptyState = document.getElementById('myReportsListEmpty');
        const totalReportsEl = document.getElementById('myTotalReports');
        const activeReportsEl = document.getElementById('myActiveReports');
        const resolvedReportsEl = document.getElementById('myResolvedReports');

        if (!reportsList || !emptyState) {
            console.warn('My Reports section elements not found');
            return;
        }

        // Get user's reports from localStorage
        let userReprts = [];
        const stored = localStorage.getItem(USER_REPORTS_STORAGE_KEY);
        if (stored) {
            userReprts = JSON.parse(stored);
        }

        // Filter by current user
        let userCases = userReprts.filter(c => c.reportedBy === username);

        // Apply search filter
        if (filterTerm) {
            userCases = userCases.filter(c =>
                (c.id && c.id.toLowerCase().includes(filterTerm)) ||
                (c.caseId && c.caseId.toLowerCase().includes(filterTerm)) ||
                (c.type && c.type.toLowerCase().includes(filterTerm)) ||
                (c.location && c.location.toLowerCase().includes(filterTerm)) ||
                (c.description && c.description.toLowerCase().includes(filterTerm))
            );
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            userCases = userCases.filter(c => c.status === filterStatus || c.severity === filterStatus);
        }

        // Sort by reported date (newest first)
        userCases.sort((a, b) => {
            const dateA = new Date(a.reportedAt || 0);
            const dateB = new Date(b.reportedAt || 0);
            return dateB - dateA;
        });

        // Update statistics
        const allUserCases = userReprts.filter(c => c.reportedBy === username);
        const activeCases = allUserCases.filter(c => c.status === 'active').length;
        const resolvedCases = allUserCases.filter(c => c.status === 'resolved').length;

        if (totalReportsEl) totalReportsEl.textContent = allUserCases.length;
        if (activeReportsEl) activeReportsEl.textContent = activeCases;
        if (resolvedReportsEl) resolvedReportsEl.textContent = resolvedCases;

        // Clear the list
        reportsList.innerHTML = '';

        if (userCases.length === 0) {
            emptyState.style.display = 'flex';
            reportsList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            reportsList.style.display = 'grid';

            userCases.forEach((caseItem, index) => {
                const card = document.createElement('div');
                card.className = 'my-report-card';
                card.style.animation = `slideUpIn 0.4s ease-out ${index * 0.05}s both`;

                const severityColor = {
                    'critical': '#EF233C',
                    'medium': '#FFB703',
                    'low': '#06D6A0'
                }[caseItem.severity] || '#6B7785';

                const statusColor = caseItem.status === 'resolved' ? '#06D6A0' : '#3A86FF';
                const statusText = caseItem.status === 'resolved' ? '✅ Resolved' : '⏳ Active';

                const reportedAtDate = new Date(caseItem.reportedAt);
                const timeAgo = formatTimeAgo(reportedAtDate);

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 700; color: #0F1419; font-size: 15px; margin-bottom: 4px;">
                                ${caseItem.type || 'Unknown'}
                            </div>
                            <div style="font-size: 12px; color: #6B7785;">
                                ${caseItem.caseId || caseItem.id}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="
                                display: inline-block;
                                padding: 4px 12px;
                                background: ${severityColor}20;
                                color: ${severityColor};
                                border-radius: 6px;
                                font-size: 11px;
                                font-weight: 700;
                                text-transform: uppercase;
                                margin-bottom: 4px;
                            ">${caseItem.severity}</span>
                            <div style="font-size: 12px; color: ${statusColor}; font-weight: 600;">
                                ${statusText}
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 13px; color: #3A4556; line-height: 1.5;">
                            ${caseItem.description || caseItem.location}
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div style="padding: 8px; background: #f0f3f7; border-radius: 6px; font-size: 12px;">
                            <div style="color: #6B7785; margin-bottom: 2px;">📍 Location</div>
                            <div style="color: #0F1419; font-weight: 600;">${caseItem.location || 'Unknown'}</div>
                        </div>
                        <div style="padding: 8px; background: #f0f3f7; border-radius: 6px; font-size: 12px;">
                            <div style="color: #6B7785; margin-bottom: 2px;">🕐 Reported</div>
                            <div style="color: #0F1419; font-weight: 600;">${timeAgo}</div>
                        </div>
                    </div>

                    <div style="padding-top: 12px; border-top: 1px solid #e0e0e0; display: flex; gap: 8px;">
                        <button class="btn-action" onclick="viewCase('${caseItem.id || caseItem.caseId}')" style="flex: 1; padding: 8px 12px; border: none; background: #457B9D; color: white; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;">
                            👁️ View Details
                        </button>
                        <button onclick="deleteUserReport('${caseItem.caseId || caseItem.id}')" style="padding: 8px 12px; border: 1px solid #e0e0e0; background: white; color: #E63946; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;">
                            🗑️ Delete
                        </button>
                    </div>
                `;

                reportsList.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading user reports:', error);
    }
}

/**
 * Filter and display user reports based on search term and status
 */
function filterAndDisplayUserReports(searchTerm = '', statusFilter = 'all') {
    loadAndDisplayUserReports(searchTerm, statusFilter);
}

/**
 * Delete a user-reported case
 */
function deleteUserReport(caseId) {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
        const username = sessionStorage.getItem('username') || 'Anonymous';
        
        // Get existing reports
        let userReports = [];
        const stored = localStorage.getItem(USER_REPORTS_STORAGE_KEY);
        if (stored) {
            userReports = JSON.parse(stored);
        }

        // Filter out the deleted case
        userReports = userReports.filter(c => 
            (c.reportedBy === username) && 
            (c.id !== caseId && c.caseId !== caseId) ||
            (c.reportedBy !== username)
        );

        // Save back to localStorage
        localStorage.setItem(USER_REPORTS_STORAGE_KEY, JSON.stringify(userReports));

        // Reload the display
        loadAndDisplayUserReports();
        
        // Refresh map with updated reported cases
        refreshMapWithReportedCases();

        alert('✅ Report deleted successfully');
    } catch (error) {
        console.error('Error deleting report:', error);
        alert('❌ Failed to delete report');
    }
}

/**
 * Format time difference for display (e.g., "2 hours ago")
 */
function formatTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [key, value] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / value);
        if (interval >= 1) {
            return `${interval} ${key}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'Just now';
}

// ========================================
// Utility Functions
// ========================================

// Add CSS for marker pulse animation and table row animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.8;
        }
    }

    @keyframes slideUpIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes highlightRow {
        0% {
            background-color: rgba(230, 57, 70, 0.1);
        }
        100% {
            background-color: transparent;
        }
    }

    tr {
        transition: all 0.3s ease;
    }

    tr:hover {
        background-color: rgba(230, 57, 70, 0.02);
    }
`;
document.head.appendChild(style);
