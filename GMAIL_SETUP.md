# 📧 Gmail SMTP Setup (Easiest Backend Option!)

Use your Gmail account to send emails - no third-party service signup needed!

## ⚡ Quick Setup (3 Steps)

### Step 1: Enable Gmail App Password

1. **Go to Google Account**: [https://myaccount.google.com](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (enable it if not already)
3. **App Passwords**:
   - Go to: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Name it: "Slay Station Email Service"
   - Click **Generate**
   - **Copy the 16-character password** (you'll only see it once!)

### Step 2: Configure Backend

1. **Navigate to backend-gmail folder**:
   ```bash
   cd slaystation/backend-gmail
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```bash
   cp env.example .env
   ```

4. **Edit `.env`**:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   PORT=3000
   NODE_ENV=production
   ```
   **Note**: Remove spaces from app password (it's 16 characters, no spaces)

5. **Test locally**:
   ```bash
   npm start
   ```

### Step 3: Deploy to Render

1. **Push to GitHub**:
   ```bash
   git add backend-gmail/
   git commit -m "Add Gmail email service"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect GitHub
   - **Build**: `cd backend-gmail && npm install`
   - **Start**: `cd backend-gmail && npm start`
   - **Environment Variables**:
     - `GMAIL_USER` = your Gmail address
     - `GMAIL_APP_PASSWORD` = your 16-char app password
     - `PORT` = `10000`
   - Deploy!

3. **Update Frontend**:
   - In `login.html` and `rider-login.html`
   - Update `EMAIL_SERVICE_URL` with your Render URL

## ✅ That's It!

Now emails will be sent from your Gmail account!

## 🎯 Why Gmail SMTP?

- ✅ **No signup needed** - use your existing Gmail
- ✅ **Free** - Gmail allows 500 emails/day
- ✅ **Simple setup** - just need app password
- ✅ **Reliable** - Gmail's infrastructure

## 🆘 Troubleshooting

### "Invalid login"
- ✅ Make sure you're using **App Password**, not regular password
- ✅ Remove spaces from app password
- ✅ Ensure 2-Step Verification is enabled

### "Email not sending"
- ✅ Check Gmail account is active
- ✅ Verify app password is correct
- ✅ Check Render logs for errors

---

**This is easier than SendGrid!** Just need your Gmail and an app password.

