# 👥 User Management Guide

## Quick Commands

### List All Users
```bash
node list-users.js
```

### Delete a User
```bash
node delete-user.js priyanshug.cs.25@nitj.ac.in
```

---

## 📊 User Data Structure

When you login with Google, this data is stored in MongoDB:

```javascript
{
  _id: "507f1f77bcf86cd799439011",
  name: "Your Name",
  email: "priyanshug.cs.25@nitj.ac.in",
  collegeId: "PRIYANSHUG123",
  password: "google-oauth-randomstring", // Random password
  role: "student",
  googleId: "1234567890", // Your Google ID
  avatar: "https://lh3.googleusercontent.com/...", // Google profile pic
  emailVerified: false, // Initially false, true after OTP verification
  isActive: true,
  approvalStatus: "approved",
  createdAt: "2026-02-26T...",
  updatedAt: "2026-02-26T..."
}
```

---

## 🗑️ How to Delete Your User Data

### Option 1: Using Scripts (Recommended)

**Step 1: List all users**
```bash
node list-users.js
```

Output:
```
✅ Connected to MongoDB

📋 Total Users: 1

================================================================================

1. Your Name
   Email: priyanshug.cs.25@nitj.ac.in
   College ID: PRIYANSHUG123
   Role: student
   Email Verified: ❌
   Google Login: ✅
   Approval Status: approved
   Active: ✅
   Created: 2/26/2026, 10:30:00 AM

================================================================================

To delete a user, run: node delete-user.js <email>
```

**Step 2: Delete specific user**
```bash
node delete-user.js priyanshug.cs.25@nitj.ac.in
```

Output:
```
✅ Connected to MongoDB

📋 User Details:
Name: Your Name
Email: priyanshug.cs.25@nitj.ac.in
College ID: PRIYANSHUG123
Role: student
Email Verified: false
Google ID: 1234567890

✅ User deleted successfully!
```

---

### Option 2: Using MongoDB Compass (GUI)

**Step 1: Install MongoDB Compass**
- Download: https://www.mongodb.com/try/download/compass
- Install and open

**Step 2: Connect**
1. Copy your MongoDB URI from `.env` file
2. Paste in MongoDB Compass
3. Click "Connect"

**Step 3: Navigate**
1. Database: `hostel_management`
2. Collection: `users`

**Step 4: Find Your User**
- Search by email: `{ "email": "priyanshug.cs.25@nitj.ac.in" }`
- Or browse the list

**Step 5: Delete**
- Click trash icon next to your user
- Confirm deletion

---

### Option 3: Using MongoDB Atlas Website

**Step 1: Login**
- Go to: https://cloud.mongodb.com/
- Login with your account

**Step 2: Browse Collections**
1. Select your cluster
2. Click "Browse Collections"
3. Database: `hostel_management`
4. Collection: `users`

**Step 3: Delete**
1. Find your user
2. Click trash icon
3. Confirm

---

## 🔍 Finding Users by Different Criteria

### Find by Email
```bash
node delete-user.js email@nitj.ac.in
```

### Find by Google ID (Manual)
In MongoDB Compass, search:
```json
{ "googleId": "1234567890" }
```

### Find Unverified Users
In MongoDB Compass, search:
```json
{ "emailVerified": false }
```

### Find Google Login Users
In MongoDB Compass, search:
```json
{ "googleId": { "$exists": true } }
```

---

## 📍 Database Location

### Local Development:
- Database: `hostel_management`
- Collection: `users`
- Connection: Check `.env` file for `MONGODB_URI`

### Production (Render):
- Same database structure
- Connection string in Render environment variables
- Access via MongoDB Atlas

---

## ⚠️ Important Notes

### Before Deleting:
- ✅ Make sure you have the correct email
- ✅ Backup data if needed
- ✅ Understand this is permanent

### After Deleting:
- ❌ User cannot login anymore
- ❌ All user data is removed
- ✅ Can register again with same email
- ✅ Will need to verify email again

### What Gets Deleted:
- ✅ User account
- ✅ Email verification status
- ✅ Google OAuth link
- ✅ All user profile data

### What Doesn't Get Deleted:
- Related data in other collections (complaints, bills, etc.)
- You may need to clean those separately

---

## 🛠️ Troubleshooting

### "User not found"
- Check email spelling
- Email is case-insensitive
- Make sure user exists (run `list-users.js`)

### "Cannot connect to MongoDB"
- Check `.env` file has correct `MONGODB_URI`
- Check internet connection
- Verify MongoDB Atlas is accessible

### "Permission denied"
- Check MongoDB user has delete permissions
- Verify connection string is correct

---

## 🔄 Clean Start (Delete All Users)

**⚠️ WARNING: This deletes ALL users!**

Create `delete-all-users.js`:
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const deleteAllUsers = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await User.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} users`);
    process.exit(0);
};

deleteAllUsers();
```

Run:
```bash
node delete-all-users.js
```

---

## 📝 Quick Reference

| Task | Command |
|------|---------|
| List all users | `node list-users.js` |
| Delete specific user | `node delete-user.js email@nitj.ac.in` |
| View in GUI | Use MongoDB Compass |
| View online | MongoDB Atlas website |

---

## 🎯 Common Scenarios

### Scenario 1: Testing Google Login
```bash
# Login with Google
# Test features
# Delete test user
node delete-user.js test@nitj.ac.in
# Login again to test fresh registration
```

### Scenario 2: Reset Email Verification
```bash
# Delete user
node delete-user.js user@nitj.ac.in
# Register again
# New OTP will be sent
```

### Scenario 3: Clean Database for Production
```bash
# List all test users
node list-users.js
# Delete each test user
node delete-user.js test1@nitj.ac.in
node delete-user.js test2@nitj.ac.in
```

---

## ✅ Best Practices

1. **Always list users first** before deleting
2. **Double-check email** before deletion
3. **Backup important data** if needed
4. **Test in development** before production
5. **Document deletions** for audit trail

---

## 🚀 Quick Start

```bash
# 1. List all users
node list-users.js

# 2. Find your email in the list

# 3. Delete your user
node delete-user.js your-email@nitj.ac.in

# 4. Verify deletion
node list-users.js
```

**Done!** Your user data is deleted from the database. 🎉
