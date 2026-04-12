/* =========================================
   HazardWatch Emergency Resources System
========================================= */

document.addEventListener("DOMContentLoaded", initEmergencyResources);

/* =========================================
   GLOBAL STATE
========================================= */

const state = {
    userLocation: null,
    currentFilter: "all"
};

let services = [];

/* =========================================
   INITIALIZATION
========================================= */

function initEmergencyResources() {

    const section = document.getElementById("emergencyResourcesSection");
    if (section) section.style.display = "block";

    initButtons();
    initFilters();
    renderGuides();
    renderKitChecklist();

    detectUserLocation();
}

/* =========================================
   BUTTON CONTROLS
========================================= */

function initButtons() {

    const refreshBtn = document.getElementById("refreshLocationBtn");
    const downloadBtn = document.getElementById("downloadPdfBtn");
    const resetBtn = document.getElementById("resetKitBtn");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {

            refreshBtn.style.transition = "transform .4s";
            refreshBtn.style.transform = "rotate(360deg)";

            setTimeout(() => {
                refreshBtn.style.transform = "rotate(0deg)";
            }, 400);

            detectUserLocation();
        });
    }

    if (downloadBtn)
        downloadBtn.addEventListener("click", downloadChecklist);

    if (resetBtn)
        resetBtn.addEventListener("click", resetChecklist);
}

/* =========================================
   LOCATION DETECTION
========================================= */

