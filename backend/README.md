# 📧 Slay Station Email Service

Backend API service for sending password reset emails using SendGrid.

## 🚀 Quick Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Set Up SendGrid

1. **Create SendGrid Account**: Go to [https://sendgrid.com](https://sendgrid.com) and sign up (free tier available)

2. **Verify Sender Email**:
   - Go to SendGrid Dashboard → Settings → Sender Authentication
   - Verify a single sender or set up domain authentication
   - Use this email as your `FROM_EMAIL`

3. **Create API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it "Slay Station Email Service"
   - Give it "Full Access" or "Mail Send" permissions
   - Copy the API key (you'll only see it once!)

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   FROM_EMAIL=your-verified-email@example.com
   PORT=3000
   NODE_ENV=production
   ```

### Step 4: Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:3000`

## 📡 API Endpoints

### POST `/api/send-reset-email`

Send a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "resetLink": "https://slay-station-28453.firebaseapp.com/reset-password.html?token=abc123&email=user@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully!"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to send email. Please try again later."
}
```

### GET `/api/health`

Check if the service is running and SendGrid is configured.

**Response:**
```json
{
  "status": "ok",
  "service": "Slay Station Email Service",
  "sendgrid_configured": true
}
```

## 🌐 Deployment Options

### Option 1: Render (Recommended - Free Tier)

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `cd backend && npm install`
5. Set start command: `cd backend && npm start`
6. Add environment variables:
   - `SENDGRID_API_KEY`
   - `FROM_EMAIL`
   - `PORT` (optional)
7. Deploy!

### Option 2: Heroku

```bash
heroku create slaystation-email-service
heroku config:set SENDGRID_API_KEY=your_key
heroku config:set FROM_EMAIL=your_email
git push heroku main
```

### Option 3: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Add environment variables
5. Deploy!

## 🔧 Testing

Test the email service:

```bash
curl -X POST http://localhost:3000/api/send-reset-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "resetLink": "https://slay-station-28453.firebaseapp.com/reset-password.html?token=test123&email=test@example.com"
  }'
```

## 📝 Notes

- **Free Tier**: SendGrid free tier allows 100 emails/day
- **Email Verification**: You must verify your sender email in SendGrid
- **Rate Limits**: Be aware of SendGrid rate limits
- **Security**: Never commit `.env` file to Git
- **Production**: Use environment variables, not hardcoded values

## 🆘 Troubleshooting

### "Invalid API Key"
- Check that your API key is correct in `.env`
- Ensure the API key has "Mail Send" permissions

### "Email not verified"
- Verify your sender email in SendGrid dashboard
- Use the exact email address you verified

### "CORS Error"
- The server has CORS enabled for all origins
- If issues persist, check your frontend URL

---

**Need Help?** Check SendGrid documentation: https://docs.sendgrid.com

