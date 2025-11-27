import mongoose from 'mongoose'
import { EStreamingPlatform, ERoyaltyType } from '../constant/application.js'

const royaltySchema = new mongoose.Schema({
    userAccountId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    // Basic track and royalty information
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
    platform: {
        type: String,
        // enum: Object.values(EStreamingPlatform), // Commented out to allow any platform value from CSV
        required: true,
        trim: true
    },
    monthId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Month',
        required: true
    },
    accountId: {
        type: String,
        required: true,
        trim: true
    },
    labelName: {
        type: String,
        required: true,
        trim: true
    },
    artistName: {
        type: String,
        required: true,
        trim: true
    },
    albumTitle: {
        type: String,
        trim: true,
        default: null
    },
    trackTitle: {
        type: String,
        required: true,
        trim: true
    },
    productTitle: {
        type: String,
        trim: true,
        default: null
    },
    volVersion: {
        type: String,
        trim: true,
        default: null
    },
    upc: {
        type: String,
        trim: true,
        default: null
    },
    catalogNumber: {
        type: String,
        trim: true,
        default: null
    },
    isrc: {
        type: String,
        trim: true,
        default: null
    },
    // Royalty specific data
    royaltyType: {
        type: String,
        enum: Object.values(ERoyaltyType),
        required: true
    },
    totalUnits: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    countryCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 2
    },
    // Revenue and earnings
    regularRoyalty: {
        type: Number,
        min: 0,
        default: 0
    },
    bonusRoyalty: {
        type: Number,
        min: 0,
        default: 0
    },
    totalEarnings: {
        type: Number,
        min: 0,
        default: 0
    },
    // Additional metadata for revenue calculation
    rate: {
        type: Number,
        min: 0,
        default: 0
    },
    currency: {
        type: String,
        trim: true,
        default: 'USD'
    },
    // Date tracking
    reportMonth: {
        type: String,
        required: true,
        trim: true
    },
    reportYear: {
        type: Number,
        required: true
    },
    // Processed flag
    isProcessed: {
        type: Boolean,
        default: true
    },
    // Metadata
    importedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Indexes for efficient queries
royaltySchema.index({ userAccountId: 1, monthId: 1 })
royaltySchema.index({ royaltyType: 1 })
royaltySchema.index({ platform: 1 })
royaltySchema.index({ countryCode: 1 })
royaltySchema.index({ trackTitle: 1, artistName: 1 })
royaltySchema.index({ reportMonth: 1, reportYear: 1 })
royaltySchema.index({ totalEarnings: -1 })
royaltySchema.index({ regularRoyalty: -1 })
royaltySchema.index({ bonusRoyalty: -1 })
royaltySchema.index({ createdAt: -1 })

// Virtual for country name
royaltySchema.virtual('countryName').get(function() {
    const countryMapping = {
        'IN': 'India',
        'US': 'United States',
        'CN': 'China',
        'PT': 'Portugal',
        'MX': 'Mexico',
        'UK': 'United Kingdom',
        'CA': 'Canada',
        'AU': 'Australia',
        'DE': 'Germany',
        'FR': 'France',
        'BR': 'Brazil',
        'JP': 'Japan'
    }
    return countryMapping[this.countryCode] || this.countryCode
})

// Pre-save middleware to calculate total earnings
royaltySchema.pre('save', function(next) {
    this.totalEarnings = (this.regularRoyalty || 0) + (this.bonusRoyalty || 0)
    next()
})

// Static methods for royalty calculations

// Get total earnings for user
royaltySchema.statics.getUserTotalEarnings = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    const result = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: '$totalEarnings' },
                regularRoyalty: { $sum: '$regularRoyalty' },
                bonusRoyalty: { $sum: '$bonusRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                uniqueTracks: { $addToSet: '$trackTitle' },
                uniqueCountries: { $addToSet: '$countryCode' },
                uniquePlatforms: { $addToSet: '$platform' }
            }
        },
        {
            $project: {
                _id: 0,
                totalEarnings: 1,
                regularRoyalty: 1,
                bonusRoyalty: 1,
                totalUnits: 1,
                uniqueTracksCount: { $size: '$uniqueTracks' },
                uniqueCountriesCount: { $size: '$uniqueCountries' },
                uniquePlatformsCount: { $size: '$uniquePlatforms' }
            }
        }
    ])

    return result[0] || {
        totalEarnings: 0,
        regularRoyalty: 0,
        bonusRoyalty: 0,
        totalUnits: 0,
        uniqueTracksCount: 0,
        uniqueCountriesCount: 0,
        uniquePlatformsCount: 0
    }
}

