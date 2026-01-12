import mongoose from 'mongoose'

const mcnSchema = new mongoose.Schema({
    userAccountId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    licensee: {
        type: String,
        required: true,
        trim: true
    },
    licensor: {
        type: String,
        required: true,
        trim: true
    },
    assetChannelId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    youtubeChannelName: {
        type: String,
        required: true,
        trim: true
    },
    monthId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MonthManagement',
        required: true
    },
    accountId: {
        type: String,
        required: true,
        trim: true
    },
    revenueSharePercent: {
        type: Number,
        required: true,
        default: 0
    },
    youtubePayoutUsd: {
        type: Number,
        required: true,
        default: 0
    },
    mvCommission: {
        type: Number,
        required: true,
        default: 0
    },
    revenueUsd: {
        type: Number,
        required: true,
        default: 0
    },
    conversionRate: {
        type: Number,
        required: true,
        default: 0
    },
    payoutRevenueInr: {
        type: Number,
        required: true,
        default: 0
    },
    reportMonth: {
        type: String,
        required: true,
        trim: true
    },
    reportYear: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// Indexes for efficient queries
mcnSchema.index({ userAccountId: 1, monthId: 1 })
mcnSchema.index({ accountId: 1 })
mcnSchema.index({ assetChannelId: 1, monthId: 1 })
mcnSchema.index({ reportMonth: 1, reportYear: 1 })
mcnSchema.index({ isActive: 1 })
mcnSchema.index({ createdAt: -1 })

// Static methods
mcnSchema.statics.findByUserAccountId = function(userAccountId) {
    return this.find({ userAccountId, isActive: true }).sort({ createdAt: -1 })
}

mcnSchema.statics.findByMonthId = function(monthId) {
    return this.find({ monthId, isActive: true }).sort({ userAccountId: 1 })
}

mcnSchema.statics.findByUserAndMonth = function(userAccountId, monthId) {
    return this.find({ userAccountId, monthId, isActive: true })
}

mcnSchema.statics.getTotalEarningsByUser = function(userAccountId) {
    return this.aggregate([
        { $match: { userAccountId, isActive: true } },
        {
            $group: {
                _id: '$userAccountId',
                totalPayoutInr: { $sum: '$payoutRevenueInr' },
                totalRevenueUsd: { $sum: '$revenueUsd' },
                totalYoutubePayoutUsd: { $sum: '$youtubePayoutUsd' },
                totalMvCommission: { $sum: '$mvCommission' },
                totalRecords: { $sum: 1 }
            }
        }
    ])
}

mcnSchema.statics.getMonthlyEarningsByUser = function(userAccountId) {
    return this.aggregate([
        { $match: { userAccountId, isActive: true } },
        {
            $group: {
                _id: {
                    month: '$reportMonth',
                    year: '$reportYear',
                    monthId: '$monthId'
                },
                totalPayoutInr: { $sum: '$payoutRevenueInr' },
                totalRevenueUsd: { $sum: '$revenueUsd' },
                totalMvCommission: { $sum: '$mvCommission' },
                channels: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
    ])
}

const MCN = mongoose.model('MCN', mcnSchema)
export default MCN
