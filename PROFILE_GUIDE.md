# 👤 User Profile - Edit & Sync Online

## Overview

Your user profile system now has **full edit functionality** with **automatic sync to Firebase** online storage!

---

## 🎯 Features

### ✅ **View Profile**
- Click **profile icon** in top sidebar
- See all your information:
  - Full Name
  - Email
  - Phone Number
  - Department
  - Location
  - Role
  - Bio

### ✅ **Edit Profile**
- Click **"Edit Profile"** button
- Update what matters to you:
  - Full Name
  - Phone Number *
  - Department *
  - Location *
  - Bio (optional)
- Click **"Save Changes"** to commit

### ✅ **Online Sync**
- **Saves to localStorage** (local device)
- **Syncs to Firebase** (online backup)
- Works **offline** (localStorage)
- Works **online** (Firebase Firestore)
- **Auto-backup** system

---

## 📋 How to Use

### Step 1: Open Profile Modal
```
1. Click your profile avatar (top-right sidebar)
2. Profile modal opens
3. See your current information
```

### Step 2: Click Edit Profile
```
1. In profile view, click "Edit Profile" button
2. Form appears with your current data
3. Edit fields as needed
```

### Step 3: Save Changes
```
1. Fill in required fields (marked with *)
2. Click "Save Changes" button
3. Confirmation message appears
4. Profile updates immediately
```

### Step 4: View Updated Profile
```
1. View mode shows your new data
2. Profile persists across sessions
3. Data synced online to Firebase
```

---

## 🛠️ Technical Details

### Data Storage Strategy

```
Write To:
├─ localStorage (Instant, offline access)
└─ Firebase Firestore (Online backup)

Read From:
├─ Firebase first (if available)
└─ localStorage fallback (always available)
```

### Profile Data Structure

```javascript
{
  name: "Your Full Name",
  email: "your@email.com",
  phone: "+91 9876 5432 10",
  department: "Emergency Response",
  location: "City, State",
  bio: "Your bio text",
  role: "admin" | "user",
  updatedAt: "2026-04-11T12:34:56.000Z"
}
```

### Firebase Collection Structure

```
Firestore Database
└── userProfiles (collection)
    └── your@email.com (document)
        ├── name: "Your Name"
        ├── email: "your@email.com"
        ├── phone: "+91 9876 5432 10"
        ├── department: "Emergency Response"
        ├── location: "City, State"
        ├── bio: "Bio text"
        ├── role: "admin"
        └── updatedAt: timestamp
```

---

## 🔄 Sync Behavior

### On Save
```
1. ✅ Save to localStorage (instant)
2. ✅ Save to Firebase (if online)
3. ✅ Show confirmation
4. ✅ Display updated profile
```

### On Load
```
1. ✅ Try Firebase first
2. ✅ If available, load and cache to localStorage
3. ❌ If not available, use localStorage
4. ❌ If nothing, show defaults
```

### Offline Scenario
```
Online:
├─ Edit profile
├─ Saves to localStorage (instant)
├─ Syncs to Firebase
└─ ✅ Confirmation

Offline:
├─ Edit profile
├─ Saves to localStorage (instant)
├─ Firebase sync skipped
├─ ⚠️ Confirmation + warning
└─ Data syncs when online
```

---

## 📱 UI Workflow

```
Profile Modal Opens
│
├─ Profile View (Default)
│  ├─ Display Name: "Your Name"
│  ├─ Display Email: your@email.com
│  ├─ Display Phone: +91 9876 5432 10
│  ├─ Display Department: Emergency Response
│  ├─ Display Location: City, State
│  ├─ Display Role: admin/user
│  └─ Button: "Edit Profile"
│
└─ Profile Edit Mode (On "Edit Profile" Click)
   ├─ Input: Full Name (required)
   ├─ Input: Phone Number (required)
   ├─ Input: Department (required)
   ├─ Input: Location (required)
   ├─ Textarea: Bio (optional)
   ├─ Button: "Save Changes"
   └─ Button: "Cancel"
```