// Get current month earnings
royaltySchema.statics.getUserThisMonthEarnings = async function(userAccountId) {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    return await this.getUserTotalEarnings(userAccountId, {
        startDate: new Date(currentYear, currentMonth - 1, 1),
        endDate: new Date(currentYear, currentMonth, 0, 23, 59, 59)
    })
}

// Get monthly royalty trends
royaltySchema.statics.getUserMonthlyRoyaltyTrends = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: '$reportYear',
                    month: '$reportMonth'
                },
                totalEarnings: { $sum: '$totalEarnings' },
                regularRoyalty: { $sum: '$regularRoyalty' },
                bonusRoyalty: { $sum: '$bonusRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                uniqueTracks: { $addToSet: '$trackTitle' }
            }
        },
        {
            $project: {
                _id: 0,
                period: {
                    year: '$_id.year',
                    month: '$_id.month'
                },
                totalEarnings: 1,
                regularRoyalty: 1,
                bonusRoyalty: 1,
                totalUnits: 1,
                uniqueTracksCount: { $size: '$uniqueTracks' }
            }
        },
        { $sort: { 'period.year': 1, 'period.month': 1 } }
    ])
}

// Get royalty composition (regular vs bonus)
royaltySchema.statics.getUserRoyaltyComposition = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    const result = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                regularRoyalty: { $sum: '$regularRoyalty' },
                bonusRoyalty: { $sum: '$bonusRoyalty' },
                totalEarnings: { $sum: '$totalEarnings' }
            }
        },
        {
            $project: {
                _id: 0,
                regularRoyalty: 1,
                bonusRoyalty: 1,
                totalEarnings: 1,
                regularPercentage: {
                    $cond: {
                        if: { $gt: ['$totalEarnings', 0] },
                        then: { $multiply: [{ $divide: ['$regularRoyalty', '$totalEarnings'] }, 100] },
                        else: 0
                    }
                },
                bonusPercentage: {
                    $cond: {
                        if: { $gt: ['$totalEarnings', 0] },
                        then: { $multiply: [{ $divide: ['$bonusRoyalty', '$totalEarnings'] }, 100] },
                        else: 0
                    }
                }
            }
        }
    ])

    return result[0] || {
        regularRoyalty: 0,
        bonusRoyalty: 0,
        totalEarnings: 0,
        regularPercentage: 0,
        bonusPercentage: 0
    }
}

// Get performance metrics
royaltySchema.statics.getUserPerformanceMetrics = async function(userAccountId, timeframe = {}) {
    const monthlyTrends = await this.getUserMonthlyRoyaltyTrends(userAccountId, timeframe)

    if (monthlyTrends.length === 0) {
        return {
            averageMonthly: 0,
            bestMonth: null,
            growthRate: 0
        }
    }

    // Calculate average monthly earnings
    const totalEarnings = monthlyTrends.reduce((sum, month) => sum + month.totalEarnings, 0)
    const averageMonthly = totalEarnings / monthlyTrends.length

    // Find best month
    const bestMonth = monthlyTrends.reduce((best, current) =>
        current.totalEarnings > (best?.totalEarnings || 0) ? current : best
    )

    // Calculate growth rate (last vs first month)
    let growthRate = 0
    if (monthlyTrends.length >= 2) {
        const firstMonth = monthlyTrends[0].totalEarnings
        const lastMonth = monthlyTrends[monthlyTrends.length - 1].totalEarnings

        if (firstMonth > 0) {
            growthRate = ((lastMonth - firstMonth) / firstMonth) * 100
        }
    }

    return {
        averageMonthly: parseFloat(averageMonthly.toFixed(2)),
        bestMonth: {
            period: bestMonth.period,
            totalEarnings: bestMonth.totalEarnings
        },
        growthRate: parseFloat(growthRate.toFixed(2))
    }
}

