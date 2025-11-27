# 🔧 Deployment Troubleshooting Guide

## Common Issues and Solutions

### ❌ Issue: "Deployment Failed" with exit code 1

**Possible Causes:**

1. **Missing FIREBASE_TOKEN Secret**
   - Go to: GitHub → Your repository → Settings → Secrets and variables → Actions
   - Check if `FIREBASE_TOKEN` exists
   - If missing, generate one:
     ```bash
     firebase login:ci
     ```
   - Copy the token and add it as a secret named `FIREBASE_TOKEN`

2. **Incorrect Project ID**
   - Verify project ID in `.firebaserc` matches your Firebase project
   - Current: `slay-station-28453`

3. **Missing Files**
   - Ensure `firebase.json` exists in root
   - Ensure `.firebaserc` exists in root
   - Ensure `deploy/` folder exists with files

4. **Firebase CLI Issues**
   - Check GitHub Actions logs for specific error messages
   - Look for authentication errors
   - Check for permission errors

### ✅ How to Check Logs

1. Go to: GitHub → Your repository → Actions
2. Click on the failed workflow run
3. Click on "Deploy to Firebase" step
4. Scroll through the logs to find the error

### 🔍 Debug Steps

1. **Check Firebase Token:**
   ```bash
   firebase login:ci
   # Use the token in GitHub Secrets
   ```

2. **Test Locally:**
   ```bash
   cd slaystation
   firebase deploy --only hosting --project slay-station-28453
   ```

3. **Verify Files:**
   ```bash
   ls -la firebase.json .firebaserc
   ls -la deploy/
   ```

### 📞 Still Having Issues?

Check the GitHub Actions logs for:
- Authentication errors
- File not found errors
- Permission denied errors
- Network errors

The workflow now includes `--debug` flag for more detailed error messages.

---

**Last Updated:** After workflow improvements

