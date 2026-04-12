# Migration: From config.json to Firestore

## 📊 Before & After

### Before (config.json - Local)
```
config.json
├── adminEmails
├── testUsers
└── testUsers.regularUsers
```

**Setup:** Edit JSON file  
**Update Speed:** Slow (need to redeploy)  
**Security:** Low (data in code)  

---

### After (Firestore - Online)
```
Firebase Console
└── Firestore Database
    └── users (collection)
        ├── admin@oceanguard.gov.in (document)
        ├── user@example.com (document)
        └── ...
```

**Setup:** Click in Firebase Console  
**Update Speed:** Instant  
**Security:** High (server-side)  

---

## 🔄 Step-by-Step Migration

### Step 1: Create Firestore Collection (5 min)

See [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) - I'll wait while you setup.

### Step 2: Add Users to Firestore (5 min)

Copy your existing users from [config.json](config.json) to Firestore:

**From config.json:**
```json
"admins": [
  {
    "email": "admin@oceanguard.gov.in",
    "name": "Admin User"
  },
  {
    "email": "admin@example.com",
    "name": "Admin Officer"
  }
]
```

**To Firestore:**
```
Document 1:
- ID: admin@oceanguard.gov.in
- email: admin@oceanguard.gov.in
- role: admin        ← Add this
- name: Admin User

Document 2:
- ID: admin@example.com
- email: admin@example.com
- role: admin        ← Add this
- name: Admin Officer
```

**From config.json:**
```json
"regularUsers": [
  {
    "email": "user@example.com",
    "name": "Regular User"
  },
  {
    "email": "john@example.com",
    "name": "John Doe"
  }
]
```

**To Firestore:**
```
Document 3:
- ID: user@example.com
- email: user@example.com
- role: user         ← Add this
- name: Regular User

Document 4:
- ID: john@example.com
- email: john@example.com
- role: user         ← Add this
- name: John Doe
```

### Step 3: Update login.js

**Replace:**
```bash
cp login.js login.js.backup
cp FIRESTORE_LOGIN.js login.js
```

**Or manually:**

Replace your current [login.js](login.js) with [FIRESTORE_LOGIN.js](FIRESTORE_LOGIN.js) code.

Key differences:
```javascript
// OLD (config.json):
const isAdmin = adminConfiguration.adminEmails.includes(email);

// NEW (Firestore):
const userRole = await getUserRole(email);
const isAdmin = userRole === 'admin';
```

### Step 4: Test

```
1. Go to index.html
2. Login with admin@oceanguard.gov.in
3. Check browser console:
   ✅ "User role from Firestore: admin@oceanguard.gov.in → admin"
4. Should see "👑 ADMIN" badge
```

### Step 5: Keep config.json as Backup

Don't delete [config.json](config.json)!

New login.js uses **hybrid approach:**
```
Try Firestore FIRST
└─ If fails, fallback to config.json
```

This means:
✅ If Firestore is down, app still works
✅ Development works offline
✅ Production uses Firestore

---

## 🛠️ Detailed Migration Guide

### Option A: Manual Migration (Safest)

1. **Backup Old Setup**
   ```bash
   cp login.js login.js.firestore-ready.backup
   cp config.json config.json.backup
   ```

2. **Create Firestore Collection**
   - Firebase Console → Firestore Database
   - Create collection: `users`

3. **Add Each User Manually**
   - Firebase Console → users collection
   - Click "Add Document"
   - Fill in fields matching config.json
   - Click Save
   - Repeat for each user

4. **Update Code**
   - Open [FIRESTORE_LOGIN.js](FIRESTORE_LOGIN.js)
   - Copy all content
   - Paste into [login.js](login.js)
   - Save

5. **Test**
   - Try login with different accounts
   - Check console for Firestore messages

---

### Option B: Bulk Upload Script (Faster)

Create a one-time migration script:

