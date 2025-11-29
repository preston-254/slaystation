/**
 * M-Pesa Daraja API Integration
 * 
 * To use this integration, you need to:
 * 1. Register at https://developer.safaricom.co.ke/
 * 2. Create an app to get Consumer Key and Consumer Secret
 * 3. Get your Passkey from Safaricom
 * 4. Update the credentials below
 * 
 * IMPORTANT: Never commit these credentials to version control!
 * Use environment variables or a secure config file in production.
 */

// M-Pesa API Configuration
const MPESA_CONFIG = {
    // Get these from Safaricom Daraja Developer Portal: https://developer.safaricom.co.ke/
    CONSUMER_KEY: 'OzG1aZpvAiyCvKnzFvj1EzjO7W05d11LdBIeOlzmBRq7HNbI',        // From Daraja Developer Portal
    CONSUMER_SECRET: 'rtu6fziXm62cV5OjjA7R59lM4LcvaLT7mQSbgRR0WB6sYMtwzWZOwsVAGJLPgbUL',  // From Daraja Developer Portal
    PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',                  // From Safaricom (for STK Push)
    
    
    // API Endpoints
    BASE_URL: 'https://api.safaricom.co.ke',   // Production API
    AUTH_URL: '/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH_URL: '/mpesa/stkpush/v1/processrequest',
    QUERY_URL: '/mpesa/stkpushquery/v1/query',
    
    // Production Business Short Code
    BUSINESS_SHORT_CODE: '516600',                 // Production Business Short Code
    ACCOUNT_REFERENCE: '944444',                   // Your account reference
    
    // Callback URLs (for production - update with your actual callback URLs)
    CALLBACK_URL: 'https://slay-station-28453.firebaseapp.com/api/mpesa/callback',  // Your callback URL
    TIMEOUT_URL: 'https://slay-station-28453.firebaseapp.com/api/mpesa/timeout',    // Your timeout URL
};

/**
 * Get OAuth Access Token from M-Pesa API
 * @returns {Promise<string>} Access token
 */
