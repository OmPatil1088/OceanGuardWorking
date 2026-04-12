# User Accounts & Admin Setup

## Overview
Your system now has a configuration-based admin management system. All admin and user accounts are defined in [config.json](config.json).

---

## 👑 Admin Accounts (Full Access)

### Admin #1 - Primary Admin
```
Email: admin@oceanguard.gov.in
Password: admin123
Name: Admin User
Access: Full (view, edit, delete all cases)
```

### Admin #2 - Admin Officer
```
Email: admin@example.com
Password: admin123
Name: Admin Officer
Access: Full (view, edit, delete all cases)
```

**To add more admins:** Edit [config.json](config.json) and add to `adminEmails` array.

---

## 👤 Regular User Accounts (Limited Access)

### User #1
```
Email: user@example.com
Password: user123
Name: Regular User
Access: Report cases & vote/verify (no edit/delete)
```

### User #2
```
Email: john@example.com
Password: john123
Name: John Doe
Access: Report cases & vote/verify (no edit/delete)
```

### User #3
```
Email: sarah@example.com
Password: sarah123
Name: Sarah Smith
Access: Report cases & vote/verify (no edit/delete)
```

---

## 🔧 How It Works

### Configuration File: [config.json](config.json)
```json
{
  "adminEmails": [
    "admin@oceanguard.gov.in",
    "admin@example.com"
  ],
  "testUsers": {
    "admins": [...],
    "regularUsers": [...]
  }
}
```

### Login Process
1. User enters email and password
2. [login.js](login.js) loads [config.json](config.json)
3. Checks if email is in `adminEmails` array
4. If yes → Sets role to `admin` ✅
5. If no → Sets role to `user` ✅
6. Redirects to dashboard with role

---

## 🛠️ How to Manage Admins

### Add New Admin
1. Open [config.json](config.json)
2. Find the `adminEmails` array
3. Add the email:

```json
"adminEmails": [
  "admin@oceanguard.gov.in",
  "admin@example.com",
  "newemail@email.com"    ← Add here
]
```

4. Save the file
5. User can now login with that email and get admin role

### Remove Admin
1. Open [config.json](config.json)
2. Find and remove the email from `adminEmails`
3. Save the file
4. That user is now a regular user on next login

### Example: Make Someone an Admin
```json
// Before:
"adminEmails": [
  "admin@oceanguard.gov.in",
  "admin@example.com"
]

// After (added john@example.com):
"adminEmails": [
  "admin@oceanguard.gov.in",
  "admin@example.com",
  "john@example.com"
]
```

Now when john@example.com logs in, they get admin access! 👑

---

## ✅ Testing Different Roles

### Test as Regular User
```
1. Go to index.html
2. Login with: user@example.com / user123
3. You'll see:
   ✅ Can report cases
   ✅ Can vote on cases
   ❌ NO Edit button
   ❌ NO Delete button
```

### Test as Admin User
```
1. Go to index.html
2. Login with: admin@oceanguard.gov.in / admin123
3. You'll see:
   ✅ Can report cases
   ✅ Can vote on cases
   ✅ EDIT button (pencil icon)
   ✅ DELETE button (trash icon)
   ✅ "👑 ADMIN" badge in header
```

---

## 📋 Current Setup Status

```
✅ Configuration-based admin system
✅ Multiple admin support
✅ Auto role assignment based on config
✅ Easy to add/remove admins
✅ Test accounts ready
✅ Firebase authentication
✅ Role-based access control
```

---

## 🔐 Session Storage After Login

Each user's session stores:
```javascript
sessionStorage.getItem('isLoggedIn')    // 'true'
sessionStorage.getItem('username')       // 'admin@oceanguard.gov.in'
sessionStorage.getItem('userRole')       // 'admin' or 'user'
sessionStorage.getItem('isAdmin')        // 'true' or 'false'
```

When user logs out, all of these are cleared.

---

## 🚀 Best Practices

### For Development
✅ Use [config.json](config.json) to manage test accounts
✅ Keep it in version control
✅ Add comments when creating special accounts

### For Production
❌ **DO NOT** hardcode admin emails in code
✅ **DO** Store admin users in a database
✅ **DO** Have an admin panel to manage users
✅ **DO** Verify roles server-side, not client-side
✅ **DO** Use JWT tokens or sessions

Example production approach:
```javascript
// Backend validates each request:
const user = await database.getUser(email);
if (user.role !== 'admin') {
    return error('Unauthorized');
}
// Allow admin action
```

---

## 📝 File Locations

- **[config.json](config.json)** - Admin & user configuration
- **[login.js](login.js)** - Load config & assign roles
- **[dashboard.js](dashboard.js)** - Enforce authorization
- **[index.html](index.html)** - Login page

---

## 🆘 Troubleshooting

### "Config not loading" error in console
**Solution:**
- Make sure [config.json](config.json) exists in same folder as [index.html](index.html)
- Reload page
- Check browser console for fetch errors

### User should be admin but isn't
**Solution:**
1. Check [config.json](config.json) - is email in `adminEmails`?
2. Check spelling exactly matches
3. Clear browser cache: Ctrl+Shift+Delete
4. Logout and login again

### Want to make a user an admin?
**Solution:**
1. Edit [config.json](config.json)
2. Add their email to `adminEmails` array
3. They get admin role on next login!

---

## 📞 Quick Commands

**Validate config syntax:**
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
```

**Check admin emails:**
Open browser console and type:
```javascript
fetch('config.json').then(r => r.json()).then(c => console.log(c.adminEmails))
```

---

**Your admin system is now ready! 🎉**

Login with any account from the list above to test different roles.
