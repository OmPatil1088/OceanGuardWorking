// ========================================
// Emergency Resources
// ========================================

// Sample nearby services data
const nearbyServices = [
    {
        id: 'S-001',
        type: 'hospitals',
        name: 'Central City Hospital',
        address: '123 Medical Avenue, Downtown',
        distance: 0.8,
        phone: '+91-9876-543210',
        emergencyServices: true,
        coordinates: { lat: 28.7041, lng: 77.1025 }
    },
    {
        id: 'S-002',
        type: 'police',
        name: 'Downtown Police Station',
        address: '456 Law Street, Central District',
        distance: 1.2,
        phone: '+91-9876-543211',
        emergencyServices: true,
        coordinates: { lat: 28.7050, lng: 77.1090 }
    },
    {
        id: 'S-003',
        type: 'fire',
        name: 'Central Fire Station',
        address: '789 Fire Lane, North District',
        distance: 1.5,
        phone: '+91-9876-543212',
        emergencyServices: true,
        coordinates: { lat: 28.7150, lng: 77.1100 }
    },
    {
        id: 'S-004',
        type: 'hospitals',
        name: 'St. Mary Medical Center',
        address: '321 Health Road, East Side',
        distance: 2.1,
        phone: '+91-9876-543213',
        emergencyServices: true,
        coordinates: { lat: 28.5921, lng: 77.2064 }
    },
    {
        id: 'S-005',
        type: 'ngos',
        name: 'Red Cross Relief Center',
        address: '654 Charity Road, West End',
        distance: 2.3,
        phone: '+91-9876-543214',
        emergencyServices: true,
        coordinates: { lat: 28.5494, lng: 77.0947 }
    },
    {
        id: 'S-006',
        type: 'shelters',
        name: 'Community Shelter 1',
        address: '987 Haven Street, South District',
        distance: 2.8,
        phone: '+91-9876-543215',
        emergencyServices: true,
        coordinates: { lat: 28.5355, lng: 77.0949 }
    },
    {
        id: 'S-007',
        type: 'police',
        name: 'East Division Police',
        address: '111 Order Lane, East District',
        distance: 3.2,
        phone: '+91-9876-543216',
        emergencyServices: true,
        coordinates: { lat: 28.5730, lng: 77.2100 }
    },
    {
        id: 'S-008',
        type: 'fire',
        name: 'East Fire Brigade',
        address: '222 Blaze Avenue, East Zone',
        distance: 3.5,
        phone: '+91-9876-543217',
        emergencyServices: true,
        coordinates: { lat: 28.5800, lng: 77.2150 }
    }
];

// Preparedness Guides
const preparednessGuides = [
    {
        id: 'G-001',
        title: '💧 Flood Safety Checklist',
        bullets: [
            'Move to higher ground immediately',
            'Don\'t walk/drive through flooded areas',
            'Turn off utilities to prevent hazards',
            'Store valuables and important documents safely',
            'Keep emergency kit ready',
            'Stay informed via emergency alerts',
            'Help neighbors and elderly persons'
        ]
    },
    {
        id: 'G-002',
        title: '🌍 Earthquake Safety Steps',
        bullets: [
            'DROP, COVER, HOLD ON during shaking',
            'Stay away from windows and heavy objects',
            'If outdoors, move to open ground',
            'If in vehicle, pull over and stay inside',
            'After quake, check for injuries and damage',
            'Use stairs, not elevators',
            'Expect aftershocks'
        ]
    },
    {
        id: 'G-003',
        title: '⛈️ Cyclone Preparation',
        bullets: [
            'Secure loose objects outdoors',
            'Trim tree branches near buildings',
            'Stock food, water, and medicines',
            'Charge all electronic devices',
            'Board up windows if necessary',
            'Move away from glass windows',
            'Listen to weather updates constantly',
            'Know your evacuation route'
        ]
    },
    {
        id: 'G-004',
        title: '🔥 Fire Safety Guide',
        bullets: [
            'Have fire extinguisher in kitchen',
            'Know location of fire exits',
            'Practice evacuation routes',
            'Don\'t panic - exit calmly and quickly',
            'Keep low to avoid smoke',
            'Close doors behind you',
            'Go to designated assembly point',
            'Call 101 when safe'
        ]
    }
];