// Get revenue by platform
royaltySchema.statics.getUserRevenueByPlatform = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$platform',
                totalEarnings: { $sum: '$totalEarnings' },
                regularRoyalty: { $sum: '$regularRoyalty' },
                bonusRoyalty: { $sum: '$bonusRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                trackCount: { $addToSet: '$trackTitle' }
            }
        },
        {
            $project: {
                _id: 0,
                platform: '$_id',
                totalEarnings: 1,
                regularRoyalty: 1,
                bonusRoyalty: 1,
                totalUnits: 1,
                trackCount: { $size: '$trackCount' }
            }
        },
        { $sort: { totalEarnings: -1 } }
    ])
}

// Get top earning tracks
royaltySchema.statics.getUserTopEarningTracks = async function(userAccountId, limit = 10, timeframe = {}) {
    const matchStage = { userAccountId }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    trackTitle: '$trackTitle',
                    artistName: '$artistName',
                    albumTitle: '$albumTitle'
                },
                totalEarnings: { $sum: '$totalEarnings' },
                regularRoyalty: { $sum: '$regularRoyalty' },
                bonusRoyalty: { $sum: '$bonusRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                platforms: { $addToSet: '$platform' },
                countries: { $addToSet: '$countryCode' }
            }
        },
        {
            $project: {
                _id: 0,
                trackTitle: '$_id.trackTitle',
                artistName: '$_id.artistName',
                albumTitle: '$_id.albumTitle',
                totalEarnings: 1,
                regularRoyalty: 1,
                bonusRoyalty: 1,
                totalUnits: 1,
                platformCount: { $size: '$platforms' },
                countryCount: { $size: '$countries' },
                platforms: 1
            }
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: limit }
    ])
}

// Get bonus royalty specific methods
royaltySchema.statics.getUserBonusRoyaltyTrends = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId, bonusRoyalty: { $gt: 0 } }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: '$reportYear',
                    month: '$reportMonth'
                },
                bonusRoyalty: { $sum: '$bonusRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                uniqueTracks: { $addToSet: '$trackTitle' }
            }
        },
        {
            $project: {
                _id: 0,
                period: {
                    year: '$_id.year',
                    month: '$_id.month'
                },
                bonusRoyalty: 1,
                totalUnits: 1,
                uniqueTracksCount: { $size: '$uniqueTracks' }
            }
        },
        { $sort: { 'period.year': 1, 'period.month': 1 } }
    ])
}

royaltySchema.statics.getUserBonusRoyaltyByPlatform = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId, bonusRoyalty: { $gt: 0 } }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$platform',
                bonusRoyalty: { $sum: '$bonusRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                trackCount: { $addToSet: '$trackTitle' }
            }
        },
        {
            $project: {
                _id: 0,
                platform: '$_id',
                bonusRoyalty: 1,
                totalUnits: 1,
                trackCount: { $size: '$trackCount' }
            }
        },
        { $sort: { bonusRoyalty: -1 } }
    ])
}

royaltySchema.statics.getUserTopBonusEarningTracks = async function(userAccountId, limit = 10, timeframe = {}) {
    const matchStage = { userAccountId, bonusRoyalty: { $gt: 0 } }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    trackTitle: '$trackTitle',
                    artistName: '$artistName',
                    albumTitle: '$albumTitle'
                },
                bonusRoyalty: { $sum: '$bonusRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                platforms: { $addToSet: '$platform' },
                countries: { $addToSet: '$countryCode' }
            }
        },
        {
            $project: {
                _id: 0,
                trackTitle: '$_id.trackTitle',
                artistName: '$_id.artistName',
                albumTitle: '$_id.albumTitle',
                bonusRoyalty: 1,
                totalUnits: 1,
                platformCount: { $size: '$platforms' },
                countryCount: { $size: '$countries' },
                platforms: 1
            }
        },
        { $sort: { bonusRoyalty: -1 } },
        { $limit: limit }
    ])
}

