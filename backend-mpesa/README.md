# M-Pesa Backend Server for Slay Station

This backend server handles M-Pesa STK Push payments, avoiding CORS issues by making API calls from the server side.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend-mpesa
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your M-Pesa credentials:

```bash
cp env.example .env
```

Edit `.env` and add:
- `MPESA_CONSUMER_KEY` - From Safaricom Daraja Developer Portal
- `MPESA_CONSUMER_SECRET` - From Safaricom Daraja Developer Portal
- `MPESA_PASSKEY` - From Safaricom (for STK Push)
- `MPESA_BUSINESS_SHORT_CODE` - Your Business Short Code (516600 for production)
- `MPESA_ACCOUNT_REFERENCE` - Your account reference (944444)
- `MPESA_CALLBACK_URL` - Your deployed backend URL + `/api/mpesa/callback`
- `MPESA_TIMEOUT_URL` - Your deployed backend URL + `/api/mpesa/timeout`

### 3. Run Locally (for testing)

```bash
npm start
```

Server will run on `http://localhost:3000`

### 4. Deploy to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `slaystation-mpesa-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend-mpesa`

5. Add Environment Variables in Render dashboard:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_PASSKEY`
   - `MPESA_BUSINESS_SHORT_CODE` = `516600`
   - `MPESA_ACCOUNT_REFERENCE` = `944444`
   - `MPESA_BASE_URL` = `https://api.safaricom.co.ke`
   - `MPESA_CALLBACK_URL` = `https://your-backend-url.onrender.com/api/mpesa/callback`
   - `MPESA_TIMEOUT_URL` = `https://your-backend-url.onrender.com/api/mpesa/timeout`
   - `NODE_ENV` = `production`
   - `PORT` = `3000` (Render will set this automatically)

6. Deploy!

### 5. Update Frontend

After deployment, update `mpesa-api.js` with your backend URL:

```javascript
BACKEND_URL: 'https://your-backend-url.onrender.com'
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/mpesa/test` - Test M-Pesa connection
- `POST /api/mpesa/stkpush` - Initiate STK Push
- `POST /api/mpesa/query` - Query STK Push status
- `POST /api/mpesa/callback` - M-Pesa callback (called by Safaricom)
- `POST /api/mpesa/timeout` - M-Pesa timeout (called by Safaricom)

## Testing

Test the connection:
```bash
curl https://your-backend-url.onrender.com/api/mpesa/test
```

## Notes

- The backend handles all M-Pesa API calls to avoid CORS issues
- Callback URLs must be publicly accessible (HTTPS)
- Make sure your M-Pesa credentials are correct for production
- Business Short Code 516600 is for production

