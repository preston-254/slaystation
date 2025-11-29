const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'https://slay-station-28453.firebaseapp.com',
        'https://slay-station-28453.web.app',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
    ],
    credentials: true
}));
app.use(express.json());

// M-Pesa Configuration
const MPESA_CONFIG = {
    CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || 'OzG1aZpvAiyCvKnzFvj1EzjO7W05d11LdBIeOlzmBRq7HNbI',
    CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || 'rtu6fziXm62cV5OjjA7R59lM4LcvaLT7mQSbgRR0WB6sYMtwzWZOwsVAGJLPgbUL',
    PASSKEY: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    BUSINESS_SHORT_CODE: process.env.MPESA_BUSINESS_SHORT_CODE || '516600',
    ACCOUNT_REFERENCE: process.env.MPESA_ACCOUNT_REFERENCE || '944444',
    BASE_URL: process.env.MPESA_BASE_URL || 'https://api.safaricom.co.ke',
    CALLBACK_URL: process.env.MPESA_CALLBACK_URL || 'https://slay-station-28453.firebaseapp.com/api/mpesa/callback',
    TIMEOUT_URL: process.env.MPESA_TIMEOUT_URL || 'https://slay-station-28453.firebaseapp.com/api/mpesa/timeout'
};

// Get M-Pesa Access Token
async function getMpesaAccessToken() {
    try {
        const auth = Buffer.from(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`).toString('base64');
        const url = `${MPESA_CONFIG.BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        
        if (!response.data.access_token) {
            throw new Error('No access token received');
        }
        
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
        throw error;
    }
}

// Format phone number
function formatPhoneNumber(phone) {
    phone = phone.replace(/\s|-/g, '');
    if (phone.startsWith('0')) {
        phone = '254' + phone.substring(1);
    }
    if (!phone.startsWith('254')) {
        phone = '254' + phone;
    }
    return phone;
}

// Generate timestamp
function generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate password
function generatePassword(timestamp) {
    const password = `${MPESA_CONFIG.BUSINESS_SHORT_CODE}${MPESA_CONFIG.PASSKEY}${timestamp}`;
    return Buffer.from(password).toString('base64');
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'M-Pesa Backend',
        timestamp: new Date().toISOString()
    });
});

// Test M-Pesa connection
app.get('/api/mpesa/test', async (req, res) => {
    try {
        const accessToken = await getMpesaAccessToken();
        res.json({
            success: true,
            message: 'M-Pesa API connection successful!',
            accessToken: accessToken.substring(0, 20) + '...',
            hasPasskey: !!MPESA_CONFIG.PASSKEY,
            businessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to connect to M-Pesa API'
        });
    }
});

// STK Push endpoint
app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
        const { phoneNumber, amount, orderId } = req.body;
        
        // Validate input
        if (!phoneNumber || !amount || !orderId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: phoneNumber, amount, orderId'
            });
        }
        
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be greater than 0'
            });
        }
        
        console.log('📱 Initiating STK Push:', { phoneNumber, amount, orderId });
        
        // Get access token
        const accessToken = await getMpesaAccessToken();
        
        // Format phone number
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        // Generate timestamp and password
        const timestamp = generateTimestamp();
        const password = generatePassword(timestamp);
        
        // Prepare STK Push request
        const stkPushRequest = {
            BusinessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: MPESA_CONFIG.BUSINESS_SHORT_CODE,
            PhoneNumber: formattedPhone,
            CallBackURL: MPESA_CONFIG.CALLBACK_URL,
            AccountReference: MPESA_CONFIG.ACCOUNT_REFERENCE,
            TransactionDesc: `Order ${orderId} - Slay Station`
        };
        
        console.log('📤 Sending STK Push request to M-Pesa...');
        
        // Make STK Push request
        const response = await axios.post(
            `${MPESA_CONFIG.BASE_URL}/mpesa/stkpush/v1/processrequest`,
            stkPushRequest,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const data = response.data;
        
        if (data.ResponseCode === '0') {
            console.log('✅ STK Push sent successfully!', {
                checkoutRequestID: data.CheckoutRequestID,
                customerMessage: data.CustomerMessage
            });
            
            res.json({
                success: true,
                checkoutRequestID: data.CheckoutRequestID,
                customerMessage: data.CustomerMessage,
                merchantRequestID: data.MerchantRequestID
            });
        } else {
            console.error('❌ STK Push failed:', data);
            res.status(400).json({
                success: false,
                error: data.CustomerMessage || 'STK Push failed',
                responseCode: data.ResponseCode
            });
        }
    } catch (error) {
        console.error('❌ Error in STK Push:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.errorMessage || error.message || 'Failed to initiate STK Push'
        });
    }
});

// Query STK Push status
app.post('/api/mpesa/query', async (req, res) => {
    try {
        const { checkoutRequestID } = req.body;
        
        if (!checkoutRequestID) {
            return res.status(400).json({
                success: false,
                error: 'checkoutRequestID is required'
            });
        }
        
        const accessToken = await getMpesaAccessToken();
        const timestamp = generateTimestamp();
        const password = generatePassword(timestamp);
        
        const queryRequest = {
            BusinessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestID
        };
        
        const response = await axios.post(
            `${MPESA_CONFIG.BASE_URL}/mpesa/stkpushquery/v1/query`,
            queryRequest,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('Error querying STK Push:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to query STK Push status'
        });
    }
});

// M-Pesa callback endpoint (for receiving payment confirmations)
app.post('/api/mpesa/callback', (req, res) => {
    try {
        const callbackData = req.body;
        console.log('📥 M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));
        
        // Process callback data
        // In production, you would:
        // 1. Verify the callback signature
        // 2. Update order status in database
        // 3. Send confirmation email to customer
        
        res.status(200).json({ 
            success: true, 
            message: 'Callback received' 
        });
    } catch (error) {
        console.error('Error processing callback:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// M-Pesa timeout endpoint
app.post('/api/mpesa/timeout', (req, res) => {
    try {
        const timeoutData = req.body;
        console.log('⏱️ M-Pesa Timeout received:', JSON.stringify(timeoutData, null, 2));
        
        res.status(200).json({ 
            success: true, 
            message: 'Timeout received' 
        });
    } catch (error) {
        console.error('Error processing timeout:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 M-Pesa Backend Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 M-Pesa Base URL: ${MPESA_CONFIG.BASE_URL}`);
    console.log(`💼 Business Short Code: ${MPESA_CONFIG.BUSINESS_SHORT_CODE}`);
});

