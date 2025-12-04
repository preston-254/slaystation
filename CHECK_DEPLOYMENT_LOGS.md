# 🔍 How to Check Deployment Logs

## Step-by-Step Guide

### 1. Go to GitHub Actions
- Open your repository on GitHub
- Click the **"Actions"** tab at the top

### 2. Find the Failed Run
- Look for the red ❌ failed workflow run
- Click on it to see details

### 3. Check Each Step
Click on each step to see its output:
- ✅ **Checkout repository** - Should show files being checked out
- ✅ **Setup Node.js** - Should show Node.js version
- ✅ **Install Firebase CLI** - Should show Firebase CLI installation
- ✅ **Verify deploy folder** - Should list deploy folder contents
- ✅ **Check Firebase configuration** - Should show firebase.json and .firebaserc
- ✅ **Verify Firebase Token** - Should show token is configured
- ❌ **Deploy to Firebase Hosting** - **THIS IS WHERE THE ERROR IS**

### 4. Read the Error Message
In the "Deploy to Firebase Hosting" step, scroll down to find:
- **Red error messages**
- **Authentication errors**
- **Permission denied errors**
- **File not found errors**

## Common Error Messages

### "Error: HTTP Error: 401, Request had invalid authentication credentials"
**Solution:** FIREBASE_TOKEN is missing or invalid
- Generate new token: `firebase login:ci`
- Add to GitHub Secrets

### "Error: Failed to get Firebase project"
**Solution:** Project ID mismatch or no access
- Check `.firebaserc` has correct project ID
- Verify you have access to the Firebase project

### "Error: ENOENT: no such file or directory"
**Solution:** Missing files
- Ensure `firebase.json` exists in root
- Ensure `.firebaserc` exists in root
- Ensure `deploy/` folder exists

### "Error: Permission denied"
**Solution:** Insufficient permissions
- Check Firebase project permissions
- Verify token has hosting permissions

## What to Look For

When checking logs, look for:
1. **Authentication errors** - Usually means token issue
2. **File errors** - Missing files or wrong paths
3. **Permission errors** - Access denied
4. **Network errors** - Connection issues

## Share the Error

If you need help, copy the exact error message from the logs and share it!

---

**The workflow now includes `--debug` flag for more detailed error messages.**

