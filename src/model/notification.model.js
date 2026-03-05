import mongoose from 'mongoose'
import { ENotificationCategory, ENotificationTargetType } from '../constant/application.js'

const readBySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    readAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false })

const notificationSchema = new mongoose.Schema({
    notificationId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['system', 'custom'],
        required: true
    },
    category: {
        type: String,
        enum: Object.values(ENotificationCategory),
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: Boolean,
        default: true    // admin can toggle false = hidden from users
    },
    targetType: {
        type: String,
        enum: Object.values(ENotificationTargetType),
        required: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    readBy: [readBySchema],
    readCount: {
        type: Number,
        default: 0,
        min: 0
    },
    metadata: {
        releaseId: { type: String, trim: true },
        releaseName: { type: String, trim: true },
        reportType: { type: String, trim: true },
        monthName: { type: String, trim: true }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// Indexes
notificationSchema.index({ notificationId: 1 })
notificationSchema.index({ targetUser: 1, status: 1, createdAt: -1 })
notificationSchema.index({ targetUsers: 1, status: 1, createdAt: -1 })
notificationSchema.index({ targetType: 1, status: 1, createdAt: -1 })
notificationSchema.index({ createdAt: -1 })

// Build the query for notifications visible to a user
function buildUserQuery(userId, userType) {
    return {
        status: true,
        isActive: true,
        $or: [
            { targetType: 'specific_user', targetUser: userId },
            { targetType: 'specific_user', targetUsers: userId },
            { targetType: 'all_users' },
            ...(userType === 'artist' ? [{ targetType: 'all_artists' }] : []),
            ...(userType === 'label' ? [{ targetType: 'all_labels' }] : []),
            ...(userType === 'aggregator' ? [{ targetType: 'all_aggregators' }] : [])
        ]
    }
}

// Static: get notifications for a user
notificationSchema.statics.findForUser = function (userId, userType, { page = 1, limit = 20 } = {}) {
    const query = buildUserQuery(userId, userType)
    const skip = (page - 1) * limit
    return this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
}

// Static: count total for pagination
notificationSchema.statics.countForUser = function (userId, userType) {
    return this.countDocuments(buildUserQuery(userId, userType))
}

// Static: get unread count (notification visible but userId NOT in readBy)
notificationSchema.statics.getUnreadCount = function (userId, userType) {
    const query = buildUserQuery(userId, userType)
    query['readBy.userId'] = { $ne: userId }
    return this.countDocuments(query)
}

// Instance: mark read by a specific user
notificationSchema.methods.markReadByUser = async function (userId) {
    const alreadyRead = this.readBy.some(r => r.userId.toString() === userId.toString())
    if (!alreadyRead) {
        this.readBy.push({ userId, readAt: new Date() })
        this.readCount += 1
        await this.save()
    }
    return this
}

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
