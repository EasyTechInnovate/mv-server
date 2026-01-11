import mongoose from 'mongoose'
import { EPayoutStatus, EPayoutMethod } from '../constant/application.js'

const payoutRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountId: {
        type: String,
        required: true,
        trim: true
    },
    requestId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    amount: {
        type: Number,
        required: true,
        min: [1, 'Payout amount must be at least 1']
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true
    },
    payoutMethod: {
        type: String,
        enum: Object.values(EPayoutMethod),
        default: EPayoutMethod.BANK_TRANSFER
    },
    status: {
        type: String,
        enum: Object.values(EPayoutStatus),
        default: EPayoutStatus.PENDING
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date,
        default: null
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        trim: true,
        default: null
    },
    adminNotes: {
        type: String,
        trim: true,
        default: null
    },
    transactionReference: {
        type: String,
        trim: true,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

payoutRequestSchema.index({ userId: 1, status: 1 })
payoutRequestSchema.index({ accountId: 1 })
payoutRequestSchema.index({ status: 1 })
payoutRequestSchema.index({ requestedAt: -1 })
payoutRequestSchema.index({ createdAt: -1 })

payoutRequestSchema.methods.approve = function(adminId, notes = null) {
    this.status = EPayoutStatus.APPROVED
    this.processedBy = adminId
    this.processedAt = new Date()
    this.adminNotes = notes
    return this.save()
}

payoutRequestSchema.methods.reject = function(adminId, reason, notes = null) {
    this.status = EPayoutStatus.REJECTED
    this.processedBy = adminId
    this.processedAt = new Date()
    this.rejectedAt = new Date()
    this.rejectionReason = reason
    this.adminNotes = notes
    return this.save()
}

payoutRequestSchema.methods.markAsPaid = function(transactionRef = null) {
    this.status = EPayoutStatus.PAID
    this.paidAt = new Date()
    if (transactionRef) {
        this.transactionReference = transactionRef
    }
    return this.save()
}

payoutRequestSchema.methods.cancel = function(reason = null) {
    this.status = EPayoutStatus.CANCELLED
    this.rejectedAt = new Date()
    this.rejectionReason = reason
    return this.save()
}

payoutRequestSchema.statics.findPendingRequests = function(limit = 50) {
    return this.find({ status: EPayoutStatus.PENDING, isActive: true })
        .sort({ requestedAt: 1 })
        .limit(limit)
        .populate('userId', 'firstName lastName emailAddress accountId kyc.bankDetails')
}

payoutRequestSchema.statics.findUserRequests = function(userId, limit = 10) {
    return this.find({ userId, isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
}

payoutRequestSchema.statics.getTotalPendingAmount = async function() {
    const result = await this.aggregate([
        { $match: { status: EPayoutStatus.PENDING, isActive: true } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
    return result[0] || { totalAmount: 0, count: 0 }
}

payoutRequestSchema.statics.getUserPendingAmount = async function(userId) {
    const result = await this.aggregate([
        { $match: { userId, status: EPayoutStatus.PENDING, isActive: true } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
    return result[0] || { totalAmount: 0, count: 0 }
}

payoutRequestSchema.pre('save', async function(next) {
    if (this.isNew && !this.requestId) {
        const count = await this.constructor.countDocuments()
        this.requestId = `PAYOUT-${Date.now()}-${(count + 1).toString().padStart(5, '0')}`
    }
    next()
})

const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema)
export default PayoutRequest
