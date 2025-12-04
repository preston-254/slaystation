# 📧 Email Service Setup Guide

Complete guide to setting up the backend email service for password reset emails.

## 🎯 Overview

The email service sends password reset emails to users using SendGrid. It's a Node.js/Express backend that can be deployed to Render, Heroku, Railway, or any Node.js hosting service.

## 📋 Prerequisites

- Node.js 18+ installed
- SendGrid account (free tier available)
- Git repository

## 🚀 Step-by-Step Setup

### Step 1: Set Up SendGrid

1. **Create Account**: Go to [https://sendgrid.com](https://sendgrid.com) and sign up
   - Free tier: 100 emails/day forever

2. **Verify Sender Email**:
   - Dashboard → Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email (e.g., `noreply@slaystation.com`)
   - Check your email and verify
   - **Important**: Use this exact email as `FROM_EMAIL` in `.env`

3. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Name: "Slay Station Email Service"
   - Permissions: "Full Access" or "Mail Send"
   - **Copy the key immediately** (you won't see it again!)

### Step 2: Configure Backend

1. **Navigate to backend folder**:
   ```bash
   cd slaystation/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env`**:
   ```
   SENDGRID_API_KEY=SG.your_actual_api_key_from_sendgrid
   FROM_EMAIL=your-verified-email@example.com
   PORT=3000
   NODE_ENV=production
   ```

5. **Test locally**:
   ```bash
   npm start
   ```
   Should see: `🚀 Email service running on port 3000`

### Step 3: Deploy to Render (Recommended)

1. **Push to GitHub** (if not already):
   ```bash
   git add backend/
   git commit -m "Add email service backend"
   git push origin main
   ```

2. **Create Render Service**:
   - Go to [render.com](https://render.com)
   - Sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Service**:
   - **Name**: `slaystation-email-service`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or paid for better performance)

4. **Add Environment Variables**:
   - Click "Environment" tab
   - Add:
     - `SENDGRID_API_KEY` = your SendGrid API key
     - `FROM_EMAIL` = your verified email
     - `NODE_ENV` = `production`
     - `PORT` = `10000` (Render uses this port)

5. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Copy your service URL (e.g., `https://slaystation-email-service.onrender.com`)

### Step 4: Update Frontend

1. **Open `deploy/login.html`** and find:
   ```javascript
   const emailServiceUrl = 'https://your-email-service.onrender.com/api/send-reset-email';
   ```

2. **Replace with your Render URL**:
   ```javascript
   const emailServiceUrl = 'https://slaystation-email-service.onrender.com/api/send-reset-email';
   ```

3. **Do the same in `deploy/rider-login.html`**

4. **Deploy frontend changes**:
   ```bash
   git add deploy/login.html deploy/rider-login.html
   git commit -m "Update email service URL"
   git push origin main
   ```

## ✅ Testing

1. **Test Backend Health**:
   ```bash
   curl https://your-service.onrender.com/api/health
   ```
   Should return: `{"status":"ok","sendgrid_configured":true}`

2. **Test Email Sending**:
   - Go to login page
   - Click "Forgot Password?"
   - Enter your email
   - Check your inbox for the reset email!

## 🔧 Alternative: Deploy to Heroku

```bash
# Install Heroku CLI first
heroku create slaystation-email-service
cd backend
heroku config:set SENDGRID_API_KEY=your_key
heroku config:set FROM_EMAIL=your_email
heroku config:set NODE_ENV=production
git subtree push --prefix backend heroku main
```

## 📊 Monitoring

- **SendGrid Dashboard**: Track emails sent, delivered, opened
- **Render Dashboard**: Monitor service uptime and logs
- **Health Endpoint**: `GET /api/health` to check service status

## 🆘 Troubleshooting

### "Email not sending"
- ✅ Check SendGrid API key is correct
- ✅ Verify sender email is verified in SendGrid
- ✅ Check Render logs for errors
- ✅ Test health endpoint

### "CORS Error"
- ✅ Backend has CORS enabled
- ✅ Check frontend URL matches allowed origins

### "Service not responding"
- ✅ Check Render service is running
- ✅ Verify environment variables are set
- ✅ Check service logs in Render dashboard

## 💰 Costs

- **SendGrid Free Tier**: 100 emails/day (perfect for testing)
- **Render Free Tier**: Free with limitations (sleeps after inactivity)
- **Total**: $0/month for small scale!

## 🎉 You're Done!

Once deployed, users will receive actual password reset emails instead of seeing the link on screen!

---

**Next Steps**: 
1. Deploy backend to Render
2. Update frontend with your service URL
3. Test password reset flow
4. Monitor SendGrid dashboard for email delivery

