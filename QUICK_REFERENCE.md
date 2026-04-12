# 🚀 Quick Reference: Admin & User Accounts

## Test Accounts (Copy & Paste)

### 👑 ADMIN ACCOUNTS

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@oceanguard.gov.in` | `admin123` | Admin | Full (view, edit, delete) |
| `admin@example.com` | `admin123` | Admin | Full (view, edit, delete) |

**What Admins Can Do:**
- ✅ Report emergency cases
- ✅ Vote/verify cases
- ✅ **Edit case details** (pencil icon)
- ✅ **Delete cases** (trash icon)
- ✅ See "👑 ADMIN" badge
- ✅ See all admin buttons

---

### 👤 REGULAR USER ACCOUNTS

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `user@example.com` | `user123` | User | Report & Vote only |
| `john@example.com` | `john123` | User | Report & Vote only |
| `sarah@example.com` | `sarah123` | User | Report & Vote only |

**What Regular Users Can Do:**
- ✅ Report emergency cases
- ✅ Vote/verify cases
- ✅ View cases
- ✅ Comment on incidents
- ❌ NO edit button
- ❌ NO delete button
- ❌ NO admin badge

---

## How to Add More Admins

**Step 1:** Open [config.json](config.json)

**Step 2:** Find the `adminEmails` section:
```json
"adminEmails": [
  "admin@oceanguard.gov.in",
  "admin@example.com"
]
```

**Step 3:** Add new email:
```json
"adminEmails": [
  "admin@oceanguard.gov.in",
  "admin@example.com",
  "your-email@example.com"
]
```

**Step 4:** Save & done! They're now an admin.

---

## How to Add More Regular Users

**Step 1:** Open [config.json](config.json)

**Step 2:** Find `regularUsers` section

**Step 3:** Add new user:
```json
"regularUsers": [
  {
    "email": "new-user@example.com",
    "password": "password123",
    "name": "New User",
    "role": "user"
  }
]
```

**Step 4:** Save & done! (Note: They can use ANY email/password to login via Firebase)

---

## Quick Test Scenarios

### Scenario 1: Login as Regular User
```
1. Go to index.html
2. Email: user@example.com
3. Password: user123
4. Result: Can report & vote, NO edit/delete buttons
```

### Scenario 2: Login as Admin
```
1. Go to index.html
2. Email: admin@oceanguard.gov.in
3. Password: admin123
4. Result: Can edit/delete cases, sees "👑 ADMIN" badge
```

### Scenario 3: Promote User to Admin
```
1. Edit config.json
2. Add user@example.com to adminEmails
3. User logs in → Now has admin access!
```

---

## Configuration File Path

**Location:** [f:\Documents\Github1\OceanGuardWorking\config.json](config.json)

**Structure:**
```json
{
  "adminEmails": ["email1", "email2"],
  "testUsers": {
    "admins": [{...}],
    "regularUsers": [{...}]
  }
}
```

---

## What Changed in Code

- ✅ [login.js](login.js) - Now reads from config.json
- ✅ [config.json](config.json) - New file with admin list
- ✅ No changes needed to [dashboard.js](dashboard.js)
- ✅ All syntax validated ✅

---

## Role Assignment Rules

| Email | In adminEmails? | Role | Buttons |
|-------|-----------------|------|---------|
| admin@oceanguard.gov.in | Yes | Admin | View, Edit, Delete |
| admin@example.com | Yes | Admin | View, Edit, Delete |
| user@example.com | No | User | View only |
| john@example.com | No | User | View only |
| any-other@email.com | No | User | View only |

---

## Keyboard Shortcut

**Copy Admin Email:**
```
admin@oceanguard.gov.in / admin123
```

**Copy User Email:**
```
user@example.com / user123
```

---

**Ready to test? Pick an account from above and login! 🎉**