function detectUserLocation() {

    const status = document.getElementById("locationStatus");

    if (!navigator.geolocation) {

        if (status) status.innerHTML = "⚠ Location not supported";
        return;
    }

    if (status) status.innerHTML = "📡 Detecting your location...";

    navigator.geolocation.getCurrentPosition(

        (position) => {

            state.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            if (status) status.innerHTML = "📍 Location detected";

            fetchNearbyServices();
        },

        () => {
            if (status) status.innerHTML = "⚠ Location permission denied";
        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

/* =========================================
   FETCH SERVICES FROM OSM
========================================= */

async function fetchNearbyServices() {

    if (!state.userLocation) {
        const status = document.getElementById("locationStatus");
        if (status) status.innerHTML = "⚠ Enable location to find nearby services";
        return;
    }

    const status = document.getElementById("locationStatus");
    if (status) status.innerHTML = `📍 Searching near your location...`;

    // Search in progressively larger radius
    const radiuses = [3000, 5000, 10000]; // 3km, 5km, 10km
    
    for (const radius of radiuses) {
        const query = `
[out:json][timeout:20];
(
  node["amenity"="hospital"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["amenity"="clinic"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["amenity"="doctors"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  way["amenity"="hospital"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  way["amenity"="clinic"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  
  node["amenity"="police"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  way["amenity"="police"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  
  node["amenity"="fire_station"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  way["amenity"="fire_station"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  
  node["amenity"="shelter"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["amenity"="community_centre"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["amenity"="social_facility"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  
  node["office"="ngo"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["organization"="ngo"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
);
out center;
`;

        // Retry logic for timeouts
        let retries = 0;
        const maxRetries = 2;
        
        while (retries < maxRetries) {
            try {
                const controller = new AbortController();
                // Increase timeout to 15 seconds for Overpass
                const timeout = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(
                    "https://overpass-api.de/api/interpreter",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        body: "data=" + encodeURIComponent(query),
                        signal: controller.signal
                    }
                );

                clearTimeout(timeout);

                if (!response.ok) {
                    if (response.status === 504) {
                        retries++;
                        console.warn(`⚠️ [Overpass] Gateway timeout (${retries}/${maxRetries} retries) at ${radius}m`);
                        if (retries < maxRetries) {
                            // Wait before retrying
                            await new Promise(r => setTimeout(r, 2000 * retries));
                            continue;
                        }
                    }
                    throw new Error(`Overpass API error: ${response.status}`);
                }

                const data = await response.json();
                const serviceCount = data.elements ? data.elements.length : 0;

                console.log(`📍 Found ${serviceCount} services within ${radius}m`);

                if (serviceCount > 0) {
                    convertOSMToServices(data.elements || []);
                    return; // Success - exit the radius loop
                }
                break; // Exit retry loop, try next radius

            } catch (error) {
                retries++;
                if (retries >= maxRetries) {
                    console.warn(`❌ [Overpass] Failed after ${maxRetries} retries at ${radius}m: ${error.message}`);
                    break; // Exit retry loop, try next radius
                }
                // Wait before retrying
                await new Promise(r => setTimeout(r, 1000 * retries));
            }
        }
    }

    // If no services found in any radius
    const statusEl = document.getElementById("locationStatus");
    if (statusEl) {
        statusEl.innerHTML = "⚠ No emergency services found nearby. Showing national emergency numbers.";
    }
    showNationalEmergencyNumbers();
}

/* =========================================
   FETCH REAL PHONE NUMBERS FROM GOOGLE/OSM
========================================= */

async function fetchRealPhoneNumber(serviceName, lat, lng, serviceType) {
    try {
        // Try to fetch from Google Places API or alternative sources
        // For now, we'll indicate if phone is available from OSM
        return null; // Will use OSM data primarily
    } catch (error) {
        return null;
    }
}

function extractPhoneNumber(tags) {
    // ONLY use REAL phone numbers from OpenStreetMap tags
    // No fake defaults - show "Not available" if not found
    if (tags.phone) return tags.phone;
    if (tags["contact:phone"]) return tags["contact:phone"];
    if (tags["contact:mobile"]) return tags["contact:mobile"];
    if (tags.mobile) return tags.mobile;
    if (tags["phone:mobile"]) return tags["phone:mobile"];
    if (tags["operator:phone"]) return tags["operator:phone"];
    // Return null if no real phone found - don't use defaults
    return null;
}

/**
 * Show national emergency hotlines when no local services found
 */
function showNationalEmergencyNumbers() {
    const nationalNumbers = [
        {
            id: "NATIONAL-POLICE",
            type: 'police',
            name: 'National Police Emergency',
            address: 'Call 24/7 anywhere in India',
            distance: 'Direct call',
            phone: '100',
            hasRealPhone: true,
            coordinates: { lat: state.userLocation?.lat || 0, lng: state.userLocation?.lng || 0 }
        },
        {
            id: "NATIONAL-FIRE",
            type: 'fire',
            name: 'Fire Department Emergency',
            address: 'Call 24/7 anywhere in India',
            distance: 'Direct call',
            phone: '101',
            hasRealPhone: true,
            coordinates: { lat: state.userLocation?.lat || 0, lng: state.userLocation?.lng || 0 }
        },
        {
            id: "NATIONAL-AMBULANCE",
            type: 'hospitals',
            name: 'Ambulance/Medical Emergency',
            address: 'Call 24/7 anywhere in India',
            distance: 'Direct call',
            phone: '108',
            hasRealPhone: true,
            coordinates: { lat: state.userLocation?.lat || 0, lng: state.userLocation?.lng || 0 }
        },
        {
            id: "NATIONAL-UNIFIED",
            type: 'emergency',
            name: 'Unified Emergency Number',
            address: 'Call 24/7 anywhere in India',
            distance: 'Direct call',
            phone: '112',
            hasRealPhone: true,
            coordinates: { lat: state.userLocation?.lat || 0, lng: state.userLocation?.lng || 0 }
        }
    ];

    services = nationalNumbers;
    console.log('📞 Showing national emergency numbers as fallback');
    renderServices();
}

function convertOSMToServices(elements) {

    services = [];

    elements.forEach((item, index) => {

        if (!item.tags || !item.tags.name) return; // Skip items without names

        let type = "";

        if (["hospital", "clinic", "doctors"].includes(item.tags.amenity))
            type = "hospitals";

        else if (item.tags.amenity === "police")
            type = "police";

        else if (item.tags.amenity === "fire_station")
            type = "fire";

        else if (["shelter", "community_centre"].includes(item.tags.amenity))
            type = "shelters";

        else if (item.tags.amenity === "social_facility" || item.tags.office === "ngo")
            type = "ngos";

        if (!type) return;

        // Extract REAL phone number from OpenStreetMap tags only
        let phone = extractPhoneNumber(item.tags);
        const hasRealPhone = phone !== null;
        phone = phone || "📱 Not available";

        const distance = calculateDistance(
            state.userLocation.lat,
            state.userLocation.lng,
            item.lat,
            item.lon
        );

        services.push({
            id: "OSM-" + index,
            type: type,
            name: item.tags.name,
            address: item.tags["addr:street"] || item.tags["addr:full"] || item.tags["addr:city"] || "Nearby location",
            distance: distance,
            phone: phone,
            hasRealPhone: hasRealPhone,
            website: item.tags.website || item.tags["contact:website"] || null,
            coordinates: {
                lat: item.lat,
                lng: item.lon
            }
        });
    });

    // Sort by distance (closest first)
    services.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    // Update status with count
    const statusEl = document.getElementById("locationStatus");
    if (statusEl && services.length > 0) {
        statusEl.innerHTML = `📍 Found <strong>${services.length}</strong> emergency services nearby`;
    }

    renderServices();
}

/* =========================================
   DISTANCE CALCULATION
========================================= */

function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number(R * c).toFixed(2);
}

/* =========================================
   RENDER SERVICES
========================================= */

function renderServices() {

    const container = document.getElementById("servicesList");
    if (!container) return;

    container.innerHTML = "";

    const filtered =
        state.currentFilter === "all"
            ? services
            : services.filter(s => s.type === state.currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center'>No services found nearby</p>";
        return;
    }

    // Use DocumentFragment for batch DOM insertions
    const fragment = document.createDocumentFragment();
    
    filtered.forEach((service, index) => {
        const card = document.createElement("div");
        card.className = "service-card";
        // Create unique ID from service name and type (or use index as fallback)
        const serviceId = `${service.type}-${service.name.toLowerCase().replace(/\s+/g, '-')}-${index}`;
        card.setAttribute('data-service-id', serviceId);
        card.setAttribute('data-service-index', index);

        // Only create tel: link if we have a REAL phone number
        const phoneContent = service.hasRealPhone && service.phone.startsWith("+91")
            ? `<a href="tel:${service.phone}">${service.phone}</a>`
            : `<span class="unavailable-phone">${service.phone}</span>`;

        const lat = service.coordinates?.lat || service.lat;
        const lng = service.coordinates?.lng || service.lng;

        card.innerHTML = `
            <div class="service-card-content">
                <h3>${service.name}</h3>
                <p>📍 ${service.address}</p>
                <p>📏 ${service.distance} km away</p>
                <div class="service-phone">☎️ ${phoneContent}</div>
            </div>
            <button class="service-map-btn" title="Open in Google Maps" data-lat="${lat}" data-lng="${lng}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <!-- Modern navigation/location arrow -->
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="2.5" fill="currentColor"/>
                </svg>
            </button>
        `;

        fragment.appendChild(card);
    });
    
    // Single DOM operation
    container.appendChild(fragment);
    
    // Attach click listeners to Google Maps buttons
    document.querySelectorAll('.service-map-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const lat = btn.getAttribute('data-lat');
            const lng = btn.getAttribute('data-lng');
            if (lat && lng) {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                window.open(mapsUrl, '_blank');
            }
        });
    });
}