// Emergency Kit Items
const emergencyKitItems = [
    { id: 'K-001', name: 'Water', icon: '💧', essentialDays: 3 },
    { id: 'K-002', name: 'Torch', icon: '🔦', essentialDays: 1 },
    { id: 'K-003', name: 'Power Bank', icon: '🔋', essentialDays: 2 },
    { id: 'K-004', name: 'Medicines', icon: '💊', essentialDays: 7 },
    { id: 'K-005', name: 'First Aid Kit', icon: '🩹', essentialDays: 1 },
    { id: 'K-006', name: 'Food & Snacks', icon: '🏜️', essentialDays: 3 },
    { id: 'K-007', name: 'ID Documents', icon: '📄', essentialDays: 1 },
    { id: 'K-008', name: 'Cash', icon: '💵', essentialDays: 1 },
    { id: 'K-009', name: 'Phone Charger', icon: '🔌', essentialDays: 1 },
    { id: 'K-010', name: 'Blanket', icon: '🛏️', essentialDays: 1 },
    { id: 'K-011', name: 'Rope', icon: '🪢', essentialDays: 1 },
    { id: 'K-012', name: 'Mask & Gloves', icon: '🧤', essentialDays: 1 }
];

let userLocation = null;
let kitChecklist = {};
let currentServiceFilter = 'all';

function initializeEmergencyResources() {
    renderGuides();
    renderKitChecklist();
    initializeServiceFilters();
    initializeKitActions();
    detectUserLocation();
}

// A) Nearby Services
function detectUserLocation() {
    const locationStatus = document.getElementById('locationStatus');
    const refreshBtn = document.getElementById('refreshLocationBtn');

    if (navigator.geolocation) {
        refreshBtn.addEventListener('click', () => {
            detectUserLocation();
        });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                locationStatus.classList.add('active');
                locationStatus.innerHTML = `<p style="color: var(--success);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 0.5rem;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>Location detected</p>`;
                renderServices(nearbyServices);
            },
            (error) => {
                locationStatus.innerHTML = `<p style="color: var(--warning);">📍 Enable location access for nearby services</p>`;
                renderServices(nearbyServices);
            }
        );
    } else {
        renderServices(nearbyServices);
    }
}

function renderServices(services) {
    const servicesList = document.getElementById('servicesList');
    servicesList.innerHTML = '';

    const filtered = currentServiceFilter === 'all'
        ? services
        : services.filter(s => s.type === currentServiceFilter);

    filtered.forEach(service => {
        const card = createServiceCard(service);
        servicesList.appendChild(card);
    });
}

function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';

    const typeEmoji = {
        'hospitals': '🏥',
        'police': '🚨',
        'fire': '🚒',
        'ngos': '❤️',
        'shelters': '🏠'
    };

    card.innerHTML = `
        <div class="service-header">
            <div class="service-type">
                ${typeEmoji[service.type]}
                ${service.type.charAt(0).toUpperCase() + service.type.slice(1)}
            </div>
        </div>
        <div class="service-name">${service.name}</div>
        <div class="service-address">📍 ${service.address}</div>
        <div style="margin: var(--space-sm) 0;">
            <span class="service-distance">📏 ${service.distance} km away</span>
        </div>
        <div class="service-meta">
            <span>📞 ${service.phone}</span>
            <span>${service.emergencyServices ? '🚨 24/7' : '⏰ Regular'}</span>
        </div>
        <button class="service-action" onclick="openServiceOnMap(${service.coordinates.lat}, ${service.coordinates.lng}, '${service.name}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
            </svg>
            Open in Maps
        </button>
    `;

    return card;
}

function initializeServiceFilters() {
    const filterBtns = document.querySelectorAll('.service-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentServiceFilter = this.dataset.filter;
            renderServices(nearbyServices);
        });
    });
}

