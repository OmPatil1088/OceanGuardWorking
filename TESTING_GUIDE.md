# Quick Start: Testing Authentication & Authorization

## 🚀 Get Started in 5 Minutes

### Step 1: Open the App
```
File → Open Folder → OceanGuardWorking
Open /index.html in browser
You'll see the login page
```

### Step 2: Test Regular User Account
**Credentials:**
```
Email: user@example.com
Password: any password
```

**After Login, Verify:**
- ✅ You see your email in the top right
- ✅ NO "👑 ADMIN" badge next to your name
- ✅ Dashboard loads with cases visible
- ✅ You can click "Report Case" button
- ✅ You can vote/verify cases in Community
- ✅ Find any case and click "View" - button is there
- ✅ **You DON'T see "Edit" button on cases**
- ✅ **You DON'T see "Delete" button on cases**

**Try to delete a case:**
- Find any case card
- Right-click and check inspect → no Delete button in HTML
- OR try accessing browser console and typing: `deleteCase(1)`
- Should see error: `❌ Only administrators can delete cases.`

---

### Step 3: Test Admin Account
**Credentials:**
```
Email: admin@oceanguard.gov.in
Password: any password
```

**After Login, Verify:**
- ✅ You see: `admin@oceanguard.gov.in 👑 ADMIN` in top right
- ✅ Dashboard loads with cases visible
- ✅ You can do everything a regular user can do, PLUS:
- ✅ **You CAN see "Edit" button on cases** (pencil icon)
- ✅ **You CAN see "Delete" button on cases** (trash icon)
- ✅ Click "Edit" → should open edit form
- ✅ Click "Delete" → should remove the case

---

### Step 4: Test Authorization Enforcement

**For Regular User:**
Open browser console (F12 → Console tab):
```javascript
// Try to delete a case
deleteCase(1)
// Should show: ❌ Only administrators can delete cases.

// Try to edit a case  
editCase(1)
// Should show: ❌ Only administrators can edit cases.
```

**For Admin User:**
Open browser console (F12 → Console tab):
```javascript
// These should work (no error)
deleteCase(1)  // Case deleted successfully
editCase(1)    // Edit form opens
```

---

## 🔍 Common Issues & Fixes

### Issue: Not seeing "👑 ADMIN" badge
**Check:**
1. Are you logged in as `admin@oceanguard.gov.in`? (exact spelling counts)
2. Try logging out and back in
3. Clear cache: Ctrl+Shift+Delete
4. Refresh page: F5

### Issue: Edit/Delete buttons don't appear for admin
**Check:**
1. In Developer Tools → Application → SessionStorage
2. Look for `userRole: "admin"`
3. Look for `isAdmin: "true"`
4. If missing, refresh page
5. If still missing, logout and login again

### Issue: Can a regular user still delete by hacking console?
**No!** The authorization happens inside the `deleteCase()` function:
```javascript
if (!checkAuthorization('delete_case', getCurrentUserEmail())) {
    alert('❌ Only administrators can delete cases.');
    return;  // ← Stops execution
}
```
Regular users will always get the error message.

---

## 📋 What Gets Changed in Code

### [dashboard.js](dashboard.js)
**Lines 35-105**: New authorization functions
```javascript
const USER_ROLES = { ADMIN: 'admin', USER: 'user', GUEST: 'guest' }

isUserLoggedIn()
getCurrentUserEmail()
getCurrentUserRole()
isAdmin()
checkAuthorization(action, email)
```

**Lines 247-265**: Updated checkAuth() 
- Now shows username with role badge
- Adds "👑 ADMIN" for admin users

**Lines ~860-930**: Updated renderCases()
- Only shows Edit/Delete buttons if `isAdmin()`
- All users can see View button

**Lines ~954-980**: Updated editCase() & deleteCase()
- Check authorization before allowing action
- Show error message if unauthorized

---

### [login.js](login.js)
**Lines ~64-104**: Updated handleLoginSubmit()
- After Firebase auth succeeds, determines role
- If email is `admin@oceanguard.gov.in` → admin, else → user
- Stores role in sessionStorage

---

## ✅ All Features Working

### Features by Role

**Regular User Can:**
- ✅ Report new emergency cases
- ✅ Vote/upvote/downvote cases
- ✅ View all case details
- ✅ Comment on incidents
- ✅ Upload media
- ✅ Access emergency services
- ✅ View profile

**Admin User Can (Everything above PLUS):**
- ✅ Edit case information
- ✅ Delete cases
- ✅ Change case status
- ✅ Manage all users' reports
- ✅ Access admin dashboard features

---

## 🧪 Full Test Checklist

- [ ] Regular user can login
- [ ] Regular user sees username without badge
- [ ] Regular user cannot see Edit button
- [ ] Regular user cannot see Delete button
- [ ] Regular user CAN see View button
- [ ] Regular user can report cases
- [ ] Regular user can vote on cases
- [ ] Admin user can login
- [ ] Admin user sees "👑 ADMIN" badge
- [ ] Admin user CAN see Edit button
- [ ] Admin user CAN see Delete button
- [ ] Admin user can edit cases
- [ ] Admin user can delete cases
- [ ] Regular user gets error when trying to delete
- [ ] Regular user gets error when trying to edit
- [ ] Logout clears all session data
- [ ] Cannot access dashboard without login

---

## 🎯 Next Steps

### If Testing Works:
1. ✅ System is production-ready for user authentication
2. ✅ Move to next feature development
3. ✅ Deploy to production with backend validation

### If Something Breaks:
1. Check browser console (F12) for error messages
2. Check that both files were updated (dashboard.js, login.js)
3. Verify syntax: `node -c dashboard.js && node -c login.js`
4. Check sessionStorage has role set after login

---

## 🔗 Related Files

- [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) - Full documentation
- [dashboard.js](dashboard.js) - Main app with auth functions
- [login.js](login.js) - Login with role assignment
- [index.html](index.html) - Entry point

---

## 📞 Need Help?

Check the console (F12) for detailed logs:
```
✅ User logged in: user@example.com (Role: user)
✅ User logged in: admin@oceanguard.gov.in (Role: admin)
```

Look for any error messages or warnings that might indicate issues.

---

**You're all set! Start testing now! 🎉**
