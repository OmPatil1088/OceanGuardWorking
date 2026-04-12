# API Errors - Complete Fix Guide

## 🔴 Issues Found

1. **Backend API: Failed to fetch** (localhost:5000 not running)
2. **GNews API: 429 Rate Limit** (free tier limit exceeded)
3. **Overpass API: 504 Gateway Timeout** (API overloaded)

---

## 🛠️ SOLUTION 1: Start the Backend Server

### Why It's Failing
Your dashboard is trying to fetch incidents from `http://localhost:5000/api/incidents`, but the backend server is **not running**.

### How to Fix - OPTION A: Run Locally (Development)

#### Step 1: Open Terminal
```
Windows PowerShell / Command Prompt
Navigate to: f:\Documents\Github1\OceanGuardWorking\backend
```

#### Step 2: Install Dependencies (first time only)
```bash
npm install
```

#### Step 3: Start Server
```bash
npm start
```

**Expected Output:**
```
✅ Server running on http://localhost:5000
✅ Database connected
✅ Ready to accept requests
```

#### Step 4: Test the API
```bash
# Open in browser or terminal:
http://localhost:5000/health

# Should return:
{ "status": "online", "uptime": 123456 }
```

---

### How to Fix - OPTION B: Use Docker (Recommended)

#### Step 1: Check Docker Installation
```bash
docker --version
# Should show: Docker version X.X.X
```

#### Step 2: Build & Run
```bash
cd backend
docker-compose up -d
```

#### Step 3: Check Status
```bash
docker ps
# Should show oceanguard-api container running
```

#### Step 4: Test
```bash
http://localhost:5000/api/incidents
```

---

### How to Fix - OPTION C: No Backend (Use Firestore Only)

If you don't want to run the backend, modify `dashboard.js`:

```javascript
// Line 307 in dashboard.js - Change this:
const API_BASE = 'http://localhost:5000';

// To this:
const API_BASE = null; // Disable backend
```

Then update loadIncidents():
```javascript
async function loadIncidents() {
    markStart('loadIncidents');
    
    // Skip backend API - use sample data only
    console.log('📦 Using sample incident data (backend disabled)');
    updateMapAndCases(sampleIncidents);
    
    markEnd('loadIncidents');
}
```

---

## 🔧 SOLUTION 2: Fix GNews API Rate Limiting

### Problem
```
429 (Too Many Requests) - Free tier limited to 50 requests/month
```

### Fix: Implement Longer Cache Duration

Replace lines 650-690 in dashboard.js:

```javascript
async function loadNews() {
    markStart('loadNews');

    // Check cache FIRST - stay for 24 hours
    const cachedNews = getFromCache('news');
    if (cachedNews && cachedNews.timestamp && 
        (Date.now() - cachedNews.timestamp) < 24 * 60 * 60 * 1000) {
        console.log('✅ Using cached news (fresh, expires in 24h)');
        renderNewsList(cachedNews.articles);
        markEnd('loadNews');
        return;
    }

    // Load sample news first (instant display)
    const sampleArticles = loadSampleNews();
    renderNewsList(sampleArticles);

    // Try GNews API in background (don't block UI)
    console.log('🔄 Updating from GNews API (background)...');
    
    const API_URL = "https://gnews.io/api/v4/search?" + 
        "q=disaster%20OR%20flood%20OR%20cyclone&" +
        "lang=en&country=in&max=3&sortby=publishedAt&" +
        "token=c8dd2207a7a034c7b3814eca64c4a7d1";

    try {
        const response = await fetch(API_URL, { 
            signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.articles && data.articles.length > 0) {
                saveToCache('news', {
                    articles: data.articles,
                    timestamp: Date.now()
                });
                console.log('✅ News updated from API');
            }
        } else if (response.status === 429) {
            console.warn('⚠️ News API rate limited. Next update in 24h.');
        }
    } catch (error) {
        console.warn('⚠️ Could not fetch live news:', error.message);
    }
    
    markEnd('loadNews');
}
```

### Workaround: Use Different News API

If GNews continues to rate limit, use NewsAPI instead (250 requests/day free):

```javascript
// Replace GNews URL with:
const API_URL = "https://newsapi.org/v2/everything?" + 
    "q=disaster&" +
    "sortBy=publishedAt&" +
    "language=en&" +
    "pageSize=6&" +
    "apiKey=YOUR_NEWSAPI_KEY"; // Get free key at https://newsapi.org

// Get your free API key:
// 1. Go to https://newsapi.org/
// 2. Sign up (free)
// 3. Copy API key
// 4. Paste in code above
```

---

## 🗺️ SOLUTION 3: Fix Overpass API Timeout

### Problem
```
504 Gateway Timeout - Overpass API is overloaded or slow
```

### Fix: Increase Timeout & Add Retry Logic