function openServiceOnMap(lat, lng, name) {
    // Opens Google Maps with the service location
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},15z`;
    window.open(mapsUrl, '_blank');
}

// C) Preparedness Guides
function renderGuides() {
    const guidesContainer = document.getElementById('guidesContainer');
    guidesContainer.innerHTML = '';

    preparednessGuides.forEach(guide => {
        const card = createGuideCard(guide);
        guidesContainer.appendChild(card);
    });

    // Add click handlers for expansion
    document.querySelectorAll('.guide-card').forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });
}

function createGuideCard(guide) {
    const card = document.createElement('div');
    card.className = 'guide-card';

    const bulletsList = guide.bullets.map(bullet => `<li>${bullet}</li>`).join('');

    card.innerHTML = `
        <div class="guide-header">
            <span class="guide-title">${guide.title}</span>
            <span class="guide-toggle">▼</span>
        </div>
        <div class="guide-content">
            <ul class="guide-bullets">
                ${bulletsList}
            </ul>
        </div>
    `;

    return card;
}

// D) Emergency Kit Checklist
function renderKitChecklist() {
    const kitChecklist = document.getElementById('kitChecklist');
    kitChecklist.innerHTML = '';

    emergencyKitItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'kit-item';
        if (localStorage.getItem(`kit-${item.id}`)) {
            itemDiv.classList.add('checked');
        }

        itemDiv.innerHTML = `
            <div class="kit-icon">${item.icon}</div>
            <div class="kit-label">${item.name}</div>
            <div class="kit-checkbox">✓</div>
        `;

        itemDiv.addEventListener('click', () => {
            toggleKitItem(item.id, itemDiv);
        });

        kitChecklist.appendChild(itemDiv);
    });

    updateKitProgress();
}

function toggleKitItem(itemId, element) {
    if (element.classList.contains('checked')) {
        element.classList.remove('checked');
        localStorage.removeItem(`kit-${itemId}`);
    } else {
        element.classList.add('checked');
        localStorage.setItem(`kit-${itemId}`, 'true');
    }
    updateKitProgress();
}

function updateKitProgress() {
    const total = emergencyKitItems.length;
    const checked = Object.keys(localStorage)
        .filter(key => key.startsWith('kit-'))
        .length;

    const percentage = Math.round((checked / total) * 100);

    document.getElementById('kitPercentage').textContent = percentage + '%';
    document.getElementById('kitProgressBar').style.width = percentage + '%';
}

function initializeKitActions() {
    const downloadBtn = document.getElementById('downloadPdfBtn');
    const resetBtn = document.getElementById('resetKitBtn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadKitPdf);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetKitChecklist);
    }
}

function downloadKitPdf() {
    // Create PDF content
    const pdfContent = `
EMERGENCY PREPAREDNESS KIT CHECKLIST
${new Date().toLocaleDateString()}

Essential Items to Keep Ready:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${emergencyKitItems.map(item => {
        const isChecked = localStorage.getItem(`kit-${item.id}`) ? '✓' : '☐';
        return `${isChecked} ${item.icon} ${item.name} (${item.essentialDays} day supply)`;
    }).join('\n')}

EMERGENCY CONTACT NUMBERS (INDIA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 112 - General Emergency
• 100 - Police
• 101 - Fire Department
• 108 - Ambulance Service

SAFETY GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Keep this kit in an accessible location
2. Update supplies regularly
3. Share location with family members
4. Practice evacuation routes
5. Keep emergency contacts updated
6. Store important documents safely

Preparation Completion: ${Math.round((Object.keys(localStorage).filter(key => key.startsWith('kit-')).length / emergencyKitItems.length) * 100)}%

Generated on: ${new Date().toLocaleString()}
Stay Safe! 🛡️
    `;

    // Create blob and download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdfContent));
    element.setAttribute('download', 'Emergency_Kit_Checklist.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert('Emergency Kit Checklist downloaded successfully!');
}

function resetKitChecklist() {
    if (confirm('Are you sure you want to reset the checklist? This action cannot be undone.')) {
        // Clear all kit items from localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('kit-')) {
                localStorage.removeItem(key);
            }
        });

        // Re-render the checklist
        renderKitChecklist();
        alert('Checklist has been reset.');
    }
}
