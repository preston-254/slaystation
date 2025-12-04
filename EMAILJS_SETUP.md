# 📧 EmailJS Setup Guide (Easiest Option!)

EmailJS sends emails directly from your frontend - **no backend needed!**

## ⚡ Quick Setup (5 Minutes)

### Step 1: Sign Up for EmailJS

1. Go to [https://www.emailjs.com](https://www.emailjs.com)
2. Click "Sign Up" (free account)
3. Free tier: **200 emails/month** (perfect for testing!)

### Step 2: Connect Your Email Service

1. **Dashboard** → **Email Services** → **Add New Service**
2. Choose one:
   - **Gmail** (easiest - uses your Gmail)
   - **Outlook** (uses your Outlook)
   - **Custom SMTP** (any email provider)
3. Follow the connection steps
4. **Copy your Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template

1. **Dashboard** → **Email Templates** → **Create New Template**
2. **Template Name**: `password_reset`
3. **Subject**: `Reset Your Slay Station Password`
4. **Content**:
   ```
   Hello,
   
   We received a request to reset your password for your Slay Station account.
   
   Click the link below to reset your password:
   {{reset_link}}
   
   This link will expire in 24 hours.
   
   If you didn't request this password reset, please ignore this email.
   
   Best regards,
   The Slay Station Team ✨
   ```
5. **To Email**: `{{to_email}}` or `{{user_email}}`
6. **From Name**: `Slay Station`
7. **From Email**: Your verified email
8. Click **Save**
9. **Copy your Template ID** (e.g., `template_xyz789`)

### Step 4: Get Your Public Key

1. **Dashboard** → **Account** → **General**
2. Find **Public Key**
3. **Copy it** (e.g., `abcdefghijklmnop`)

### Step 5: Update Your Code

1. Open `deploy/login.html`
2. Find these lines (around line 483):
   ```javascript
   const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
   const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
   const EMAILJS_TEMPLATE_ID = 'password_reset';
   ```

3. Replace with your actual values:
   ```javascript
   const EMAILJS_PUBLIC_KEY = 'abcdefghijklmnop'; // Your Public Key
   const EMAILJS_SERVICE_ID = 'service_abc123'; // Your Service ID
   const EMAILJS_TEMPLATE_ID = 'template_xyz789'; // Your Template ID
   ```

4. Do the same in `deploy/rider-login.html`

5. **Deploy!**
   ```bash
   git add deploy/login.html deploy/rider-login.html
   git commit -m "Configure EmailJS for password reset"
   git push origin main
   ```

## ✅ That's It!

Now when users click "Forgot Password?", they'll receive actual emails!

## 🧪 Testing

1. Go to your login page
2. Click "Forgot Password?"
3. Enter your email
4. Check your inbox - you should receive the email!

## 📊 Monitoring

- **EmailJS Dashboard**: Track emails sent, delivered, opened
- **Free Tier**: 200 emails/month
- **Upgrade**: $15/month for 1,000 emails/month

## 🆘 Troubleshooting

### "Email not sending"
- ✅ Check Public Key is correct
- ✅ Verify Service ID matches your connected service
- ✅ Check Template ID matches your template
- ✅ Ensure template variables match: `{{reset_link}}`, `{{to_email}}`

### "Service not connected"
- ✅ Re-connect your email service in EmailJS dashboard
- ✅ Verify your email account is active

### "Template not found"
- ✅ Check Template ID is correct
- ✅ Ensure template is published (not draft)

## 💡 Why EmailJS?

- ✅ **No backend needed** - works directly from frontend
- ✅ **Easy setup** - 5 minutes
- ✅ **Free tier** - 200 emails/month
- ✅ **No deployment** - just update frontend code
- ✅ **Works immediately** - no server configuration

## 🎉 Alternative: Gmail SMTP Backend

If you prefer a backend solution using Gmail, I can update the backend to use Nodemailer with Gmail SMTP instead of SendGrid. Just let me know!

---

**Current Status**: EmailJS SDK is already added to your pages. Just add your keys and you're done!

