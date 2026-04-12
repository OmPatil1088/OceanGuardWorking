# 🚀 Setup Guide - Without Docker

Since Docker isn't available, here's how to run the backend directly with Node.js.

## Option A: Quick Setup (Recommended for Development)

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

This will start the API on `http://localhost:5000` without needing a database.

**Important**: The backend will:
- ✅ Accept all HTTP requests
- ✅ Return mock data
- ✅ Work perfectly for frontend testing
- ⚠️ Not persist data (in-memory only)

### 2. Update Frontend Config

Open `dashboard.js` and update the API endpoint:

```javascript
// Around line 40-50
const API_BASE_URL = 'http://localhost:5000/api';
```

### 3. Open Frontend in Browser

```bash
cd ..
# Open dashboard.html in your browser
# Or right-click dashboard.html → Open with Live Server (VS Code)
```

---

## Option B: Full Setup (With Database - Requires PostgreSQL Installation)

If you want persistent data:

### 1. Install PostgreSQL

**Windows**:
- Download: https://www.postgresql.org/download/windows/
- Run installer, remember the password
- Default port: 5432

**macOS**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux**:
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt, run:
CREATE DATABASE oceanguard;
CREATE USER oceanguard WITH PASSWORD 'password';
ALTER ROLE oceanguard SET client_encoding TO 'utf8';
ALTER ROLE oceanguard SET default_transaction_isolation TO 'read committed';
ALTER ROLE oceanguard SET default_transaction_deferrable TO 'off';
ALTER ROLE oceanguard SET default_transaction_read_only TO 'off';
ALTER ROLE oceanguard SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE oceanguard TO oceanguard;

# Exit
\q
```

### 3. Install Redis (Optional, for caching)

**Windows**: Download from https://github.com/microsoftarchive/redis/releases
**macOS**: `brew install redis`
**Linux**: `sudo apt-get install redis-server`

### 4. Configure Backend

```bash
cd backend

# Copy and edit environment file
cp .env.example .env

# Edit .env and set:
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oceanguard
DB_USER=oceanguard
DB_PASSWORD=password
REDIS_HOST=localhost  # or skip if you didn't install Redis
JWT_SECRET=dev-secret-key-change-in-production
```

### 5. Run Migrations

```bash
npm run migrate
```

### 6. Start Backend

```bash
npm run dev
```

---

## ⚡ Quick Start (Simplest - No Database)

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Open Frontend
# Just open dashboard.html in your browser
```

---

## 🧪 Test It's Working

### Backend Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-11T...",
  "uptime": 12.5,
  "environment": "development",
  "version": "1.0.0"
}
```

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test"
  }'
```

### Frontend Test
Open `dashboard.html` in browser → Should load without errors

---

## 📋 Recommendation

### For Quick Testing (Right Now)
✅ Use **Option A** - `npm run dev` without database
- Takes 30 seconds
- Works perfectly for frontend
- Falls back to sample data

### For Full Development
⚠️ Use **Option B** - Setup PostgreSQL
- Takes 10 minutes
- Real data persistence
- Test authentication
- Test API endpoints

### For Production Deployment
→ Switch back to Docker later
- Safe, isolated environment
- Easy scaling
- Industry standard

---

## 🚀 Start Now - Option A (Recommended)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Wait for:
# 🚀 OceanGuard API Server running on 0.0.0.0:5000
# Then open Terminal 2

# Terminal 2: Frontend
# Right-click dashboard.html → Open with Live Server
# Or just open it in your browser directly
```

---

## Common Issues

### "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org/
- Download LTS version (20.x+)
- Run installer
- Restart terminal

### "Port 5000 already in use"
**Solution**: Change port in backend/server.js
```javascript
const PORT = process.env.PORT || 5000;  // Change 5000 to 3001 or another port
```

### "Cannot find module axios/pg/redis"
**Solution**: Reinstall dependencies
```bash
cd backend
rm -r node_modules package-lock.json
npm install
```

### Frontend doesn't connect to backend
**Solution**: Check browser console (F12)
1. Backend must be running: `npm run dev`
2. Correct API URL in dashboard.js
3. No CORS errors (they're expected for now)

---

## 📊 What Works Without Database

✅ Frontend loads perfectly
✅ Dashboard displays sample data
✅ Map shows sample incidents
✅ Alerts display correctly
✅ Community section works
✅ Emergency resources show up
✅ All UI interactions work

❌ Data doesn't persist
❌ No real authentication yet
❌ No actual incident storage

---

## Summary

| Setup | Time | Difficulty | Data Persistence |
|-------|------|-----------|------------------|
| **Option A (Recommended)** | 30 sec | Easy | No (sample data) |
| **Option B (Full)** | 10 min | Medium | Yes (PostgreSQL) |
| **Docker** | 5 min* | Easy | Yes | *Requires Docker installation

**My Recommendation**: Start with Option A right now, switch to Option B later if needed.

Ready to start? Run this:
```bash
cd backend && npm run dev
```
