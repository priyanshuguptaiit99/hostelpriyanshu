# 🔍 Google Authentication Debugging Guide

## Current Issues

Based on your error logs, here are the problems:

### 1. **Google Login Creates User But Email Not Verified**
- When you login with Google, a user account IS created in the database
- However, the account requires email verification (OTP)
- The system tries to send OTP but email service fails (500 error)
- This blocks you from logging in

### 2. **Email Service Not Configured**
- The error `Failed to send OTP email` means your email service isn't working
- You need to configure Gmail SMTP in your Render environment variables

### 3. **User Data IS Being Stored**
- Your user data IS in the database at: `hostel_management` database → `users` collection
- The user has: name, email, collegeId, googleId, avatar, emailVerified=false

---

## ✅ Solution Steps

### Step 1: Check If Your User Exists in Database

Run this command on your local machine (make sure you have the code):

```bash
node list-users.js
```

This will show all users including your Google login. You should see:
- Email: priyanshug.cs.25@nitj.ac.in
- Email Verified: ❌
- Google Login: ✅

### Step 2: Configure Email Service in Render

Go to your Render dashboard and add these environment variables:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=priyanshuguptaiitian9696@gmail.com
EMAIL_PASS=wtawvlkxlcmbtogw
```

**Important:** After adding these, click "Save Changes" and Render will automatically redeploy your app.

### Step 3: Test Google Login Again

1. Go to your app: https://hostel-management-system-hqg0.onrender.com
2. Click "Sign in with Google"
3. Choose your college email: priyanshug.cs.25@nitj.ac.in
4. This time, the OTP should be sent successfully to your email
5. Check your email inbox for the 6-digit OTP
6. Enter the OTP to verify your email
7. Now you can login!

### Step 4: If You Want to Start Fresh (Delete Your Account)

If you want to delete your existing account and start over:

```bash
node delete-user.js priyanshug.cs.25@nitj.ac.in
```

This will completely remove your account from the database.

---

## 🔧 Alternative: Manually Verify Your Email in Database

If you can't get email working, you can manually verify your email in MongoDB:

### Option A: Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your database
3. Go to `hostel_management` → `users` collection
4. Find your user (email: priyanshug.cs.25@nitj.ac.in)
5. Edit the document and set: `emailVerified: true`
6. Save changes
7. Now you can login!

### Option B: Using MongoDB Shell
```javascript
use hostel_management
db.users.updateOne(
  { email: "priyanshug.cs.25@nitj.ac.in" },
  { $set: { emailVerified: true } }
)
```

### Option C: Create a Script (I'll create this for you)
Run: `node verify-email-manually.js priyanshug.cs.25@nitj.ac.in`

---

## 📊 Understanding Your User Data

When you login with Google, this data is stored:

```javascript
{
  _id: ObjectId("..."),
  name: "Your Name from Google",
  email: "priyanshug.cs.25@nitj.ac.in",
  collegeId: "PRIYANSHUG1234", // Auto-generated
  password: "google-oauth-xxxxx", // Random password
  role: "student",
  googleId: "1234567890", // Your Google ID
  avatar: "https://lh3.googleusercontent.com/...", // Your Google photo
  emailVerified: false, // ❌ This is why you can't login
  isActive: true,
  approvalStatus: "approved",
  createdAt: "2026-02-26T...",
  updatedAt: "2026-02-26T..."
}
```

The ONLY thing blocking you is `emailVerified: false`.

---

## 🗑️ How to Delete Your Account

### After Logout (New Feature - I'll add this)
1. Logout from the dashboard
2. On the login page, click "Delete My Account"
3. Enter your email
4. Confirm deletion
5. Your account will be permanently deleted

### Using Command Line
```bash
node delete-user.js priyanshug.cs.25@nitj.ac.in
```

---

## 🐛 Why Google Auth Shows Error

The error sequence:
1. ✅ Google OAuth successful → User created in database
2. ❌ Email service fails → OTP not sent
3. ❌ User tries to login → Blocked because email not verified
4. ❌ System tries to send OTP again → Email service still fails (500 error)

**Root Cause:** Email service not configured in Render environment variables.

**Fix:** Add EMAIL_* variables in Render dashboard (see Step 2 above).

---

## 📝 Next Steps

1. **Immediate Fix:** Configure email service in Render (Step 2)
2. **Alternative:** Manually verify your email in database (see above)
3. **Long Term:** I'll add a "Delete My Account" feature for users
4. **Testing:** After email is configured, test the full flow again

---

## 🆘 Still Having Issues?

If you're still stuck:

1. Check Render logs for errors: Dashboard → Logs
2. Verify environment variables are set: Dashboard → Environment
3. Make sure MongoDB connection is working
4. Try deleting your account and registering fresh
5. Check your email spam folder for OTP emails

---

## ✅ Success Checklist

- [ ] Email service configured in Render
- [ ] User exists in database (run list-users.js)
- [ ] Email verified (either via OTP or manually)
- [ ] Can login successfully
- [ ] Dashboard loads correctly

Once all checkboxes are ✅, your Google authentication will work perfectly!
