# M-Pesa Backend Setup Guide

This guide will help you set up the M-Pesa backend server on Render.com so your website can process M-Pesa payments.

## Step 1: Deploy Backend to Render

1. **Go to Render.com**
   - Visit https://render.com
   - Sign up or log in

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `preston-254/slaystation`
   - Click "Connect"

3. **Configure the Service**
   - **Name**: `slaystation-mpesa-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to Kenya (e.g., Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend-mpesa`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier is fine to start

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   MPESA_CONSUMER_KEY=OzG1aZpvAiyCvKnzFvj1EzjO7W05d11LdBIeOlzmBRq7HNbI
   MPESA_CONSUMER_SECRET=rtu6fziXm62cV5OjjA7R59lM4LcvaLT7mQSbgRR0WB6sYMtwzWZOwsVAGJLPgbUL
   MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   MPESA_BUSINESS_SHORT_CODE=516600
   MPESA_ACCOUNT_REFERENCE=944444
   MPESA_BASE_URL=https://api.safaricom.co.ke
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (takes 2-3 minutes)
   - Copy your service URL (e.g., `https://slaystation-mpesa-backend.onrender.com`)

6. **Update Callback URLs**
   After deployment, update these environment variables with your actual backend URL:
   ```
   MPESA_CALLBACK_URL=https://your-backend-url.onrender.com/api/mpesa/callback
   MPESA_TIMEOUT_URL=https://your-backend-url.onrender.com/api/mpesa/timeout
   ```
   Then redeploy.

## Step 2: Update Frontend

1. **Get your backend URL from Render**
   - It will look like: `https://slaystation-mpesa-backend-xxxx.onrender.com`

2. **Update mpesa-api.js**
   - Open `deploy/mpesa-api.js`
   - Find `BACKEND_URL` and update it:
   ```javascript
   BACKEND_URL: 'https://your-actual-backend-url.onrender.com'
   ```

3. **Commit and push**
   ```bash
   git add deploy/mpesa-api.js
   git commit -m "Update M-Pesa backend URL"
   git push origin main
   ```

## Step 3: Test

1. **Test backend health**
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"ok"}`

2. **Test M-Pesa connection**
   - Visit: `https://your-backend-url.onrender.com/api/mpesa/test`
   - Should return success message

3. **Test on website**
   - Try making an order with M-Pesa payment
   - You should receive STK Push on your phone!

## Troubleshooting

### Backend not responding
- Check Render logs: Go to your service → "Logs"
- Make sure environment variables are set correctly
- Verify the service is running (green status)

### STK Push not received
- Check phone number format (should be 254XXXXXXXXX)
- Verify M-Pesa credentials are correct
- Check Render logs for errors

### CORS errors
- Backend should handle CORS automatically
- Make sure your frontend URL is in the CORS allowed origins

## Cost

- **Render Free Tier**: Free (with limitations)
- **Render Paid**: $7/month for always-on service
- **M-Pesa API**: Free (no per-transaction fees from Safaricom)

## Security Notes

- Never commit `.env` file to Git
- Keep M-Pesa credentials secret
- Use HTTPS for all callbacks
- Regularly rotate credentials

## Support

If you encounter issues:
1. Check Render logs
2. Test backend endpoints directly
3. Verify M-Pesa credentials are correct
4. Check phone number format

