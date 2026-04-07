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
        billionmailUrl: process.env.BILLIONMAIL_URL || 'https://mail.app.maheshwarivisuals.com',
        keys: {
            forgotPassword:          process.env.BILLIONMAIL_KEY_FORGOT_PASSWORD,
            emailVerification:       process.env.BILLIONMAIL_KEY_EMAIL_VERIFICATION,
            welcome:                 process.env.BILLIONMAIL_KEY_WELCOME,
            distributionAgreement:   process.env.BILLIONMAIL_KEY_DISTRIBUTION_AGREEMENT,
            membershipActivation:    process.env.BILLIONMAIL_KEY_MEMBERSHIP_ACTIVATION,
            membershipFailed:        process.env.BILLIONMAIL_KEY_MEMBERSHIP_FAILED,
            membershipReminder:      process.env.BILLIONMAIL_KEY_MEMBERSHIP_REMINDER,
            membershipExpiry:        process.env.BILLIONMAIL_KEY_MEMBERSHIP_EXPIRY,
            kycDocumentsNeeded:      process.env.BILLIONMAIL_KEY_KYC_DOCUMENTS_NEEDED,
            kycPending:              process.env.BILLIONMAIL_KEY_KYC_PENDING,
            kycStatus:               process.env.BILLIONMAIL_KEY_KYC_STATUS,
            royaltyWithdrawRequest:  process.env.BILLIONMAIL_KEY_ROYALTY_WITHDRAW_REQUEST,
            royaltyWithdrawStatus:   process.env.BILLIONMAIL_KEY_ROYALTY_WITHDRAW_STATUS,
            royaltyPaid:             process.env.BILLIONMAIL_KEY_ROYALTY_PAID,
            releaseSubmitted:        process.env.BILLIONMAIL_KEY_RELEASE_SUBMITTED,
            releaseApproved:         process.env.BILLIONMAIL_KEY_RELEASE_APPROVED,
            releaseUnderDelivery:    process.env.BILLIONMAIL_KEY_RELEASE_UNDER_DELIVERY,
            releaseLive:             process.env.BILLIONMAIL_KEY_RELEASE_LIVE,
            releaseEditApproved:     process.env.BILLIONMAIL_KEY_RELEASE_EDIT_APPROVED,
            releaseTakedown:         process.env.BILLIONMAIL_KEY_RELEASE_TAKEDOWN,
            syncSubmitted:           process.env.BILLIONMAIL_KEY_SYNC_SUBMITTED,
            syncStatus:              process.env.BILLIONMAIL_KEY_SYNC_STATUS,
            playlistSubmitted:       process.env.BILLIONMAIL_KEY_PLAYLIST_SUBMITTED,
            playlistStatus:          process.env.BILLIONMAIL_KEY_PLAYLIST_STATUS,
            mvProductionSubmitted:   process.env.BILLIONMAIL_KEY_MV_PRODUCTION_SUBMITTED,
            mvProductionStatus:      process.env.BILLIONMAIL_KEY_MV_PRODUCTION_STATUS,
            merchSubmitted:          process.env.BILLIONMAIL_KEY_MERCH_SUBMITTED,
            merchStatus:             process.env.BILLIONMAIL_KEY_MERCH_STATUS,
            aggregatorActivation:    process.env.BILLIONMAIL_KEY_AGGREGATOR_ACTIVATION,
            teamInvitation:          process.env.BILLIONMAIL_KEY_TEAM_INVITATION,
        }
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
