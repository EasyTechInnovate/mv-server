import mongoose from 'mongoose'
import { EStreamingPlatform, EUsageType } from '../constant/application.js'

const analyticsSchema = new mongoose.Schema({
    userAccountId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    // Basic track information
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
        enum: Object.values(EStreamingPlatform),
        required: true
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
    // Analytics data
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
    usageType: {
        type: String,
        enum: Object.values(EUsageType),
        required: true,
        default: EUsageType.STREAM
    },
    // Revenue calculation (will be calculated based on platform rates)
    estimatedRevenue: {
        type: Number,
        min: 0,
        default: 0
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
analyticsSchema.index({ userAccountId: 1, monthId: 1 })
analyticsSchema.index({ platform: 1 })
analyticsSchema.index({ countryCode: 1 })
analyticsSchema.index({ trackTitle: 1, artistName: 1 })
analyticsSchema.index({ reportMonth: 1, reportYear: 1 })
analyticsSchema.index({ totalUnits: -1 })
analyticsSchema.index({ estimatedRevenue: -1 })
analyticsSchema.index({ createdAt: -1 })

// Virtual for full country name (would need country mapping)
analyticsSchema.virtual('countryName').get(function() {
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

// Static methods for analytics calculations
analyticsSchema.statics.getUserTotalStreams = async function(userAccountId, timeframe = {}) {
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
                totalStreams: { $sum: '$totalUnits' },
                totalRevenue: { $sum: '$estimatedRevenue' },
                uniqueTracks: { $addToSet: '$trackTitle' },
                uniqueCountries: { $addToSet: '$countryCode' },
                uniquePlatforms: { $addToSet: '$platform' }
            }
        },
        {
            $project: {
                _id: 0,
                totalStreams: 1,
                totalRevenue: 1,
                uniqueTracksCount: { $size: '$uniqueTracks' },
                uniqueCountriesCount: { $size: '$uniqueCountries' },
                uniquePlatformsCount: { $size: '$uniquePlatforms' },
                uniqueCountries: 1,
                uniquePlatforms: 1
            }
        }
    ])

    return result[0] || {
        totalStreams: 0,
        totalRevenue: 0,
        uniqueTracksCount: 0,
        uniqueCountriesCount: 0,
        uniquePlatformsCount: 0,
        uniqueCountries: [],
        uniquePlatforms: []
    }
}

analyticsSchema.statics.getTopTracks = async function(userAccountId, limit = 10, timeframe = {}) {
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
                totalStreams: { $sum: '$totalUnits' },
                totalRevenue: { $sum: '$estimatedRevenue' },
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
                totalStreams: 1,
                totalRevenue: 1,
                platformCount: { $size: '$platforms' },
                countryCount: { $size: '$countries' },
                platforms: 1
            }
        },
        { $sort: { totalStreams: -1 } },
        { $limit: limit }
    ])
}

analyticsSchema.statics.getPlatformDistribution = async function(userAccountId, timeframe = {}) {
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
                totalStreams: { $sum: '$totalUnits' },
                totalRevenue: { $sum: '$estimatedRevenue' },
                trackCount: { $addToSet: '$trackTitle' }
            }
        },
        {
            $project: {
                _id: 0,
                platform: '$_id',
                totalStreams: 1,
                totalRevenue: 1,
                trackCount: { $size: '$trackCount' }
            }
        },
        { $sort: { totalStreams: -1 } }
    ])
}

analyticsSchema.statics.getCountryDistribution = async function(userAccountId, limit = 20, timeframe = {}) {
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
                _id: '$countryCode',
                totalStreams: { $sum: '$totalUnits' },
                totalRevenue: { $sum: '$estimatedRevenue' },
                trackCount: { $addToSet: '$trackTitle' }
            }
        },
        {
            $project: {
                _id: 0,
                countryCode: '$_id',
                totalStreams: 1,
                totalRevenue: 1,
                trackCount: { $size: '$trackCount' }
            }
        },
        { $sort: { totalStreams: -1 } },
        { $limit: limit }
    ])
}

analyticsSchema.statics.getStreamOverTime = async function(userAccountId, groupBy = 'month', timeframe = {}) {
    const matchStage = { userAccountId }

    if (timeframe.startDate || timeframe.endDate) {
        matchStage.createdAt = {}
        if (timeframe.startDate) matchStage.createdAt.$gte = new Date(timeframe.startDate)
        if (timeframe.endDate) matchStage.createdAt.$lte = new Date(timeframe.endDate)
    }

    const groupStage = {
        _id: {
            year: '$reportYear',
            month: '$reportMonth'
        },
        totalStreams: { $sum: '$totalUnits' },
        totalRevenue: { $sum: '$estimatedRevenue' },
        uniqueTracks: { $addToSet: '$trackTitle' }
    }

    return await this.aggregate([
        { $match: matchStage },
        { $group: groupStage },
        {
            $project: {
                _id: 0,
                period: {
                    year: '$_id.year',
                    month: '$_id.month'
                },
                totalStreams: 1,
                totalRevenue: 1,
                uniqueTracksCount: { $size: '$uniqueTracks' }
            }
        },
        { $sort: { 'period.year': 1, 'period.month': 1 } }
    ])
}

