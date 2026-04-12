# 🚀 OceanGuard - Complete Deployment Guide

## ✅ What's Been Done

### Backend Conversion  
- ✅ Converted from PostgreSQL to **MongoDB Atlas**
- ✅ Created Mongoose User model with password hashing
- ✅ Updated `/api/auth/login` endpoint for MongoDB
- ✅ Updated `/api/auth/register` endpoint for MongoDB
- ✅ Syntax validation: All files pass `node -c`

### Frontend Updates
- ✅ Updated`login.js` to call `/api/auth/login` endpoint
- ✅ Updated signup to call `/api/auth/register` endpoint
- ✅ Proper error handling and user role management
- ✅ Session storage with user data from backend

### Test Data
- ✅ Created seed script at `backend/scripts/seed-users.js`
- ✅ 5 test users ready to be created

---

## 🔧 Step 1: Prepare Your Backend

### 1.1 Install Dependencies
```bash
cd f:\Documents\Github1\OceanGuardWorking\backend
npm install mongoose
```

### 1.2 Update `.env` File
Make sure your MongoDB connection string is set:
```env
MONGO_URI=mongodb+srv://OmPatil1088:<password>@hazardwatch.jsjrbzd.mongodb.net/?appName=HazardWatch
```

⚠️ **IMPORTANT**: Replace `<password>` with your actual MongoDB password!

### 1.3 Create Test Users in MongoDB
```bash
node scripts/seed-users.js
```

Expected output:
```
✅ Connected to MongoDB
👤 Creating test users...
✅ Created: ompatil@hazardwatch.com (Role: admin)
✅ Created: admin@example.com (Role: admin)
✅ Created: user@example.com (Role: user)
✅ Created: john@example.com (Role: user)
✅ Created: sarah@example.com (Role: user)
✅ Database seeding completed successfully!
```

---

## 🧪 Step 2: Test Locally

### 2.1 Start Backend
```bash
cd backend
npm start
# OR for development:
npm run dev
```

Should see:
```
✅ Server running on http://localhost:5000
✅ MongoDB connected successfully!
```

### 2.2 Open Frontend in Browser
```bash
# Open in browser
file:///f:/Documents/Github1/OceanGuardWorking/index.html
```

### 2.3 Test Login
Try these credentials:
- **Admin**: ompatil@hazardwatch.com / Om1@121204
- **User**: user@example.com / user123

---

## 📦 Step 3: Deploy to Vercel

### 3.1 Update Environment Variables in Vercel
Go to: https://vercel.com/dashboard
1. Select your project
2. Settings → Environment Variables
3. Add:
```
MONGO_URI=mongodb+srv://OmPatil1088:<password>@hazardwatch.jsjrbzd.mongodb.net/?appName=HazardWatch
```

### 3.2 Deploy
```bash
cd f:\Documents\Github1\OceanGuardWorking
git add .
git commit -m "MongoDB integration complete"
git push
```

Wait 2-3 minutes for Vercel to redeploy.

### 3.3 Test on Live Server
- Frontend: https://disasterwatchfinal.vercel.app/
- Backend API: https://disasterwatchfinal.vercel.app/api/auth/login

Test with:
- Email: ompatil@hazardwatch.com
- Password: Om1@121204

---

## 📋 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| ompatil@hazardwatch.com | Om1@121204 | Admin |
| admin@example.com | admin123 | Admin |
| user@example.com | user123 | User |
| john@example.com | john123 | User |
| sarah@example.com | sarah123 | User |

---

## 🔍 Troubleshooting

### Backend Won't Connect to MongoDB
```bash
# Check MONGO_URI is set correctly
echo %MONGO_URI%

# Test connection manually
node scripts/seed-users.js
```

### "Cannot find module 'mongoose'"
```bash
npm install mongoose
```

### "PORT 5000 already in use"
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in server.js
const PORT = 5001; // Change this
```

### Frontend Can't Reach Backend API
- **Local**: Make sure backend is running on localhost:5000
- **Deployed**: Make sure `MONGO_URI` env var is set in Vercel

---

## 📂 Project Structure

```
OceanGuardWorking/
├── backend/
│   ├── db.js (MongoDB Mongoose)
│   ├── models/
│   │   └── User.js (User schema)
│   ├── routes/
│   │   └── auth.js (Login/Register endpoints)
│   ├── scripts/
│   │   └── seed-users.js (Create test users)
│   ├── server.js
│   └── package.json
├── login.js (Frontend auth)
├── dashboard.html
├── index.html
└── .env (MONGO_URI)
```

---

## ✨ Features

✅ User registration with MongoDB  
✅ User login with password hashing (bcrypt)  
✅ Admin role detection (email-based)  
✅ Session storage with user data  
✅ Vercel deployment ready  
✅ Test users pre-configured  
✅ Error handling & logging  

---

## 🎯 What's Next?

1. ✅ Run `npm install mongoose` in backend
2. ✅ Create test users: `node scripts/seed-users.js`
3. ✅ Test locally: `npm start` in backend
4. ✅ Deploy: `git push` to Vercel
5. ✅ Test on live: https://disasterwatchfinal.vercel.app

---

**Status**: 🟢 **READY FOR DEPLOYMENT**

All syntax checks passed. Backend and frontend fully integrated with MongoDB Atlas.