Replace lines 140-190 in emergency-resources.js:

```javascript
async function fetchNearbyServices() {
    const radii = [3000, 5000, 10000]; // meters
    const maxRetries = 2;

    for (const radius of radii) {
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                const controller = new AbortController();
                // Increase timeout to 15 seconds
                const timeout = setTimeout(() => controller.abort(), 15000);

                const query = `[out:json];
(
  node["amenity"="hospital"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["amenity"="police"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["amenity"="fire_station"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["amenity"="shelter"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
  node["amenity"="community_centre"](around:${radius},${state.userLocation.lat},${state.userLocation.lng});
);
out center;`;

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
                        console.warn(`⚠️ Overpass API timeout (${retries}/${maxRetries} retries)`);
                        // Wait before retrying
                        await new Promise(r => setTimeout(r, 2000 * retries));
                        continue;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                const serviceCount = data.elements ? data.elements.length : 0;

                console.log(`📍 Found ${serviceCount} services within ${radius}m`);

                if (serviceCount > 0) {
                    convertOSMToServices(data.elements || []);
                    return; // Success
                }
                break; // Exit retry loop, try next radius
                
            } catch (error) {
                retries++;
                if (retries >= maxRetries) {
                    console.warn(`❌ Service fetch failed after ${maxRetries} retries at ${radius}m`);
                    break; // Exit retry loop, try next radius
                }
                // Wait before retrying
                await new Promise(r => setTimeout(r, 1000 * retries));
            }
        }
    }

    console.warn('⚠️ No services found in any radius - using empty list');
    const statusEl = document.getElementById("locationStatus");
    if (statusEl) {
        statusEl.innerHTML = '❌ Could not fetch nearby services';
    }
}
```

### Alternative: Use OpenStreetMap API (More Reliable)

```javascript
// Instead of Overpass, use Nominatim (more stable)
async function fetchNearbyServicesAlt() {
    const { lat, lng } = state.userLocation;
    
    const types = [
        { type: 'hospital', icon: '🏥' },
        { type: 'police', icon: '🚔' },
        { type: 'fire_station', icon: '🚒' },
        { type: 'shelter', icon: '🏢' }
    ];

    for (const { type, icon } of types) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?` +
                `amenity=${type}&` +
                `format=json&` +
                `lat=${lat}&lon=${lng}&` +
                `limit=5`;

            const response = await fetch(url, {
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    console.log(`✅ Found ${data.length} ${type} locations`);
                    // Process results...
                }
            }
        } catch (error) {
            console.warn(`⚠️ Could not fetch ${type}:`, error.message);
        }
    }
}
```

---

## ✅ COMPLETE FIX CHECKLIST

- [ ] **Backend**: Run `npm start` in backend/ folder OR disable backend API
- [ ] **GNews API**: Increase cache to 24 hours OR switch to NewsAPI
- [ ] **Overpass API**: Increase timeout to 15s OR add retry logic
- [ ] **Test Dashboard**: Reload page - should see no errors
- [ ] **Test Incidents**: Map should load with sample data
- [ ] **Test News**: News section should load (cached or sample)
- [ ] **Test Map Services**: Emergency resources should load with retry

---

## 🚀 Quick Start (Recommended)

### Option 1: Backend + Improved Caching (5 minutes)
```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Keep app running
# No code changes needed - will just work!
```

### Option 2: No Backend + Firestore (10 minutes)
```bash
# Edit dashboard.js line 307:
const API_BASE = null;

# Then update loadIncidents() to use Firestore
# See FIRESTORE_SETUP.md for details
```

### Option 3: No Backend, No Firestore (1 minute)
```bash
# Edit dashboard.js line 307:
const API_BASE = null;

# App will use sample data for everything
# Good for development/demo
```

---

## 📊 Summary

| Error | Cause | Fix | Time |
|-------|-------|-----|------|
| Backend Failed | Server not running | `npm start` in backend/ | 1m |
| GNews 429 | Rate limit | Increase cache to 24h | 5m |
| Overpass 504 | Timeout | Add retry + 15s timeout | 10m |

**Recommended**: Start with **Option 1** (Backend) - it's the fastest!

---

## 🆘 Troubleshooting

### Backend not connecting
```bash
# Test if running:
curl http://localhost:5000/health

# If fails:
1. Check backend window is still running
2. Verify port 5000 not in use: netstat -ano | findstr :5000
3. Try different port: set PORT=5001 && npm start
```

### CORS errors after starting backend
```javascript
// Backend issue - add to backend/server.js:
const cors = require('cors');
app.use(cors());
```

### Still seeing old errors
```javascript
// Clear cache:
// In browser console:
localStorage.clear();
location.reload();
```

---

**Status**: Choose a fix option above and apply it! 🚀
