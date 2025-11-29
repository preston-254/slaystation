# How Google Sign-In Works for Login and Signup

## Overview
Your website now uses **Google Sign-In** for both login and signup. This means users don't need to create passwords - they just click the Google button and sign in with their Google account!

## How It Works

### For Users (Sign Up Page)
1. **User clicks "Sign up with Google" button**
   - The button is styled with pink/purple gradient and sparkles ✨💖
   - Google's sign-in popup appears

2. **User selects their Google account**
   - They choose from their saved Google accounts
   - Or enter their Google email/password

3. **Account is automatically created**
   - System extracts: email, name, profile picture from Google
   - Creates a new account in your system
   - Gives them 100 welcome points
   - Saves their profile picture from Google

4. **User is logged in immediately**
   - No need to verify email
   - Redirected to homepage or checkout (if they came from there)

### For Users (Login Page)
1. **User clicks "Sign in with Google" button**
   - Same styled button as signup
   - Google's sign-in popup appears

2. **User selects their Google account**
   - They choose their Google account
   - Google verifies their identity

3. **System checks if account exists**
   - If account exists: Logs them in
   - If account doesn't exist: Creates new account automatically (same as signup)

4. **User is logged in**
   - Redirected to homepage or checkout

## Special Features

### Admin Detection
- If someone signs up/login with the admin email (`preston.mwendwa@riarauniversity.ac.ke`):
  - They are automatically redirected to the admin dashboard
  - An admin button appears in the website header
  - They get full admin access

### Profile Picture
- Google automatically provides profile pictures
- These are saved and displayed in the user's profile
- Users can update their profile picture later

### No Passwords Needed
- Users never create passwords
- Google handles all authentication
- More secure (Google's security)
- Easier for users (one less password to remember)

## Technical Details

### What Gets Stored
When a user signs in with Google, the system stores:
- Email address
- Full name
- Profile picture URL
- Account creation date
- Points and order history
- Flag: `googleSignIn: true`

### Security
- Google handles all password security
- JWT tokens are used for authentication
- No passwords stored in your system
- More secure than custom password systems

### User Experience
- **One-click signup/login** - No forms to fill
- **Automatic account creation** - No email verification needed
- **Profile picture included** - From Google account
- **Seamless experience** - Works on all devices

## Button Styling
The Google Sign-In buttons are styled with:
- ✨ Sparkle animations
- 💖 Heart emojis
- Pink/purple gradient (fallback button)
- Rounded corners
- Soft shadows
- Girlish, feminine aesthetic

## Benefits
1. **Faster signup** - No forms to fill
2. **More secure** - Google's security
3. **Better UX** - One-click authentication
4. **No password issues** - Users can't forget passwords
5. **Profile pictures** - Automatically included
6. **Mobile friendly** - Works great on phones

## For You (Website Owner)
- Users can sign up instantly
- No password reset emails needed
- Less support requests
- Higher conversion rates
- Better user experience

---

**Note:** The Google Sign-In button works the same on both login and signup pages. If a user doesn't have an account, one is created automatically when they sign in with Google!