// Additional methods needed by the analytics dashboard controller

analyticsSchema.statics.getUserTotalRevenue = async function(userAccountId, timeframe = {}) {
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
                totalRevenue: { $sum: '$estimatedRevenue' }
            }
        }
    ])

    return result[0]?.totalRevenue || 0
}

analyticsSchema.statics.getUserCountriesReached = async function(userAccountId, timeframe = {}) {
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
                uniqueCountries: { $addToSet: '$countryCode' }
            }
        },
        {
            $project: {
                _id: 0,
                countriesCount: { $size: '$uniqueCountries' }
            }
        }
    ])

    return result[0]?.countriesCount || 0
}

analyticsSchema.statics.getUserActiveListeners = async function(userAccountId, timeframe = {}) {
    // For analytics, we'll estimate active listeners based on stream count
    // This is a simplified calculation - in real scenarios you'd have more detailed listener data
    const totalStreams = await this.getUserTotalStreams(userAccountId, timeframe)

    // Rough estimation: 1 active listener for every 10 streams
    return Math.round(totalStreams.totalStreams / 10)
}

analyticsSchema.statics.getUserStreamsOverTime = async function(userAccountId, timeframe = {}) {
    return await this.getStreamOverTime(userAccountId, timeframe.groupBy || 'day', timeframe)
}

analyticsSchema.statics.getUserTopTracks = async function(userAccountId, timeframe = {}) {
    return await this.getTopTracks(userAccountId, timeframe.limit || 10, timeframe)
}

analyticsSchema.statics.getUserPlatformDistribution = async function(userAccountId, timeframe = {}) {
    return await this.getPlatformDistribution(userAccountId, timeframe)
}

analyticsSchema.statics.getUserCountryDistribution = async function(userAccountId, timeframe = {}) {
    return await this.getCountryDistribution(userAccountId, timeframe.limit || 20, timeframe)
}

analyticsSchema.statics.getUserRevenueOverTime = async function(userAccountId, timeframe = {}) {
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
                totalRevenue: { $sum: '$estimatedRevenue' },
                totalStreams: { $sum: '$totalUnits' }
            }
        },
        {
            $project: {
                _id: 0,
                period: {
                    year: '$_id.year',
                    month: '$_id.month'
                },
                totalRevenue: 1,
                totalStreams: 1
            }
        },
        { $sort: { 'period.year': 1, 'period.month': 1 } }
    ])
}

analyticsSchema.statics.getUserListenersByCountry = async function(userAccountId, timeframe = {}) {
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
                _id: '$countryCode',
                totalStreams: { $sum: '$totalUnits' },
                estimatedListeners: { $sum: { $divide: ['$totalUnits', 10] } } // Rough estimation
            }
        },
        {
            $project: {
                _id: 0,
                countryCode: '$_id',
                totalStreams: 1,
                estimatedListeners: { $round: '$estimatedListeners' }
            }
        },
        { $sort: { estimatedListeners: -1 } },
        { $limit: timeframe.limit || 10 }
    ])
}

analyticsSchema.statics.getUserListenersByPlatform = async function(userAccountId, timeframe = {}) {
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
                totalStreams: { $sum: '$totalUnits' },
                estimatedListeners: { $sum: { $divide: ['$totalUnits', 10] } } // Rough estimation
            }
        },
        {
            $project: {
                _id: 0,
                platform: '$_id',
                totalStreams: 1,
                estimatedListeners: { $round: '$estimatedListeners' }
            }
        },
        { $sort: { estimatedListeners: -1 } }
    ])
}

analyticsSchema.statics.getUserRevenueBySources = async function(userAccountId, timeframe = {}) {
    return await this.getPlatformDistribution(userAccountId, timeframe)
}

analyticsSchema.statics.getUserPerformanceMetrics = async function(userAccountId, timeframe = {}) {
    const totalStreamsResult = await this.getUserTotalStreams(userAccountId, timeframe)
    const totalRevenue = await this.getUserTotalRevenue(userAccountId, timeframe)
    const activeListeners = await this.getUserActiveListeners(userAccountId, timeframe)

    return {
        totalStreams: totalStreamsResult.totalStreams,
        totalRevenue,
        activeListeners,
        uniqueCountries: totalStreamsResult.uniqueCountriesCount,
        uniquePlatforms: totalStreamsResult.uniquePlatformsCount,
        uniqueTracks: totalStreamsResult.uniqueTracksCount
    }
}

export default mongoose.model('Analytics', analyticsSchema)