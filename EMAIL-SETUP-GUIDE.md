# 📧 Email Setup Guide for NITJ Hostel Management System

## Quick Setup (5 minutes)

### Step 1: Get Gmail App Password

1. **Go to Google Account Security**
   - Visit: https://myaccount.google.com/security

2. **Enable 2-Step Verification** (if not already enabled)
   - Click on "2-Step Verification"
   - Follow the prompts to enable it
   - This is required for app passwords

3. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App passwords (at bottom)
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: **NITJ Hostel System**
   - Click **Generate**
   - **COPY the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - Remove spaces when copying: `abcdefghijklmnop`

### Step 2: Update Your `.env` File

1. **Open your `.env` file** (or create it from `.env.example`)

2. **Add these lines** (replace with your actual values):

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Example:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=priyanshug.cs.25@nitj.ac.in
EMAIL_PASS=xyzw abcd efgh ijkl
```

### Step 3: Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm start
```

### Step 4: Test It!

1. Register a new user with `@nitj.ac.in` email
2. Check your email inbox for OTP
3. If email doesn't arrive, OTP will still show on screen (yellow box)

---

## 🚀 For Production (Render.com)

### Add Environment Variables in Render Dashboard:

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add these variables:

```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASS = your-app-password
```

5. Click **Save Changes**
6. Render will automatically redeploy

---

## ⚠️ Important Notes

### Security:
- ✅ **NEVER commit `.env` file to Git** (it's already in `.gitignore`)
- ✅ Use App Password, NOT your regular Gmail password
- ✅ App passwords are safer and can be revoked anytime

### Troubleshooting:

**Email not sending?**
- Check if 2-Step Verification is enabled
- Make sure you're using App Password (not regular password)
- Remove spaces from the app password
- Check if EMAIL_USER matches the Gmail account

**Still not working?**
- Don't worry! OTP will still show on screen
- Users can still verify their email
- Check server console for OTP

### Alternative Email Providers:

**Using Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

**Using Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

**Using Custom SMTP:**
```env
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=your-password
```

---

## ✅ Verification

After setup, you should see in server console:
```
✅ Email sent successfully to: user@nitj.ac.in
```

If email fails, you'll see:
```
⚠️ Email sending error: [error details]
OTP (Email service unavailable): 123456
```

**The system works either way!** OTP is always shown on screen as backup.

---

## 🎯 Current Status

Your system is **already working** without email configuration:
- ✅ OTP shown on screen (yellow box)
- ✅ OTP in browser console
- ✅ OTP in server console
- ✅ Users can verify and login

Email configuration is **optional** but recommended for production to provide better user experience.
