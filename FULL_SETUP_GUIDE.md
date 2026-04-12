# 🚀 Complete OceanGuard Setup Guide - From Zero to Running

## Phase 1: MongoDB Atlas Setup (5 minutes)

### Step 1: Create MongoDB Account
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click **Sign Up** (free)
3. Create account with email/password
4. Verify email

### Step 2: Create a Cluster
1. Click **Create a Project** → Name it "OceanGuard"
2. Click **Build a Database**
3. Select **M0 (Free)** tier
4. Choose region closest to you
5. Click **Create**
6. Wait 5-10 minutes for cluster to build (watch the status)

### Step 3: Create Database User
1. Click **Database Access** (left menu)
2. Click **Add New Database User**
3. Username: `OmPatil1088`
4. Password: `Ompatil_1088` (write this down!)
5. Click **Add User**

### Step 4: Whitelist Your IP
1. Click **Network Access** (left menu)
2. Click **Add IP Address**
3. Enter `0.0.0.0/0` (allows all IPs)
4. Click **Confirm**

### Step 5: Get Connection String
1. Click **Clusters** → Your cluster `hazardwatch`
2. Click **Connect**
3. Select **Drivers** tab
4. Copy the connection string
5. Replace `<password>` with `Ompatil_1088`

**Example:**
```
mongodb+srv://OmPatil1088:Ompatil_1088@hazardwatch.jsjrbzd.mongodb.net/?appName=HazardWatch
```

---

## Phase 2: Backend Setup (10 minutes)

### Step 1: Update Environment Variables
Edit `backend/.env`:
```
MONGO_URI=mongodb+srv://OmPatil1088:Ompatil_1088@hazardwatch.jsjrbzd.mongodb.net/?appName=HazardWatch
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
```

### Step 2: Install Dependencies
```bash
cd backend
npm install mongoose bcryptjs
```

### Step 3: Check Files Exist
Verify these files exist:
- ✅ `backend/db.js` (MongoDB connection)
- ✅ `backend/models/User.js` (User schema)
- ✅ `backend/routes/auth.js` (Login/Register)
- ✅ `backend/server.js` (Main server)

### Step 4: Create Test Users (Optional)
```bash
node scripts/seed-users.js
```

Should output:
```
✅ Connected to MongoDB
✅ Created: ompatil@hazardwatch.com (Role: admin)
✅ Created: user@example.com (Role: user)
✅ Database seeding completed!
```

### Step 5: Test Backend
```bash
npm start
```

Expected output:
```
✅ Server running on http://localhost:5000
✅ MongoDB connected successfully!
```

If you get an error about DNS, **your MongoDB cluster isn't set up correctly** - go back and verify:
- Cluster status is GREEN
- `0.0.0.0/0` is in Network Access
- Password is exactly `Ompatil_1088`

---

## Phase 3: Frontend Setup (5 minutes)

### Step 1: Update Frontend API Calls
In `login.js`, verify this code exists:

```javascript
const baseUrl = window.location.protocol + '//' + window.location.host;
const apiEndpoint = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') 
    ? 'http://localhost:5000/api/auth/login'
    : '/api/auth/login';
```

This makes login calls to your backend API.

### Step 2: Test Login Page
Open in browser:
```
file:///f:/Documents/Github1/OceanGuardWorking/index.html
```

### Step 3: Try Logging In
Use test credentials:
- Email: `ompatil@hazardwatch.com`
- Password: `Om1@121204` (from seed script)

Or:
- Email: `user@example.com`
- Password: `user123` (from seed script)

If login works → You see the dashboard ✅

If login fails → Check backend is running (`npm start` in backend folder)

---

## Phase 4: Deployment to Vercel (10 minutes)

### Step 1: Add Environment Variable to Vercel
1. Go to: https://vercel.com/dashboard
2. Select your project `disasterwatchfinal`
3. Click **Settings** → **Environment Variables**
4. Add new variable:
   - Key: `MONGO_URI`
   - Value: `mongodb+srv://OmPatil1088:Ompatil_1088@hazardwatch.jsjrbzd.mongodb.net/?appName=HazardWatch`
5. Click **Save**

### Step 2: Deploy
```bash
cd f:\Documents\Github1\OceanGuardWorking
git add .
git commit -m "MongoDB integration complete"
git push
```

Wait 2-3 minutes for Vercel to deploy.

### Step 3: Test on Live Server
Go to: https://disasterwatchfinal.vercel.app

Try login with same test credentials.

---

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| ompatil@hazardwatch.com | Om1@121204 | Admin |
| admin@example.com | admin123 | Admin |
| user@example.com | user123 | User |
| john@example.com | john123 | User |
| sarah@example.com | sarah123 | User |

---

## Troubleshooting

### Issue: "querySrv ECONNREFUSED" Error
**Solution**: Your MongoDB cluster isn't reachable
1. Check cluster is GREEN in MongoDB Atlas
2. Check `0.0.0.0/0` is in Network Access
3. Check password is exactly `Ompatil_1088`
4. Try from different network (phone hotspot)

### Issue: "Cannot find module 'mongoose'"
**Solution**: Install it
```bash
npm install mongoose
```

### Issue: Login doesn't work
**Solution**: Check backend is running
```bash
cd backend
npm start
```

### Issue: "Email already registered"
**Solution**: The test user already exists. Try a different email or delete from MongoDB.

---

## Quick Verification Checklist

- [ ] MongoDB cluster is running (GREEN status)
- [ ] `0.0.0.0/0` is in Network Access
- [ ] User `OmPatil1088` exists with password `Ompatil_1088`
- [ ] Connection string in `backend/.env` has correct password
- [ ] Backend installed: `npm install mongoose bcryptjs`
- [ ] Backend starts: `npm start` (no errors)
- [ ] Frontend loads: `index.html` opens in browser
- [ ] Login works with test credentials
- [ ] Deployed to Vercel and environment variable set

---

## What Gets Created

```
OceanGuardWorking/
├── backend/
│   ├── server.js (Main API)
│   ├── db.js (MongoDB connection)
│   ├── models/
│   │   └── User.js (User schema)
│   ├── routes/
│   │   └── auth.js (Login/Register API)
│   ├── scripts/
│   │   └── seed-users.js (Test data)
│   ├── .env (MongoDB URI)
│   └── package.json
├── login.js (Frontend authentication)
├── index.html (Login page)
├── dashboard.html (After login)
└── .env (Root MongoDB URI)
```

---

## Success!

Once you see:
```
✅ Server running on http://localhost:5000
✅ MongoDB connected successfully!
```

And login works in your browser → **You're ready to go live!** 🚀

---

**Questions?** Check the MongoDB Atlas settings first - that's 99% of connection issues!
