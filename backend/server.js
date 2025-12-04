const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Store reset tokens (in production, use a database like Redis or MongoDB)
const resetTokens = new Map();

// Generate secure reset token
function generateResetToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

// Send password reset email
app.post('/api/send-reset-email', async (req, res) => {
    try {
        const { email, resetLink } = req.body;

        // Validate input
        if (!email || !email.includes('@')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email address' 
            });
        }

        if (!resetLink) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reset link is required' 
            });
        }

        // Check if SendGrid is configured
        if (!process.env.SENDGRID_API_KEY) {
            console.warn('SendGrid API key not configured. Email would be sent in production.');
            return res.json({
                success: true,
                message: 'Email service not configured. Reset link: ' + resetLink,
                resetLink: resetLink,
                note: 'In production, this would be sent via email'
            });
        }

        // Email content
        const msg = {
            to: email,
            from: process.env.FROM_EMAIL || 'noreply@slaystation.com',
            subject: 'Reset Your Slay Station Password',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; text-decoration: none; border-radius: 10px; margin: 20px 0; font-weight: 600; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✨ Slay Station ✨</h1>
                        </div>
                        <div class="content">
                            <h2>Password Reset Request</h2>
                            <p>Hello,</p>
                            <p>We received a request to reset your password for your Slay Station account.</p>
                            <p>Click the button below to reset your password:</p>
                            <div style="text-align: center;">
                                <a href="${resetLink}" class="button">Reset Password</a>
                            </div>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
                            <p><strong>This link will expire in 24 hours.</strong></p>
                            <p>If you didn't request this password reset, please ignore this email.</p>
                            <p>Best regards,<br>The Slay Station Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 Slay Station. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Reset Your Slay Station Password

                We received a request to reset your password.

                Click this link to reset your password:
                ${resetLink}

                This link will expire in 24 hours.

                If you didn't request this password reset, please ignore this email.

                Best regards,
                The Slay Station Team
            `
        };

        // Send email
        await sgMail.send(msg);

        res.json({
            success: true,
            message: 'Password reset email sent successfully!'
        });

    } catch (error) {
        console.error('Error sending email:', error);
        
        if (error.response) {
            console.error('SendGrid error details:', error.response.body);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to send email. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Slay Station Email Service',
        sendgrid_configured: !!process.env.SENDGRID_API_KEY
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Email service running on port ${PORT}`);
    console.log(`📧 SendGrid configured: ${!!process.env.SENDGRID_API_KEY}`);
});

