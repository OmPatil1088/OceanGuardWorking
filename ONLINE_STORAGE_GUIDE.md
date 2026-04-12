# 🚀 Firebase Firestore: Quick Start Guide

## Two Options for User Storage

### Option A: Local Storage (Current - config.json)
```
✅ Works now
✅ No setup needed
❌ Need to edit code to add/remove admins
❌ Not secure for production
```

### Option B: Firebase Firestore (Recommended)
```
✅ Online database
✅ Easy management via Firebase Console
✅ No code changes to add/remove admins
✅ More secure
✅ Production-ready
```

---

## 🎯 Choose Your Path

### Path 1: Keep Using config.json (Local)
✅ Current setup works fine!
- Continue using local [config.json](config.json)
- Edit JSON to add/remove admins
- Good for development

**Your current files:**
- [login.js](login.js) - Already configured for config.json
- [config.json](config.json) - Lists admins locally

---

### Path 2: Move to Firestore (Online)
✨ **Recommended for production**

**3 Steps:**

#### Step 1: Setup Firestore (5 minutes)
See: [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) for detailed instructions

**Quick version:**
1. Go to https://console.firebase.google.com/
2. Select project: `disaster-ai-240b7`
3. Create Firestore Database
4. Create collection: `users`
5. Add documents with user data

#### Step 2: Replace login.js
```bash
# Backup current login.js
cp login.js login.js.backup

# Copy Firestore version
cp FIRESTORE_LOGIN.js login.js
```

#### Step 3: Test
```
Login with any user from Firestore
Should work like before!
```

---

## 📝 Firestore Collection Structure

**Collection Name:** `users`

**Document Format:**
```
Document ID: user@example.com
{
  email: "user@example.com",
  role: "admin" | "user",
  name: "Display Name",
  createdAt: timestamp
}
```

**Example Documents:**
```
users/
├── admin@oceanguard.gov.in
│   ├── email: "admin@oceanguard.gov.in"
│   ├── role: "admin"
│   └── name: "Admin User"
│
├── user@example.com
│   ├── email: "user@example.com"
│   ├── role: "user"
│   └── name: "Regular User"
```

---

## 🎛️ Firebase Console: Manage Users

### Add New Admin (No Code!)
1. Firebase Console → Firestore Database
2. Collection: `users` → Add Document
3. Document ID: `newemail@example.com`
4. Add Field: `role` = `admin`
5. Save

**Done!** Next login = Admin access

### Change User to Admin
1. Click user document
2. Change `role` field: `user` → `admin`
3. Save

**Done!** Next login = Admin access

### Remove Admin Access
1. Click admin document
2. Change `role` field: `admin` → `user`
3. Save

**Done!** Next login = User access only

### Delete User
1. Click user document
2. Click delete icon
3. Confirm

**Done!** User cannot login

---

## 💻 How Firestore Login Works

```
User Enters Email/Password
         ↓
   Firebase Auth ✓
         ↓
   Fetch Role from Firestore
         ↓
   If Found in Firestore:
   └─ Use that role (admin/user)
         ↓
   If Not Found in Firestore:
   └─ Fallback to config.json
         ↓
   Set sessionStorage
         ↓
   Redirect to Dashboard
```

**Key Point:** Firestore is checked FIRST, config.json is fallback

---

## ✅ Verify Firestore Setup

### Test 1: Check Firebase Console
```
1. Go to https://console.firebase.google.com/
2. Select project: disaster-ai-240b7
3. Firestore Database → Should see "users" collection
4. Users collection → Should see your documents
```

### Test 2: Login Test
```
1. Go to index.html
2. Login with email from Firestore
3. Check browser console:
   ✅ "User role from Firestore: ..." = Working!
   ⚠️  "Falling back to config.json" = Not found in Firestore
```

---

## 📊 Comparison

| Feature | config.json | Firestore |
|---------|------------|-----------|
| **Storage** | Local file | Online database |
| **Setup** | None | 5 minutes |
| **Add Admin** | Edit JSON | Click in Console |
| **Update Speed** | Redeploy | Instant |
| **Security** | Low | High |
| **Scaling** | Limited | Unlimited |
| **Production** | Not recommended | Recommended |

---

## 🔄 Hybrid Approach (Best)

**Use both together:**
1. Keep config.json for local development
2. Use Firestore for production
3. [FIRESTORE_LOGIN.js](FIRESTORE_LOGIN.js) tries Firestore first, falls back to config.json

```javascript
// Flow:
getUserRole(email) {
    try {
        return await fetchFromFirestore(email);  // Try Firestore
    } catch {
        return await fetchFromLocalConfig(email);  // Fallback
    }
}
```

**This means:**
✅ Works offline (config.json)
✅ Works online (Firestore)
✅ Best flexibility

---

## 🚀 Recommended Setup

### Development
```
✅ Use config.json
✅ Test locally
✅ No Firestore needed
```

### Production
```
✅ Use Firestore
✅ Manage users in Firebase Console
✅ Keep config.json as backup
```

### Files
```
login.js
├── Checks Firestore first
├── Falls back to config.json
└── Works in both dev & prod
```

---

## 🆘 Need Help?

### Firestore Setup Issues?
See: [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) detailed guide

### Want to Revert to config.json?
```bash
cp login.js.backup login.js
# Back to using config.json only
```

### Users can't login?
1. Check Firebase Console → users collection exists
2. Check user document has correct email
3. Check browser console for error messages
4. Try the fallback (should use config.json)

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| [login.js](login.js) | Current login (uses config.json) |
| [FIRESTORE_LOGIN.js](FIRESTORE_LOGIN.js) | Updated login (uses Firestore + fallback) |
| [config.json](config.json) | Local admin list (fallback) |
| [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) | Detailed Firestore setup guide |

---

## Next Steps

### Use Local config.json Now? ✅
- Current setup is ready
- No additional work needed
- Good for development

### Move to Firestore Later?
1. Read [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)
2. Create Firestore collection
3. Copy [FIRESTORE_LOGIN.js](FIRESTORE_LOGIN.js) → login.js
4. Done! Users now stored online

---

## Summary

**Right Now:** Users stored in [config.json](config.json) ✅

**Optional:** Move to Firestore anytime
- Follow [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)
- Copy [FIRESTORE_LOGIN.js](FIRESTORE_LOGIN.js) to login.js
- Done!

**Your choice:** Local for dev, Firestore for production 🎉
