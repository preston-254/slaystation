# 🔐 Google OAuth Setup for Rider Login

## Overview
Rider login now uses Google Sign-In for secure authentication. Only authorized emails can access the rider dashboard.

## Setup Instructions

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen (if not done):
   - User Type: External
   - App name: Slay Station Rider Portal
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: Slay Station Rider Login
   - Authorized JavaScript origins:
     - `https://slay-station-28453.firebaseapp.com`
     - `http://localhost:8000` (for local testing)
   - Authorized redirect URIs:
     - `https://slay-station-28453.firebaseapp.com/rider-login.html`
     - `http://localhost:8000/rider-login.html` (for local testing)
7. Copy your **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

### Step 2: Update the Code

1. Open `deploy/rider-login.html`
2. Find this line:
   ```javascript
   client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID

### Step 3: Authorized Rider Emails

The following emails are authorized for rider access:
- `preston.mwendwa@riarauniversity.ac.ke`
- `kangethekelvin56@gmail.com`
- `prestonmugo83@gmail.com`

To add more authorized emails, update the `ALLOWED_RIDER_EMAILS` array in `rider-login.html`.

## How It Works

1. **Google Sign-In**: Riders click the Google Sign-In button
2. **Email Verification**: System checks if the email is in the allowed list
3. **Account Creation**: If email is authorized but account doesn't exist, it's created automatically
4. **Session Storage**: User session is saved to localStorage
5. **Redirect**: User is redirected to rider dashboard

## Security Features

- ✅ Only authorized emails can login
- ✅ Automatic account creation for authorized riders
- ✅ Session persistence across page reloads
- ✅ Secure Google OAuth authentication
- ✅ Fallback email/password option (hidden by default)

## Testing

1. Use an authorized email to test Google Sign-In
2. Try with an unauthorized email - should show access denied
3. Test session persistence by refreshing the page
4. Verify redirect to rider dashboard after successful login

## Troubleshooting

### "Google Sign-In not working"
- Check that Google Client ID is correctly set
- Verify authorized JavaScript origins include your domain
- Check browser console for errors

### "Access Denied" for authorized email
- Verify email is in `ALLOWED_RIDER_EMAILS` array
- Check email is typed exactly (case-insensitive)

### "Account not found"
- This shouldn't happen - accounts are auto-created
- Check localStorage is enabled in browser

---

**Note**: For production, consider moving the Client ID to environment variables or a config file.