```javascript
// firestore-import.js (RUN ONCE, then DELETE)

import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCFYKtb_fNUtLA3Yz0Ssx4PoBoKQIQxOM0",
    authDomain: "disaster-ai-240b7.firebaseapp.com",
    projectId: "disaster-ai-240b7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Users to migrate
const usersToAdd = [
    { email: "admin@oceanguard.gov.in", role: "admin", name: "Admin User" },
    { email: "admin@example.com", role: "admin", name: "Admin Officer" },
    { email: "user@example.com", role: "user", name: "Regular User" },
    { email: "john@example.com", role: "user", name: "John Doe" },
    { email: "sarah@example.com", role: "user", name: "Sarah Smith" }
];

async function migrateUsers() {
    for (const user of usersToAdd) {
        try {
            await setDoc(doc(db, "users", user.email), user);
            console.log(`✅ Added: ${user.email}`);
        } catch (error) {
            console.error(`❌ Error adding ${user.email}:`, error);
        }
    }
    console.log("✅ Migration complete!");
}

migrateUsers();
```

**How to use:**
1. Copy this script
2. Run in Firebase Console (Cloud Functions or terminal)
3. All users added automatically
4. Delete the script

---

## ✅ Verification Checklist

After migration, verify:

- [ ] Firestore database created
- [ ] `users` collection exists
- [ ] All users added to Firestore
- [ ] [login.js](login.js) updated
- [ ] Can login as admin
- [ ] Can login as regular user
- [ ] Admin sees "👑 ADMIN" badge
- [ ] Regular user has no admin access
- [ ] Browser console shows Firestore messages
- [ ] config.json kept as backup

---

## 🔄 Rollback (If Needed)

**Want to go back to config.json?**

```bash
# Restore old login.js
cp login.js.backup login.js

# Done - back to config.json mode
```

---

## 🚀 Post-Migration

Once Firestore is live:

### Manage Users from Firebase Console
```
❌ Don't edit code anymore
✅ Click in Firebase Console to add/remove users
```

### Examples

**Add new admin:**
1. Firebase Console → Firestore Database → users
2. Add Document
3. ID: newemail@example.com
4. Fields: email, role=admin, name
5. Save → Done!

**Make user an admin:**
1. Click user document
2. Change role: user → admin
3. Save → Done!

**Remove user:**
1. Click user document
2. Click delete icon
3. Confirm → Done!

---

## 📊 Comparison Table

| Task | config.json | Firestore |
|------|------------|-----------|
| Add admin | Edit JSON + save file | Click console |
| Remove admin | Edit JSON + save file | Click delete |
| Change role | Edit JSON + save file | Click field |
| View users | Open JSON file | Click collection |
| Time to deploy | ~5 minutes | Instant |
| Security | Low | High |
| Scalability | Limited | Unlimited |

---

## 🎯 Common Questions

### Q: Do I have to migrate?
**A:** No. config.json works fine for development. Migrate when going to production.

### Q: Will my app break during migration?
**A:** No. New login.js tries Firestore first, falls back to config.json.

### Q: Can I keep both?
**A:** Yes. New [FIRESTORE_LOGIN.js](FIRESTORE_LOGIN.js) is "hybrid":
- Tries Firestore
- Falls back to config.json if Firestore fails
- Best of both worlds

### Q: What if Firestore is down?
**A:** Falls back to config.json automatically. App keeps working.

### Q: Can I revert?
**A:** Yes. Just restore old login.js backup.

---

## 📝 Migration Timeline

**Development Phase (Now):**
- config.json works
- Testing accounts ready
- No Firestore needed

**Testing Phase:**
- Setup Firestore (parallel)
- Run both together
- Test thoroughly

**Production Phase:**
- Use Firestore as primary
- config.json as fallback
- Manage users from Firebase Console

---

## 🆘 If Something Goes Wrong

### Firestore not loading?
```javascript
// Check console for errors
// login.js will fallback to config.json
// App continues to work
```

### Users can't login?
1. Check Firestore console - users exist?
2. Check email spelling exactly matches
3. Check role field exists
4. Try clearing browser cache

### Want to debug?
```javascript
// Open browser console
// Look for messages:
✅ "User role from Firestore"  = Working!
⚠️  "Falling back to config.json" = Not found in Firestore
❌ "Error fetching from Firestore" = Connection issue
```

---

## Summary

**Migration Path:**
```
config.json (Local)
    ↓
    ↓ [Optional] Run [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)
    ↓
Firestore (Online) + config.json (Backup)
    ↓
Firestore Primary (Production Ready!)
```

**Time Required:** 15-30 minutes  
**Difficulty:** Easy  
**Risk:** Low (can rollback anytime)  

---

**Ready to migrate to Firestore? Start with [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md)! 🚀**
