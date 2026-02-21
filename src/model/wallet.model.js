import mongoose from 'mongoose'

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    accountId: {
        type: String,
        required: true,
        trim: true
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0
    },
    regularRoyalty: {
        type: Number,
        default: 0,
        min: 0
    },
    bonusRoyalty: {
        type: Number,
        default: 0,
        min: 0
    },
    mcnRoyalty: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCommission: {
        type: Number,
        default: 0,
        min: 0
    },
    availableBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    pendingPayout: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPaidOut: {
        type: Number,
        default: 0,
        min: 0
    },
    withdrawableBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    lastCalculatedAt: {
        type: Date,
        default: null
    },
    lastCalculatedMonth: {
        type: String,
        default: null,
        trim: true
    },
    adminAdjustments: [{
        type: {
            type: String,
            enum: ['credit', 'debit'],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        reason: {
            type: String,
            required: true,
            trim: true
        },
        adjustedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        balanceBefore: {
            type: Number,
            required: true
        },
        balanceAfter: {
            type: Number,
            required: true
        },
        adjustedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

walletSchema.index({ accountId: 1 })
walletSchema.index({ availableBalance: -1 })
walletSchema.index({ isActive: 1 })
walletSchema.index({ createdAt: -1 })

walletSchema.virtual('hasBalance').get(function() {
    return this.availableBalance > 0
})

walletSchema.virtual('canWithdraw').get(function() {
    return this.withdrawableBalance > 0
})

walletSchema.methods.updateEarnings = function(earnings) {
    this.totalEarnings += earnings.totalEarnings || 0
    this.regularRoyalty += earnings.regularRoyalty || 0
    this.bonusRoyalty += earnings.bonusRoyalty || 0
    this.mcnRoyalty += earnings.mcnRoyalty || 0
    this.totalCommission += earnings.commission || 0
    this.availableBalance = this.totalEarnings - this.totalCommission
    this.withdrawableBalance = this.availableBalance - this.pendingPayout - this.totalPaidOut
    this.lastCalculatedAt = new Date()
    if (earnings.month) {
        this.lastCalculatedMonth = earnings.month
    }
    return this.save()
}

walletSchema.methods.addPendingPayout = function(amount) {
    this.pendingPayout += amount
    this.withdrawableBalance = this.availableBalance - this.pendingPayout - this.totalPaidOut
    return this.save()
}

walletSchema.methods.removePendingPayout = function(amount) {
    this.pendingPayout -= amount
    this.withdrawableBalance = this.availableBalance - this.pendingPayout - this.totalPaidOut
    return this.save()
}

walletSchema.methods.markPayoutComplete = function(amount) {
    this.pendingPayout -= amount
    this.totalPaidOut += amount
    this.withdrawableBalance = this.availableBalance - this.pendingPayout - this.totalPaidOut
    return this.save()
}

walletSchema.methods.applyAdminAdjustment = function(type, amount, reason, adminId) {
    const balanceBefore = this.availableBalance

    if (type === 'credit') {
        this.availableBalance += amount
    } else {
        this.availableBalance -= amount
    }

    if (this.availableBalance < 0) {
        this.availableBalance = 0
    }

    this.withdrawableBalance = this.availableBalance - this.pendingPayout - this.totalPaidOut

    this.adminAdjustments.push({
        type,
        amount,
        reason,
        adjustedBy: adminId,
        balanceBefore,
        balanceAfter: this.availableBalance,
        adjustedAt: new Date()
    })

    return this.save()
}

walletSchema.methods.recalculateBalances = function() {
    this.availableBalance = this.totalEarnings - this.totalCommission
    this.withdrawableBalance = this.availableBalance - this.pendingPayout - this.totalPaidOut
    return this.save()
}

walletSchema.statics.findByUserId = function(userId) {
    return this.findOne({ userId, isActive: true })
}

walletSchema.statics.findByAccountId = function(accountId) {
    return this.findOne({ accountId, isActive: true })
}

walletSchema.statics.createWallet = async function(userId, accountId) {
    const existingWallet = await this.findByUserId(userId)
    if (existingWallet) {
        return existingWallet
    }

    const wallet = new this({
        userId,
        accountId
    })

    return await wallet.save()
}

walletSchema.statics.getTopEarners = function(limit = 10) {
    return this.find({ isActive: true })
        .sort({ totalEarnings: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName emailAddress accountId')
}

walletSchema.pre('save', function(next) {
    if (this.withdrawableBalance < 0) {
        this.withdrawableBalance = 0
    }
    next()
})

const Wallet = mongoose.model('Wallet', walletSchema)
export default Wallet