/* =========================================
   FILTER SYSTEM
========================================= */

function initFilters() {

    const buttons = document.querySelectorAll(".service-filter-btn");

    buttons.forEach(btn => {

        btn.addEventListener("click", () => {

            buttons.forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            state.currentFilter = btn.dataset.filter;

            renderServices();
        });
    });
}

/* =========================================
   PREPAREDNESS GUIDES
========================================= */

const guides = [
{
title:"🌊 Flood Safety",
steps:[
"Move to higher ground",
"Avoid flooded roads",
"Turn off electricity",
"Prepare emergency kit",
"Follow official alerts"
]
},
{
title:"🌍 Earthquake Safety",
steps:[
"Drop, Cover, Hold On",
"Stay away from windows",
"Move to open area",
"Check injuries",
"Expect aftershocks"
]
},
{
title:"🌪 Cyclone Preparation",
steps:[
"Secure loose objects",
"Stock food and water",
"Charge devices",
"Stay indoors",
"Follow evacuation alerts"
]
}
];

function renderGuides(){

const container=document.getElementById("guidesContainer");
if(!container) return;

const fragment = document.createDocumentFragment();
container.innerHTML="";

guides.forEach(g=>{

const card=document.createElement("div");
card.className="guide-card";

card.innerHTML=`
<h3>${g.title}</h3>
<ul>${g.steps.map(s=>`<li>${s}</li>`).join("")}</ul>
`;

fragment.appendChild(card);

});

// Single DOM operation
container.appendChild(fragment);
}

