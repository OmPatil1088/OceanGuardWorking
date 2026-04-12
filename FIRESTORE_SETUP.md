# Setup: User Accounts in Firebase Firestore

## Why Firebase Firestore?

✅ Store users & roles **online**  
✅ Easy to manage via **Firebase Console**  
✅ No need to edit code to add/remove admins  
✅ **More secure** (server-side)  
✅ **Automatic backups**  
✅ **Free tier** covers small apps  

---

## 📋 Step 1: Create Firestore Database

### 1.1 Go to Firebase Console
```
https://console.firebase.google.com/
```

### 1.2 Select Your Project
```
Project: disaster-ai-240b7
```

### 1.3 Create Firestore Database
```
Left Menu → Firestore Database → Create Database
- Region: us-central1 (or nearest to you)
- Security Rules: Start in Production mode
- Click "Create"
```

---

## 🗂️ Step 2: Create Users Collection

### 2.1 Add Collection
```
Click "Start Collection"
Collection ID: users
Click "Next"
```

### 2.2 Add First Document (Admin)
```
Document ID: admin@oceanguard.gov.in
Add Fields:

Field Name          | Type      | Value
--------------------|-----------|----------------------------------
email               | string    | admin@oceanguard.gov.in
role                | string    | admin
name                | string    | Admin User
password            | string    | (Firebase handles this)
createdAt           | timestamp | (auto)
```

Click "Save"

### 2.3 Add Second Document (Another Admin)
```
Document ID: admin@example.com
Add Fields:

Field Name          | Type      | Value
--------------------|-----------|----------------------------------
email               | string    | admin@example.com
role                | string    | admin
name                | string    | Admin Officer
createdAt           | timestamp | (auto)
```

Click "Save"

### 2.4 Add Regular User Documents
```
Document ID: user@example.com
Fields:
- email: user@example.com
- role: user
- name: Regular User

Document ID: john@example.com
Fields:
- email: john@example.com
- role: user
- name: John Doe

Document ID: sarah@example.com
Fields:
- email: sarah@example.com
- role: user
- name: Sarah Smith
```

---

## 🔐 Step 3: Security Rules

### 3.1 Go to Security Rules
```
Firestore Database → Rules Tab
```

### 3.2 Replace With This:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading user documents
    match /users/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == 'ADMIN_UID';
    }
  }
}
```

Click "Publish"

---

## 💻 Step 4: Update Code

### 4.1 Update login.js

Add Firestore import at the top:
```javascript
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const db = getFirestore(app);
```

### 4.2 Update handleLoginSubmit Function

Add this before Firebase auth:
```javascript
// Fetch user role from Firestore
async function getUserRole(email) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log('User not found in Firestore, defaulting to user role');
            return 'user';  // Default to user if not found
        }
        
        const userDoc = querySnapshot.docs[0];
        return userDoc.data().role || 'user';
    } catch (error) {
        console.error('Error fetching user role:', error);
        return 'user';  // Default to user on error
    }
}
```

### 4.3 Update Login Handler

Replace this section:
```javascript
// OLD:
const isAdmin = email === 'admin@oceanguard.gov.in';
const userRole = isAdmin ? 'admin' : 'user';
```

With this:
```javascript
// NEW: Fetch from Firestore
const userRole = await getUserRole(email);
const isAdmin = userRole === 'admin';
```

---

## ✅ Step 5: Test It

### 5.1 Login with Admin Account
```
Email: admin@oceanguard.gov.in
Password: any password
Expected: See "👑 ADMIN" badge
```

### 5.2 Login with User Account
```
Email: user@example.com
Password: any password
Expected: NO admin badge
```

---

## 🎯 To Add New Admin (From Firebase Console)

### No Code Changes Needed! Just:

1. **Firebase Console** → Firestore Database
2. **Collection: users**
3. **Add Document**
4. **Document ID:** newemail@example.com
5. **Fields:**
   - email: newemail@example.com
   - role: **admin**
   - name: New Admin

6. **Save** → Done!

Next time they login, they're an admin! 👑

---

## 🎯 To Remove Admin (From Firebase Console)

1. Firebase Console → Firestore Database
2. Find the user document
3. Click delete icon
4. Confirm
5. Done! They're no longer admin on next login.

---

## Comparison: Local vs Firebase

### Before (config.json - Local)
```
❌ Can only change by editing code
❌ Need to save file
❌ Need to redeploy
❌ Less secure
✅ Works offline
```

### After (Firestore - Online)
```
✅ Change instantly in Firebase Console
✅ No code changes needed
✅ No redeploy needed
✅ More secure
✅ Centralized database
```

---

## Complete Updated login.js (Firestore Version)

See the file: [FIRESTORE_LOGIN.js](FIRESTORE_LOGIN.js) for the complete updated code.

---

## 📊 Firestore Data Structure

```
users/
├── admin@oceanguard.gov.in
│   ├── email: "admin@oceanguard.gov.in"
│   ├── role: "admin"
│   ├── name: "Admin User"
│   └── createdAt: 2026-04-11
│
├── admin@example.com
│   ├── email: "admin@example.com"
│   ├── role: "admin"
│   ├── name: "Admin Officer"
│   └── createdAt: 2026-04-11
│
├── user@example.com
│   ├── email: "user@example.com"
│   ├── role: "user"
│   ├── name: "Regular User"
│   └── createdAt: 2026-04-11
│
└── john@example.com
    ├── email: "john@example.com"
    ├── role: "user"
    ├── name: "John Doe"
    └── createdAt: 2026-04-11
```

---

## 🔄 Keep Local Config.json Too?

**Option 1: Use Firestore (Recommended)**
- Delete config.json
- Manage everything in Firebase Console
- More secure, more scalable

**Option 2: Fallback System**
- Keep config.json as backup
- Try Firestore first
- If fails, use local config.json
- Best of both worlds

---

## 🆘 Troubleshooting

### "User not found" error
**Solution:**
- Check Firestore Console → users collection
- Make sure user document exists with that email
- Check spelling exactly matches

### Role not updating
**Solution:**
- Refresh browser
- Clear cache: Ctrl+Shift+Delete
- Login again

### Permission denied error
**Solution:**
- Check Security Rules in Firestore
- Make sure reads are allowed for authenticated users

---

## 🚀 Next: Create Admin Panel

Once you have Firestore setup, you could add:
```
Admin Panel to:
- View all users
- Add/remove admins
- Change user roles
- Delete user accounts
- View login history
```

Want me to help build that? 🎨

---

## Summary

✨ **Your users & admins are now stored ONLINE in Firebase!**

- Manage users via Firebase Console
- No code changes needed to add/remove admins
- More secure and scalable
- Ready for production

---

**Next Steps:**
1. ✅ Create Firestore collection "users"
2. ✅ Add admin & user documents
3. ✅ Update login.js with Firestore code
4. ✅ Test login
5. ✅ Manage users from Firebase Console

