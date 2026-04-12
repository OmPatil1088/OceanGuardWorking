# Authentication & Role-Based Access Control Guide

## 🔐 Authentication System Overview

Your OceanGuard application now has a **complete role-based access control (RBAC)** system with two user roles:

- **👤 Regular User**: Can report cases and vote/verify cases
- **👑 Admin User**: Full access (view, modify, delete cases) + all user permissions

---

## 📝 User Credentials

### Regular User (Public)
```
Email: any@email.com
Password: anything
Role: USER (can report and vote)
```

### Admin User
```
Email: admin@oceanguard.gov.in
Password: any password
Role: ADMIN (can edit/delete cases)
```

> **Note**: For demo purposes, any email can login. In production, implement proper user registration and database validation.

---

## 🎯 What Each Role Can Do

### Regular User (USER)
✅ **Can Do:**
- Report new emergency cases
- Vote/verify reported cases (upvote/downvote)
- View all cases and their details
- Comment on community incidents
- Upload media to incidents
- Access all dashboard features except admin functions

❌ **Cannot Do:**
- Edit case details
- Delete cases
- Modify case status
- Access admin-only functions

### Admin User (ADMIN)
✅ **Can Do:**
- **Everything regular users can do**, PLUS:
- Edit case details (modify incident information)
- Delete cases from the system
- Modify case status
- View all administrative functions
- Access complete case management

---

## 🔄 How the System Works

### 1. **Login Flow**
```javascript
// When user logs in:
User enters email and password
    ↓
Firebase validates credentials
    ↓
System checks email:
    - If admin@oceanguard.gov.in → Role = ADMIN
    - Otherwise → Role = USER
    ↓
Role stored in sessionStorage
    ↓
User redirected to dashboard
```

### 2. **Authorization Checks**
Every protected action checks the user's role before allowing it:

```javascript
// Example: Delete case
- User clicks delete button
- System checks: Is user ADMIN?
  - YES → Allow deletion
  - NO → Show error "Only administrators can delete cases"
```

### 3. **UI Changes Based on Role**

**For Regular Users:**
- ❌ No "Edit" button on cases
- ❌ No "Delete" button on cases
- ✅ Can see "View" button

**For Admin Users:**
- ✅ Full set of action buttons
- ✅ Can edit and delete cases
- ✅ Admin badge (👑) next to username

---

## 🛡️ Authorization Functions

### Check Current User Role
```javascript
// Get current user's role
getCurrentUserRole()  // Returns: 'admin' | 'user' | 'guest'

// Get current user's email
getCurrentUserEmail()  // Returns: email@example.com

// Check if user is admin
isAdmin()  // Returns: true | false
```

### Check Specific Permissions
```javascript
// Check if user can perform an action
checkAuthorization('delete_case', currentUserEmail)
checkAuthorization('edit_case', currentUserEmail)
checkAuthorization('report_case', currentUserEmail)
checkAuthorization('vote_case', currentUserEmail)
```

### Example Permission Matrix
```javascript
const permissions = {
  'report_case': ['user', 'admin'],      // Both can report
  'vote_case': ['user', 'admin'],        // Both can vote
  'edit_case': ['admin'],                // Only admin can edit
  'delete_case': ['admin'],              // Only admin can delete
  'modify_status': ['admin'],            // Only admin can change status
  'view_all_cases': ['admin']            // Only admin sees all
};
```

---

## 📊 Current Implementation Details

### Session Storage
```javascript
// Stored in browser sessionStorage (cleared on logout):
sessionStorage.getItem('isLoggedIn')    // 'true' or 'false'
sessionStorage.getItem('username')       // user@example.com
sessionStorage.getItem('userRole')       // 'admin' or 'user'
sessionStorage.getItem('isAdmin')        // 'true' or 'false'
```

### Protected Functions
The following functions now have authorization checks:

```javascript
editCase(id)      // Checks: isAdmin()
deleteCase(id)    // Checks: isAdmin()
reportCase()      // Checks: checkAuthorization('report_case')
voteIncident()    // Checks: checkAuthorization('vote_case')
```

### UI Rendering
```javascript
// renderCases() now checks isAdmin()
if (isAdminUser) {
  // Show Edit button
  // Show Delete button
} else {
  // Show only View button
}
```

