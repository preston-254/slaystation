# 🚀 Quick Google OAuth Setup Guide

## The Error You're Seeing

**Error 401: invalid_client** means the Google OAuth Client ID is not configured or is invalid.

## Quick Fix (5 Minutes)

### Step 1: Get Your Google Client ID

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select a Project**:
   - Click the project dropdown at the top
   - Click "New Project" or select existing one
   - Name it "Slay Station" (or any name)

3. **Enable Google Sign-In API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google Sign-In API" or "Identity Platform"
   - Click **Enable**

4. **Create OAuth Credentials**:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - If prompted, configure OAuth consent screen:
     - **User Type**: External
     - **App name**: Slay Station Rider Portal
     - **User support email**: your-email@example.com
     - **Developer contact**: your-email@example.com
     - Click **Save and Continue** through all steps
   
5. **Create OAuth Client ID**:
   - **Application type**: Web application
   - **Name**: Slay Station Rider Login
   - **Authorized JavaScript origins**:
     ```
     https://slay-station-28453.firebaseapp.com
     http://localhost:8000
     ```
   - **Authorized redirect URIs**:
     ```
     https://slay-station-28453.firebaseapp.com/rider-login.html
     http://localhost:8000/rider-login.html
     ```
   - Click **Create**

6. **Copy Your Client ID**:
   - You'll see a popup with your Client ID
   - It looks like: `123456789-abc123def456.apps.googleusercontent.com`
   - **Copy this entire string**

### Step 2: Update the Code

1. Open `deploy/rider-login.html`
2. Find this line (around line 260):
   ```javascript
   const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:
   ```javascript
   const GOOGLE_CLIENT_ID = '123456789-abc123def456.apps.googleusercontent.com';
   ```
4. Save the file

### Step 3: Deploy

```bash
cd "C:\Users\USER\Documents\slaystation bags\slaystation"
git add deploy/rider-login.html
git commit -m "Configure Google OAuth Client ID"
git push origin main
```

## Testing

1. Wait for deployment to complete (check GitHub Actions)
2. Visit: `https://slay-station-28453.firebaseapp.com/rider-login.html`
3. Click "Sign in with Google"
4. Select your authorized email (`prestonmugo83@gmail.com`)
5. You should be redirected to the rider dashboard!

## Troubleshooting

### Still seeing "invalid_client"?
- ✅ Make sure you copied the **entire** Client ID (including `.apps.googleusercontent.com`)
- ✅ Check that your domain is in "Authorized JavaScript origins"
- ✅ Wait a few minutes after creating credentials (Google needs time to propagate)
- ✅ Clear browser cache and try again

### "Access Denied" after signing in?
- ✅ Make sure your email is in the `ALLOWED_RIDER_EMAILS` array in `rider-login.html`
- ✅ Currently allowed: `preston.mwendwa@riarauniversity.ac.ke`, `kangethekelvin56@gmail.com`, `prestonmugo83@gmail.com`

### Button not showing?
- ✅ Check browser console for errors
- ✅ Make sure Google Sign-In API is enabled in Google Cloud Console
- ✅ Verify the Client ID is correct (no extra spaces or quotes)

## Need Help?

If you're stuck, check:
- `GOOGLE_OAUTH_SETUP.md` for detailed instructions
- Google Cloud Console → APIs & Services → Credentials
- Browser console for specific error messages

---

**Current Status**: ⚠️ Google Client ID needs to be configured
**Next Step**: Follow Step 1 above to get your Client ID

