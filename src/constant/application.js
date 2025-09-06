export const EApplicationEnvironment = Object.freeze({
    PRODUCTION: 'production',
    DEVELOPMENT: 'development'
});

export const EUserRole = Object.freeze({
    ADMIN: 'admin',
    USER: 'user',
});

export const EUserType = Object.freeze({
    ARTIST: 'artist',
    LABEL: 'label',
    AGGREGATOR: 'aggregator'
});

export const EKYCStatus = Object.freeze({
    UNVERIFIED: 'unverified',
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
});

export const ESubscriptionStatus = Object.freeze({
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
});

export const ESubscriptionPlan = Object.freeze({
    MAHESHWARI_STANDARD: 'maheshwari_standard',
    MAHESHWARI_BEST_VALUE: 'maheshwari_best_value',
    MAHESHWARI_POPULAR: 'maheshwari_popular'
});

export const EPaymentStatus = Object.freeze({
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
});

export const ENotificationType = Object.freeze({
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success'
});