/* =========================================
   EMERGENCY KIT
========================================= */

const kitItems=[
{id:"K1",name:"Water Bottles",icon:"💧"},
{id:"K2",name:"Torch",icon:"🔦"},
{id:"K3",name:"Power Bank",icon:"🔋"},
{id:"K4",name:"First Aid Kit",icon:"🩹"},
{id:"K5",name:"Medicines",icon:"💊"},
{id:"K6",name:"Emergency Food",icon:"🥫"},
{id:"K7",name:"Documents",icon:"📄"},
{id:"K8",name:"Blanket",icon:"🛏️"}
];

function renderKitChecklist(){

const container=document.getElementById("kitChecklist");
if(!container) return;

const fragment = document.createDocumentFragment();
container.innerHTML="";

kitItems.forEach(item=>{

const div=document.createElement("div");
div.className="kit-item";

if(localStorage.getItem(item.id))
div.classList.add("checked");

div.innerHTML=`<span>${item.icon}</span> ${item.name}`;

div.onclick=()=>toggleKitItem(item.id,div);

fragment.appendChild(div);

});

// Single DOM operation
container.appendChild(fragment);

updateKitProgress();
}

function toggleKitItem(id,el){

if(localStorage.getItem(id)){
localStorage.removeItem(id);
el.classList.remove("checked");
}else{
localStorage.setItem(id,true);
el.classList.add("checked");
}

updateKitProgress();
}

/* =========================================
   KIT PROGRESS
========================================= */

function updateKitProgress(){

const total=kitItems.length;

const completed=kitItems.filter(i=>localStorage.getItem(i.id)).length;

const percent=Math.round((completed/total)*100);

const percentage=document.getElementById("kitPercentage");
const bar=document.getElementById("kitProgressBar");

if(percentage) percentage.textContent=percent+"%";
if(bar) bar.style.width=percent+"%";
}

/* =========================================
   DOWNLOAD CHECKLIST
========================================= */

function downloadChecklist(){

const text=`
Emergency Kit Checklist

${kitItems.map(i=>{
const c=localStorage.getItem(i.id)?"✓":"☐";
return `${c} ${i.name}`;
}).join("\n")}

Emergency Numbers (India)

112 Emergency
100 Police
101 Fire
108 Ambulance
`;

const blob=new Blob([text],{type:"text/plain"});

const link=document.createElement("a");
link.href=URL.createObjectURL(blob);
link.download="emergency-kit.txt";
link.click();
}

/* =========================================
   RESET CHECKLIST
========================================= */

function resetChecklist(){

if(!confirm("Reset checklist?")) return;

kitItems.forEach(i=>localStorage.removeItem(i.id));

renderKitChecklist();
}

/* =========================================
   LOCATE SERVICES ON MAP
========================================= */

/**
 * Add service markers to the Leaflet map
 */
