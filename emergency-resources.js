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

    if (!state.userLocation) return;

    const radius = 5000;

    const query = `
[out:json][timeout:25];
(
node["amenity"="hospital"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
node["amenity"="clinic"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
node["amenity"="doctors"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});

node["amenity"="police"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});

node["amenity"="fire_station"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});

node["amenity"="shelter"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
node["amenity"="community_centre"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});

node["amenity"="social_facility"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
node["office"="ngo"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
);
out body;
`;

    try {

        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: "data=" + encodeURIComponent(query)
            }
        );

        if (!response.ok) {
            throw new Error("Overpass API error");
        }

        const data = await response.json();

        console.log("Nearby services:", data);

        convertOSMToServices(data.elements || []);

    } catch (error) {

        console.error("Service fetch error:", error);

        const status = document.getElementById("locationStatus");

        if (status)
            status.innerHTML = "⚠ Unable to fetch nearby services";
    }
}
/* =========================================
   CONVERT OSM DATA
========================================= */

function convertOSMToServices(elements) {

    services = [];

    elements.forEach((item, index) => {

        if (!item.tags) return;

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

        services.push({

            id: "OSM-" + index,

            type: type,

            name: item.tags.name || "Emergency Service",

            address: item.tags["addr:street"] || "Nearby location",

            distance: calculateDistance(
                state.userLocation.lat,
                state.userLocation.lng,
                item.lat,
                item.lon
            ),

            phone: item.tags.phone || "Not available",

            coordinates: {
                lat: item.lat,
                lng: item.lon
            }
        });
    });

    services.sort((a, b) => a.distance - b.distance);

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

        container.innerHTML =
            "<p style='text-align:center'>No services found nearby</p>";
        return;
    }

    filtered.forEach(service => {

        const card = document.createElement("div");
        card.className = "service-card";

        card.innerHTML = `
<h3>${service.name}</h3>
<p>📍 ${service.address}</p>
<p>📏 ${service.distance} km away</p>
<p>📞 ${service.phone}</p>
<button class="map-btn">Open in Maps</button>
`;

        card.querySelector(".map-btn").onclick = () => openMap(service);

        container.appendChild(card);
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
   OPEN GOOGLE MAPS
========================================= */

function openMap(service) {

    const url =
        `https://www.google.com/maps/search/?api=1&query=${service.coordinates.lat},${service.coordinates.lng}`;

    window.open(url, "_blank");
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

container.innerHTML="";

guides.forEach(g=>{

const card=document.createElement("div");
card.className="guide-card";

card.innerHTML=`
<h3>${g.title}</h3>
<ul>${g.steps.map(s=>`<li>${s}</li>`).join("")}</ul>
`;

container.appendChild(card);

});
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

container.innerHTML="";

kitItems.forEach(item=>{

const div=document.createElement("div");
div.className="kit-item";

if(localStorage.getItem(item.id))
div.classList.add("checked");

div.innerHTML=`<span>${item.icon}</span> ${item.name}`;

div.onclick=()=>toggleKitItem(item.id,div);

container.appendChild(div);

});

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