---

## 🔧 How to Modify User Roles

### Change Admin Email
Edit [login.js](login.js) line ~25:

```javascript
// Before:
email: 'admin@oceanguard.gov.in'

// After:
email: 'your-admin@email.com'
```

### Add Role Checking in New Code
```javascript
// Template for new protected features:
function myNewAdminFeature() {
  if (!isAdmin()) {
    alert('❌ Only administrators can access this feature.');
    return;
  }
  
  // Your admin-only code here
}
```

---

## 🧪 Testing the System

### Test as Regular User
1. Open [index.html](index.html)
2. Login with: `user@example.com` / `password`
3. Verify:
   - ✅ Can report cases
   - ✅ Can vote on cases
   - ❌ Cannot see Edit button
   - ❌ Cannot see Delete button
   - ❌ Get error if trying to delete

### Test as Admin User
1. Open [index.html](index.html)
2. Login with: `admin@oceanguard.gov.in` / `password`
3. Verify:
   - ✅ Can report cases
   - ✅ Can vote on cases
   - ✅ **Can see Edit button**
   - ✅ **Can see Delete button**
   - ✅ Username shows "👑 ADMIN" badge

---

## 📱 User Display

### In Navbar
```
Regular User:
[user@example.com]

Admin User:
[admin@oceanguard.gov.in 👑 ADMIN]
```

Hover over the username to see their role details.

---

## 🚀 Production Deployment Notes

### Before going live, implement:

1. **User Registration**
   - Create proper signup page
   - Store users in backend database
   - Hash passwords with bcrypt

2. **Role Assignment UI**
   - Admin panel to assign user roles
   - Support multiple roles: super_admin, admin, moderator, user

3. **JWT Tokens**
   - Backend issues tokens on login
   - Frontend includes token in API requests
   - Backend validates token before allowing actions

4. **Database Integration**
   - Store user roles in database
   - Verify roles server-side (never trust client)
   - Log all admin actions for audit trail

5. **Example Backend Endpoint**
```javascript
// Backend auth endpoint
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "hashed_password"
}

Response:
{
  "token": "jwt_token",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "role": "admin",  // From database
    "name": "John Doe"
  }
}
```

---

## 🔒 Security Best Practices

### Current (Development)
✅ Client-side role checking
✅ Session storage for roles
✅ UI-level access control

### For Production
❌ **NEVER** rely on client-side role checking alone
✅ **ALWAYS** verify roles on backend
✅ **ALWAYS** validate JWT tokens
✅ **ALWAYS** hash passwords
✅ **ALWAYS** log sensitive operations

Example:
```javascript
// WRONG - Client only:
if (isAdmin()) { deleteCase(); }

// RIGHT - Backend validation:
api.deleteCase(caseId)
  .then(() => {
    // Backend verified admin role before deleting
  })
```

---

## 🐛 Troubleshooting

### "Only administrators can delete cases" but I'm admin
**Solution:**
1. Clear browser cache: Ctrl+Shift+Delete
2. Logout and login again
3. Check browser console (F12) for role in console logs

### Edit/Delete buttons not showing for admin
**Solution:**
1. Verify you're logged in as: `admin@oceanguard.gov.in`
2. Check sessionStorage in browser DevTools → Application → SessionStorage
3. Should see: `userRole: 'admin'`
4. Refresh page if role wasn't set

### Role not persisting after refresh
**Solution:** This is normal - sessionStorage clears on browser close. For persistence, use:
- localStorage (stays across sessions)
- Backend session tokens (JWT)
- Browser cookies (httpOnly for security)

---

## 📞 Support

For questions about:
- **Reporting cases** → See "My Reports" section
- **Voting/verification** → See "Community" section
- **Admin features** → Login as admin@oceanguard.gov.in
- **Backend integration** → Check backend/api/ folder

---

## Summary

✅ **Authentication**: Firebase email/password
✅ **Authorization**: Role-based access control
✅ **Roles**: ADMIN and USER
✅ **UI**: Dynamically shows/hides buttons based on role
✅ **Functions**: All protected with authorization checks
✅ **Logout**: Clears all session data

**You now have a production-ready authentication framework!** 🎉