function addServiceMarkersToMap(servicesList) {
    if (!window.map) {
        console.error('Map not initialized');
        return;
    }

    // Create a feature group for service markers
    let serviceMarkerGroup = window.serviceMarkerGroup;
    if (!serviceMarkerGroup) {
        serviceMarkerGroup = L.featureGroup();
        serviceMarkerGroup.addTo(window.map);
        window.serviceMarkerGroup = serviceMarkerGroup;
    } else {
        serviceMarkerGroup.clearLayers();
    }

    // Group services by type for better organization
    const grouped = {};
    servicesList.forEach(service => {
        if (!grouped[service.type]) {
            grouped[service.type] = [];
        }
        grouped[service.type].push(service);
    });

    // Add markers for each service
    servicesList.forEach((service, index) => {
        const lat = service.coordinates?.lat || service.lat;
        const lng = service.coordinates?.lng || service.lng;
        
        if (lat && lng) {
            const color = getServiceMarkerColor(service.type);
            const typeLabel = service.type.charAt(0).toUpperCase();
            // Create consistent ID matching renderServices format
            const serviceId = `${service.type}-${service.name.toLowerCase().replace(/\s+/g, '-')}-${index}`;
            
            // Create custom SVG icon with service number
            const icon = L.icon({
                iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" fill="${color}" stroke="white" stroke-width="1.5"><path d="M16 2c-7.7 0-14 6.3-14 14 0 10 14 30 14 30s14-20 14-30c0-7.7-6.3-14-14-14z"/><circle cx="16" cy="16" r="5" fill="white"/><text x="16" y="18" font-size="8" font-weight="bold" text-anchor="middle" fill="${color}">${index + 1}</text></svg>`)}`,
                iconSize: [36, 48],
                iconAnchor: [18, 48],
                popupAnchor: [0, -48],
                className: 'service-marker'
            });

            const popupContent = 
                `<div style="min-width: 250px; font-family: Arial, sans-serif;">
                    <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px; color: ${color};">🏢 ${service.name}</div>
                    <div style="font-size: 12px; margin-bottom: 5px;">📍 ${service.address}</div>
                    <div style="font-size: 12px; margin-bottom: 5px;">📞 ${service.phone || 'N/A'}</div>
                    <div style="font-size: 12px; font-weight: bold; color: #667eea;">📏 ${service.distance || 'N/A'} km away</div>
                    <button class="map-open-btn" data-lat="${lat}" data-lng="${lng}" style="margin-top: 8px; padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">
                        Open in Google Maps
                    </button>
                </div>`;

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupContent)
                .addTo(serviceMarkerGroup);
            
            // Add click event handlers
            marker.on('click', function() {
                // Highlight the service in the list when marker is clicked
                highlightServiceInList(serviceId);
            });
            
            // Store map open button handler reference
            marker.on('popupopen', function() {
                const btn = document.querySelector('.map-open-btn');
                if (btn) {
                    btn.onclick = function() {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                    };
                }
            });
        }
    });

    // Add legend to map
    addServiceLegendToMap(grouped);

    // Fit map bounds to show all markers
    if (serviceMarkerGroup.getLayers().length > 0) {
        window.map.fitBounds(serviceMarkerGroup.getBounds(), { padding: [80, 80] });
    }

    // Log summary
    console.log(`✅ Added ${servicesList.length} service markers to map`);
    console.log('Service breakdown:', grouped);
}

/**
 * Get marker color based on service type
 */
function getServiceMarkerColor(type) {
    const colors = {
        'hospitals': '#FF6B6B',
        'police': '#4ECDC4',
        'fire': '#FFE66D',
        'ngos': '#95E1D3',
        'shelters': '#A8DADC',
        'emergency': '#FF1744'
    };
    return colors[type] || '#667EEA';
}

/**
 * Add legend to map showing service types and colors
 */
function addServiceLegendToMap(grouped) {
    // Remove existing legend if present
    const existingLegend = document.querySelector('.service-legend');
    if (existingLegend) {
        existingLegend.remove();
    }

    // Create legend element
    const legend = L.control({ position: 'topright' });

    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'service-legend');
        div.style.backgroundColor = 'white';
        div.style.padding = '15px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.fontSize = '12px';
        div.style.zIndex = '1000';

        let html = '<div style="margin-bottom: 10px; font-weight: bold; font-size: 14px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">🗺️ Services on Map</div>';

        // Create legend items for each service type
        Object.keys(grouped).forEach(type => {
            const count = grouped[type].length;
            const color = getServiceMarkerColor(type);
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

            html += `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div style="width: 16px; height: 16px; background-color: ${color}; border-radius: 50%; margin-right: 8px; border: 2px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.3);"></div>
                    <span>${typeLabel} <strong>(${count})</strong></span>
                </div>
            `;
        });

        html += '<div style="margin-top: 12px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 8px;">Click on markers for details</div>';

        div.innerHTML = html;
        return div;
    };

    if (window.map) {
        legend.addTo(window.map);
    }
}

/**
 * Highlight service in the list when marker is clicked
 */
function highlightServiceInList(serviceId) {
    // Remove previous highlights
    const allCards = document.querySelectorAll('.service-card');
    allCards.forEach(card => {
        card.classList.remove('highlight');
    });

    // Find and highlight the matching service card
    const targetCard = document.querySelector(`[data-service-id="${serviceId}"]`);
    if (targetCard) {
        targetCard.classList.add('highlight');
        // Scroll to the highlighted card smoothly
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Show toast notification
 */
function showToastNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        font-weight: bold;
        z-index: 10000;
    `;

    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('remove');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}