async function getMpesaAccessToken() {
    try {
        const auth = btoa(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`);
        const url = `${MPESA_CONFIG.BASE_URL}${MPESA_CONFIG.AUTH_URL}`;
        
        console.log('🔐 Requesting M-Pesa OAuth token...');
        console.log('📍 URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to get access token: ${response.status} ${response.statusText}`;
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage += ` - ${errorData.error_description || errorData.error || errorText}`;
            } catch (e) {
                errorMessage += ` - ${errorText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (!data.access_token) {
            throw new Error('No access token in response: ' + JSON.stringify(data));
        }
        
        console.log('✅ OAuth token received successfully!');
        return data.access_token;
    } catch (error) {
        console.error('❌ Error getting M-Pesa access token:', error);
        
        // Check if it's a CORS error
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            console.warn('⚠️ CORS Error: M-Pesa API may not allow direct browser calls.');
            console.warn('💡 Consider using a backend proxy server to avoid CORS issues.');
        }
        
        throw error;
    }
}

/**
 * Generate password for STK Push (Base64 encoded)
 * @param {string} timestamp - Current timestamp
 * @returns {string} Encoded password
 */
function generatePassword(timestamp) {
    const password = `${MPESA_CONFIG.BUSINESS_SHORT_CODE}${MPESA_CONFIG.PASSKEY}${timestamp}`;
    return btoa(password);
}

/**
 * Generate timestamp in format YYYYMMDDHHmmss
 * @returns {string} Timestamp
 */
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

/**
 * Format phone number for M-Pesa (254XXXXXXXXX)
 * @param {string} phone - Phone number (can be 0712345678 or 254712345678)
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    // Remove any spaces or dashes
    phone = phone.replace(/\s|-/g, '');
    
    // If starts with 0, replace with 254
    if (phone.startsWith('0')) {
        phone = '254' + phone.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!phone.startsWith('254')) {
        phone = '254' + phone;
    }
    
    return phone;
}

/**
 * Test M-Pesa API Connection (Demo Mode)
 * Tests OAuth authentication via backend to avoid CORS issues
 * @returns {Promise<Object>} Test result
 */
async function testMpesaConnection() {
    try {
        console.log('🧪 Testing M-Pesa API connection via backend...');
        console.log('📋 Consumer Key:', MPESA_CONFIG.CONSUMER_KEY.substring(0, 10) + '...');
        
        // Check if backend URL is configured
        if (!MPESA_CONFIG.BACKEND_URL) {
            return {
                success: false,
                message: 'Backend URL not configured',
                error: 'Please set MPESA_CONFIG.BACKEND_URL in mpesa-api.js',
                oauthWorking: false
            };
        }
        
        // Test OAuth token generation via backend
        const response = await fetch(`${MPESA_CONFIG.BACKEND_URL}/api/mpesa/test`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ OAuth authentication successful!');
            console.log('🔑 Access token received:', data.accessToken);
            
            // Check if passkey is configured
            const hasPasskey = MPESA_CONFIG.PASSKEY && 
                              MPESA_CONFIG.PASSKEY !== 'YOUR_PASSKEY_HERE' && 
                              MPESA_CONFIG.PASSKEY.trim() !== '';
            
            return {
                success: true,
                message: data.message || 'M-Pesa API connection successful!',
                oauthWorking: true,
                hasPasskey: hasPasskey,
                details: {
                    accessToken: data.accessToken,
                    expiresIn: data.expiresIn,
                    tokenType: data.tokenType,
                    baseUrl: MPESA_CONFIG.BASE_URL,
                    businessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE
                }
            };
        } else {
            throw new Error(data.error || 'Test failed');
        }
    } catch (error) {
        console.error('❌ M-Pesa API connection test failed:', error);
        
        // Check if it's a network/backend error
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.message.includes('NetworkError')) {
            return {
                success: false,
                message: 'Cannot connect to backend server',
                error: 'Make sure your backend server is running on ' + (MPESA_CONFIG.BACKEND_URL || 'http://localhost:8000'),
                oauthWorking: false,
                needsBackend: true
            };
        }
        
        return {
            success: false,
            message: 'M-Pesa API connection failed',
            error: error.message,
            oauthWorking: false
        };
    }
}

/**
 * Initiate M-Pesa STK Push (Production - Direct API Call)
 * @param {string} phoneNumber - Customer phone number
 * @param {number} amount - Amount to charge
 * @param {string} orderId - Order ID for reference
 * @returns {Promise<Object>} STK Push response
 */
async function initiateStkPush(phoneNumber, amount, orderId) {
    try {
        // Check if passkey is configured
        if (!MPESA_CONFIG.PASSKEY || 
            MPESA_CONFIG.PASSKEY === 'YOUR_PASSKEY_HERE' || 
            MPESA_CONFIG.PASSKEY.trim() === '') {
            return {
                success: false,
                error: 'M-Pesa Passkey not configured. Please contact support.',
                needsPasskey: true
            };
        }
        
        console.log('📱 Initiating M-Pesa STK Push...');
        console.log('Phone:', phoneNumber);
        console.log('Amount:', amount);
        
        // Get access token first
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
        
        console.log('📤 Sending STK Push request...');
        
        // Make STK Push request
        const response = await fetch(`${MPESA_CONFIG.BASE_URL}${MPESA_CONFIG.STK_PUSH_URL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stkPushRequest)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ STK Push failed:', errorText);
            throw new Error(`STK Push failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.ResponseCode === '0') {
            console.log('✅ STK Push sent successfully!');
            console.log('Checkout Request ID:', data.CheckoutRequestID);
            return {
                success: true,
                checkoutRequestID: data.CheckoutRequestID,
                customerMessage: data.CustomerMessage,
                merchantRequestID: data.MerchantRequestID
            };
        } else {
            throw new Error(data.CustomerMessage || 'STK Push failed');
        }
    } catch (error) {
        console.error('❌ Error initiating STK Push:', error);
        
        // Handle CORS errors gracefully - M-Pesa API doesn't allow direct browser calls
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.message.includes('NetworkError')) {
            return {
                success: false,
                error: 'M-Pesa payment is currently unavailable. Please use Cash on Delivery or Card payment instead. Thank you! 💕',
                needsBackend: true,
                suggestAlternative: true
            };
        }
        
        return {
            success: false,
            error: error.message || 'Payment request failed. Please try again or use Cash on Delivery.'
        };
    }
}

/**
 * Query STK Push status
 * Uses backend server to avoid CORS issues
 * @param {string} checkoutRequestID - Checkout Request ID from STK Push
 * @returns {Promise<Object>} Query response
 */
async function queryStkPushStatus(checkoutRequestID) {
    try {
        // Use backend server to avoid CORS issues
        const response = await fetch(`${MPESA_CONFIG.BACKEND_URL}/api/mpesa/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                checkoutRequestID: checkoutRequestID
            })
        });
        
        if (!response.ok) {
            throw new Error(`Query failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error querying STK Push status:', error);
        throw error;
    }
}

/**
 * Verify M-Pesa payment (called from your server after callback)
 * @param {string} mpesaReceiptNumber - M-Pesa receipt number
 * @returns {Promise<Object>} Verification result
 */
async function verifyMpesaPayment(mpesaReceiptNumber) {
    // This should be implemented on your backend server
    // The server should verify the payment with M-Pesa and return the result
    // For now, this is a placeholder
    
    try {
        const response = await fetch('/api/mpesa/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                receiptNumber: mpesaReceiptNumber
            })
        });
        
        if (!response.ok) {
            throw new Error('Verification failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error verifying M-Pesa payment:', error);
        throw error;
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initiateStkPush,
        queryStkPushStatus,
        verifyMpesaPayment,
        formatPhoneNumber,
        testMpesaConnection,
        getMpesaAccessToken,
        MPESA_CONFIG
    };
}

// Make test function available globally for easy testing in browser console
if (typeof window !== 'undefined') {
    window.testMpesaConnection = testMpesaConnection;
    console.log('💡 Tip: Run testMpesaConnection() in the console to test your M-Pesa API credentials!');
}

