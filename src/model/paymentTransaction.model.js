import mongoose from 'mongoose'
import { EPaymentStatus, ESubscriptionPlan } from '../constant/application.js'

const paymentTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    transactionId: {
        type: String,
        required: [true, 'Transaction ID is required'],
        uppercase: true
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true
    },
    planId: {
        type: String,
        enum: Object.values(ESubscriptionPlan),
        required: [true, 'Plan ID is required']
    },
    description: {
        type: String,
        required: [true, 'Transaction description is required']
    },
    status: {
        type: String,
        enum: Object.values(EPaymentStatus),
        default: EPaymentStatus.PENDING
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'emi'],
        default: null
    },
    subscriptionId: {
        type: String,
        default: null
    },
    razorpayResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    failureReason: {
        type: String,
        default: null
    },
    failureCode: {
        type: String,
        default: null
    },
    gateway: {
        type: String,
        enum: ['razorpay', 'mock'],
        default: 'razorpay'
    },
    refund: {
        refundId: {
            type: String,
            default: null
        },
        amount: {
            type: Number,
            default: 0
        },
        reason: {
            type: String,
            default: null
        },
        processedAt: {
            type: Date,
            default: null
        }
    },
    metadata: {
        ipAddress: {
            type: String,
            default: null
        },
        userAgent: {
            type: String,
            default: null
        },
        source: {
            type: String,
            enum: ['web', 'mobile', 'api'],
            default: 'web'
        }
    },
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    },
    failedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

paymentTransactionSchema.index({ userId: 1 })
paymentTransactionSchema.index({ transactionId: 1 }, { unique: true })
paymentTransactionSchema.index({ razorpayPaymentId: 1 })
paymentTransactionSchema.index({ status: 1 })
paymentTransactionSchema.index({ planId: 1 })
paymentTransactionSchema.index({ createdAt: -1 })
paymentTransactionSchema.index({ userId: 1, status: 1 })

paymentTransactionSchema.virtual('isSuccessful').get(function() {
    return this.status === EPaymentStatus.COMPLETED
})

paymentTransactionSchema.virtual('isFailed').get(function() {
    return this.status === EPaymentStatus.FAILED
})

paymentTransactionSchema.virtual('isPending').get(function() {
    return this.status === EPaymentStatus.PENDING
})

paymentTransactionSchema.statics.findByUserId = function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName emailAddress')
}

paymentTransactionSchema.statics.findSuccessfulPayments = function(userId) {
    return this.find({ 
        userId, 
        status: EPaymentStatus.COMPLETED 
    }).sort({ completedAt: -1 })
}

paymentTransactionSchema.statics.getTotalRevenue = function(startDate, endDate) {
    const match = {
        status: EPaymentStatus.COMPLETED
    }
    
    if (startDate || endDate) {
        match.completedAt = {}
        if (startDate) match.completedAt.$gte = startDate
        if (endDate) match.completedAt.$lte = endDate
    }
    
    return this.aggregate([
        { $match: match },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: '$amount' },
                totalTransactions: { $sum: 1 }
            } 
        }
    ])
}

paymentTransactionSchema.methods.markAsCompleted = function() {
    this.status = EPaymentStatus.COMPLETED
    this.completedAt = new Date()
    return this.save()
}

paymentTransactionSchema.methods.markAsFailed = function(reason, code = null) {
    this.status = EPaymentStatus.FAILED
    this.failedAt = new Date()
    this.failureReason = reason
    if (code) this.failureCode = code
    return this.save()
}

paymentTransactionSchema.methods.processRefund = function(refundAmount, reason) {
    this.refund.amount = refundAmount
    this.refund.reason = reason
    this.refund.processedAt = new Date()
    this.status = EPaymentStatus.REFUNDED
    return this.save()
}

paymentTransactionSchema.pre('save', function(next) {
    if (this.isNew && !this.transactionId) {
        this.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }
    next()
})

export default mongoose.model('PaymentTransaction', paymentTransactionSchema)