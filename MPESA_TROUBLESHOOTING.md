# M-Pesa Troubleshooting Guide

If M-Pesa payments are not working, follow these steps to diagnose and fix the issue:

## Quick Diagnosis

1. **Open your browser's Developer Console** (F12 or Right-click → Inspect → Console)
2. **Try to make a payment** and check for error messages
3. **Look for these specific errors:**

### Error: "Cannot reach M-Pesa backend server"
**Problem:** The backend server is not deployed or not accessible.

**Solution:**
1. Go to https://render.com
2. Check if `slaystation-mpesa-backend` service exists and is running
3. If not deployed, follow the setup guide in `MPESA_BACKEND_SETUP.md`
4. If deployed but not running, check the logs in Render dashboard

### Error: "Backend server not configured"
**Problem:** The `BACKEND_URL` in `mpesa-api.js` is not set correctly.

**Solution:**
1. Get your backend URL from Render (e.g., `https://slaystation-mpesa-backend-xxxx.onrender.com`)
2. Update `deploy/mpesa-api.js` line 34:
   ```javascript
   BACKEND_URL: 'https://your-actual-backend-url.onrender.com',
   ```
3. Commit and push the changes

### Error: "404 Not Found" or "Endpoint not found"
**Problem:** The backend is deployed but the routes are not working.

**Solution:**
1. Check Render logs for errors
2. Verify the backend server is using the correct port (3000)
3. Make sure environment variables are set correctly in Render

## Testing the Backend

### Test 1: Check if Backend is Reachable
Open your browser console and run:
```javascript
fetch('https://slaystation-mpesa-backend.onrender.com/api/mpesa/test')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected Result:** Should return `{success: true, ...}`

**If it fails:** The backend is not deployed or not running.

### Test 2: Check M-Pesa API Connection
In browser console:
```javascript
testMpesaConnection().then(console.log).catch(console.error);
```

**Expected Result:** Should show OAuth token and connection status.

## Common Issues and Fixes

### Issue 1: Backend Not Deployed
**Symptoms:** "Cannot connect to payment server" error

**Fix:**
1. Follow `MPESA_BACKEND_SETUP.md` to deploy backend to Render
2. Wait for deployment to complete (2-3 minutes)
3. Copy the service URL from Render
4. Update `BACKEND_URL` in `mpesa-api.js`

### Issue 2: Environment Variables Not Set
**Symptoms:** Backend returns 500 error or authentication fails

**Fix:**
1. Go to Render dashboard → Your service → Environment
2. Add these variables:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_PASSKEY`
   - `MPESA_BUSINESS_SHORT_CODE`
   - `MPESA_ACCOUNT_REFERENCE`
   - `MPESA_BASE_URL`
3. Redeploy the service

### Issue 3: CORS Errors
**Symptoms:** "CORS policy" error in console

**Fix:**
1. Check `backend-mpesa/server.js` CORS configuration
2. Make sure your Firebase URL is in the allowed origins list
3. Redeploy backend

### Issue 4: Backend URL Wrong
**Symptoms:** "404 Not Found" or connection refused

**Fix:**
1. Get the correct URL from Render dashboard
2. Update `BACKEND_URL` in `deploy/mpesa-api.js`
3. Make sure URL doesn't have trailing slash
4. Commit and push changes

## Current Backend URL

The current backend URL is set to:
```
https://slaystation-mpesa-backend.onrender.com
```

**To update it:**
1. Edit `deploy/mpesa-api.js`
2. Find line 34: `BACKEND_URL: '...'`
3. Replace with your actual Render backend URL
4. Save and commit

## Alternative: Use Cash on Delivery

If M-Pesa is not working, customers can still place orders using:
- **Cash on Delivery** - Pay when the order is delivered
- The admin will set the delivery fee after order is placed

## Need Help?

1. Check Render dashboard for backend logs
2. Check browser console for frontend errors
3. Verify all environment variables are set in Render
4. Make sure backend service is "Live" (not "Suspended") in Render