// Get bonus royalty composition
royaltySchema.statics.getUserBonusRoyaltyComposition = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId, royaltyType: 'bonus' }

    if (timeframe.start || timeframe.end) {
        matchStage.createdAt = {}
        if (timeframe.start) matchStage.createdAt.$gte = new Date(timeframe.start)
        if (timeframe.end) matchStage.createdAt.$lte = new Date(timeframe.end)
    }

    const result = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalBonus: { $sum: '$bonusRoyalty' },
                totalRegular: { $sum: '$regularRoyalty' },
                totalEarnings: { $sum: '$totalEarnings' }
            }
        }
    ])

    if (!result || result.length === 0) {
        return {
            totalBonus: 0,
            totalRegular: 0,
            totalEarnings: 0,
            percentage: { bonus: 0, regular: 0 }
        }
    }

    const data = result[0]
    return {
        totalBonus: data.totalBonus || 0,
        totalRegular: data.totalRegular || 0,
        totalEarnings: data.totalEarnings || 0,
        percentage: {
            bonus: data.totalEarnings > 0 ? ((data.totalBonus / data.totalEarnings) * 100).toFixed(2) : 0,
            regular: data.totalEarnings > 0 ? ((data.totalRegular / data.totalEarnings) * 100).toFixed(2) : 0
        }
    }
}

// Get bonus royalty performance metrics
royaltySchema.statics.getUserBonusPerformanceMetrics = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId, royaltyType: 'bonus' }

    if (timeframe.start || timeframe.end) {
        matchStage.createdAt = {}
        if (timeframe.start) matchStage.createdAt.$gte = new Date(timeframe.start)
        if (timeframe.end) matchStage.createdAt.$lte = new Date(timeframe.end)
    }

    const result = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: { year: '$reportYear', month: '$reportMonth' },
                totalBonus: { $sum: '$bonusRoyalty' },
                totalEarnings: { $sum: '$totalEarnings' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    if (!result || result.length === 0) {
        return {
            averageMonthly: 0,
            bestMonth: { month: null, amount: 0 },
            growthRate: 0
        }
    }

    const totalBonus = result.reduce((sum, r) => sum + r.totalBonus, 0)
    const averageMonthly = result.length > 0 ? totalBonus / result.length : 0

    const bestMonth = result.reduce((best, current) => {
        return current.totalBonus > best.totalBonus ? current : best
    }, result[0])

    let growthRate = 0
    if (result.length >= 2) {
        const firstMonth = result[0].totalBonus
        const lastMonth = result[result.length - 1].totalBonus
        if (firstMonth > 0) {
            growthRate = ((lastMonth - firstMonth) / firstMonth * 100).toFixed(2)
        }
    }

    return {
        averageMonthly,
        bestMonth: {
            month: `${bestMonth._id.month}-${bestMonth._id.year}`,
            amount: bestMonth.totalBonus
        },
        growthRate: parseFloat(growthRate)
    }
}

// Get platform performance for regular royalty
royaltySchema.statics.getUserPlatformPerformance = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId, royaltyType: 'regular' }

    if (timeframe.start || timeframe.end) {
        matchStage.createdAt = {}
        if (timeframe.start) matchStage.createdAt.$gte = new Date(timeframe.start)
        if (timeframe.end) matchStage.createdAt.$lte = new Date(timeframe.end)
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$platform',
                totalRevenue: { $sum: '$regularRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                uniqueTracks: { $addToSet: '$trackTitle' }
            }
        },
        {
            $project: {
                platform: '$_id',
                totalRevenue: 1,
                totalUnits: 1,
                trackCount: { $size: '$uniqueTracks' }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ])
}

// Get platform performance for bonus royalty
royaltySchema.statics.getUserBonusPlatformPerformance = async function(userAccountId, timeframe = {}) {
    const matchStage = { userAccountId, royaltyType: 'bonus' }

    if (timeframe.start || timeframe.end) {
        matchStage.createdAt = {}
        if (timeframe.start) matchStage.createdAt.$gte = new Date(timeframe.start)
        if (timeframe.end) matchStage.createdAt.$lte = new Date(timeframe.end)
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$platform',
                totalRevenue: { $sum: '$bonusRoyalty' },
                totalUnits: { $sum: '$totalUnits' },
                uniqueTracks: { $addToSet: '$trackTitle' }
            }
        },
        {
            $project: {
                platform: '$_id',
                totalRevenue: 1,
                totalUnits: 1,
                trackCount: { $size: '$uniqueTracks' }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ])
}

export default mongoose.model('Royalty', royaltySchema)