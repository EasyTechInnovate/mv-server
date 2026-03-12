import dotenvFlow from 'dotenv-flow'

dotenvFlow.config()

const config = {
    env: process.env.ENV || 'development',
    server: {
        port: parseInt(process.env.PORT || '5000', 10),
        url: process.env.SERVER_URL || 'http://localhost:5000'
    },
    database: {
        url: process.env.DATABASE_URL
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        jwtExpiresIn: '1d',
        jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    email: {
        resendApiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM
    },
    security: {
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    },
    client: {
        url: process.env.CLIENT_URL || 'http://localhost:3000'
    },
    payment: {
        gateway: process.env.PAYMENT_GATEWAY || 'razorpay',   // 'razorpay' | 'paytm'
        razorpay_key_id: process.env.RAZORPAY_KEY_ID || '',
        razorpay_key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        razorpay_webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
        paytm_merchant_id: process.env.PAYTM_MERCHANT_ID || '',
        paytm_merchant_key: process.env.PAYTM_MERCHANT_KEY || '',
        paytm_website: process.env.PAYTM_WEBSITE || 'WEBSTAGING',
        paytm_channel_id: process.env.PAYTM_CHANNEL_ID || 'WEB',
        paytm_industry_type: process.env.PAYTM_INDUSTRY_TYPE || 'Retail',
        paytm_callback_url: process.env.PAYTM_CALLBACK_URL || `${process.env.SERVER_URL || 'http://localhost:5000'}/v1/subscription/webhook/paytm`
    }
}

export default config