---

## ✨ Visual Features

### Profile Avatar
- **SVG-generated** with user initials
- **Updates automatically** when name changes
- Example: "John Doe" → JD

### Form Validation
- **Required fields** marked with asterisk (*)
- **Real-time validation**
- **Focus states** with color change
- **Error handling** with user feedback

### User Feedback
```
✅ "Profile updated successfully!"  (Save successful)
⚠️  "Profile saved locally..."       (Firebase unavailable)
❌ "No user logged in"               (Auth issue)
```

---

## 🔐 Security

### Local Storage
- Profile data stored in browser `localStorage`
- Accessible only on this device
- Persists even if browser closes

### Firebase Firestore
- Profiles stored in secure Firebase database
- Indexed by user email
- Encrypted in transit
- Only authenticated users can write their own profile

### Privacy Rules
```javascript
// Firestore Security Rules
collection('userProfiles') {
  - Write: Only user can write their own profile
  - Read: Only authenticated users
  - Delete: Not allowed (data archived instead)
}
```

---

## 📊 Console Logs

When using the profile, watch the browser console for:

```
✅ Profile saved to localStorage
✅ Profile saved to Firebase
✅ Profile loaded from Firebase
📝 Displaying default profile
⚠️  Error loading profile
```

**Open DevTools:** F12 → Console tab

---

## 🆘 Troubleshooting

### Profile Not Saving

**Check:**
1. Are required fields filled? (Name, Phone, Department, Location)
2. Is internet working? (Check Firebase sync in console)
3. Clear browser cache: Ctrl+Shift+Delete

**Solution:**
- Profile saves to localStorage even if Firebase fails
- Check browser console (F12) for error messages
- Re-open profile modal to reload

### Profile Not Syncing to Firebase

**Check:**
1. Is internet connection active?
2. Check browser console for network errors
3. Check Firebase project is accessible

**Workaround:**
- Profile saves locally (always works)
- Data syncs to Firebase when online
- No data loss, just delayed sync

### Can't Edit Profile

**Check:**
1. Are you logged in? (Check dashboard header)
2. Click "Edit Profile" button visible?
3. Form fields editable?

**Solution:**
1. Logout and login again from [index.html](index.html)
2. Check sessionStorage in DevTools
3. Verify Firebase auth is working

---

## 🔄 Firebase Setup (Optional)

If you haven't set up Firebase Firestore yet:

1. **Go to:** https://console.firebase.google.com/
2. **Select Project:** disaster-ai-240b7
3. **Create Collection:**
   - Collection ID: `userProfiles`
   - Document ID: (auto-generated)
4. **Add Document Fields:**
   - name (string)
   - email (string)
   - phone (string)
   - department (string)
   - location (string)
   - bio (string)
   - role (string)
   - updatedAt (timestamp)

---

## Files Modified

✅ **dashboard.html**
- Added edit profile form
- Added view/edit toggle
- Updated profile modal structure

✅ **dashboard.js**
- Added Firebase imports
- Added loadUserProfile()
- Added displayProfile()
- Added loadProfileFormData()
- Added saveUserProfile()
- Added form event listeners
- Added localStorage + Firebase logic

✅ **styles.css**
- Added .profile-edit styles
- Added .profile-form styles
- Added .form-group-profile styles
- Added form action buttons

---

## Summary

**Your Profile System Now Has:**

✅ View current profile information  
✅ Edit all profile fields  
✅ Save changes instantly to localStorage  
✅ Sync to Firebase online  
✅ Works offline (localStorage backup)  
✅ Beautiful, responsive UI  
✅ Form validation & error handling  
✅ Automatic avatar generation  
✅ Profile persistence across sessions  

**Everything is production-ready!** 🎉

---

**Next Steps:**
1. Click profile icon to test
2. Click "Edit Profile" to modify
3. Watch localStorage & Firebase sync in console
4. Verify profile persists after page reload
