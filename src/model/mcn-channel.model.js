import mongoose from 'mongoose'
import { EMCNChannelStatus } from '../constant/application.js'

const mcnChannelSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        userAccountId: {
            type: String,
            required: true,
            index: true
        },
        mcnRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MCNRequest',
            required: true,
            index: true
        },
        channelName: {
            type: String,
            required: true,
            trim: true
        },
        channelLink: {
            type: String,
            required: true,
            trim: true
        },
        youtubeChannelId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true
        },
        revenueShare: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        channelManager: {
            type: String,
            required: true,
            trim: true
        },
        joinedDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        status: {
            type: String,
            enum: Object.values(EMCNChannelStatus),
            default: EMCNChannelStatus.ACTIVE,
            index: true
        },
        monthlyRevenue: {
            type: Number,
            default: 0,
            min: 0
        },
        totalRevenue: {
            type: Number,
            default: 0,
            min: 0
        },
        lastRevenueUpdate: {
            type: Date,
            default: null
        },
        notes: {
            type: String,
            trim: true,
            default: null
        },
        suspendedAt: {
            type: Date,
            default: null
        },
        suspensionReason: {
            type: String,
            trim: true,
            default: null
        },
        reactivatedAt: {
            type: Date,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true
    }
)

mcnChannelSchema.index({ userId: 1, status: 1 })
mcnChannelSchema.index({ userAccountId: 1, status: 1 })
mcnChannelSchema.index({ createdAt: -1 })
mcnChannelSchema.index({ status: 1, createdAt: -1 })
mcnChannelSchema.index({ channelManager: 1 })

mcnChannelSchema.methods.suspend = function(reason) {
    this.status = EMCNChannelStatus.SUSPENDED
    this.isActive = true
    this.suspendedAt = new Date()
    this.suspensionReason = reason
    return this.save()
}

mcnChannelSchema.methods.reactivate = function() {
    this.status = EMCNChannelStatus.ACTIVE
    this.isActive = true
    this.reactivatedAt = new Date()
    this.suspensionReason = null
    return this.save()
}

mcnChannelSchema.methods.deactivate = function() {
    this.status = EMCNChannelStatus.INACTIVE
    this.isActive = false
    return this.save()
}

mcnChannelSchema.methods.updateRevenue = function(monthlyRevenue, totalRevenue = null) {
    this.monthlyRevenue = monthlyRevenue
    if (totalRevenue !== null) {
        this.totalRevenue = totalRevenue
    }
    this.lastRevenueUpdate = new Date()
    return this.save()
}

mcnChannelSchema.statics.getUserChannels = function(userAccountId, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    return Promise.all([
        this.find({
            userAccountId,
            isActive: true
        })
        .populate('mcnRequestId', 'youtubeChannelName subscriberCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
        this.countDocuments({
            userAccountId,
            isActive: true
        })
    ])
}

mcnChannelSchema.statics.getChannelStats = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$totalRevenue' },
                avgRevenueShare: { $avg: '$revenueShare' }
            }
        }
    ])
}

mcnChannelSchema.statics.getChannelsByManager = function(channelManager, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    return Promise.all([
        this.find({
            channelManager,
            isActive: true
        })
        .populate('mcnRequestId', 'youtubeChannelName subscriberCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
        this.countDocuments({
            channelManager,
            isActive: true
        })
    ])
}

mcnChannelSchema.statics.getTopRevenueChannels = function(limit = 10) {
    return this.find({
        isActive: true,
        status: EMCNChannelStatus.ACTIVE
    })
    .populate('mcnRequestId', 'youtubeChannelName subscriberCount')
    .sort({ totalRevenue: -1 })
    .limit(limit)
    .lean()
}

const MCNChannel = mongoose.model('MCNChannel', mcnChannelSchema)

export default MCNChannel