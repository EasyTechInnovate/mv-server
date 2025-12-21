import mongoose from 'mongoose'
import {
    EMarketingSubmissionStatus,
    EMusicGenres,
    EMusicMood,
    EMusicTheme,
    EMusicLanguage,
    EStreamingPlatform
} from '../constant/application.js'

const playlistPitchingSchema = new mongoose.Schema(
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
        trackName: {
            type: String,
            required: true,
            trim: true
        },
        artistName: {
            type: String,
            required: true,
            trim: true
        },
        labelName: {
            type: String,
            required: true,
            trim: true
        },
        isrc: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        genres: [{
            type: String,
            enum: Object.values(EMusicGenres),
            required: true
        }],
        mood: {
            type: String,
            enum: Object.values(EMusicMood),
            required: true
        },
        isVocalsPresent: {
            type: Boolean,
            required: true
        },
        language: {
            type: String,
            enum: Object.values(EMusicLanguage),
            required: true
        },
        theme: {
            type: String,
            enum: Object.values(EMusicTheme),
            required: true
        },
        selectedStore: {
            type: String,
            enum: Object.values(EStreamingPlatform),
            required: true
        },
        trackLinks: [{
            platform: {
                type: String,
                enum: Object.values(EStreamingPlatform),
                required: true
            },
            url: {
                type: String,
                required: true,
                trim: true
            }
        }],
        status: {
            type: String,
            enum: Object.values(EMarketingSubmissionStatus),
            default: EMarketingSubmissionStatus.PENDING,
            index: true
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
        reviewedBy: {
            type: String,
            default: null
        },
        reviewedAt: {
            type: Date,
            default: null
        },
        approvedAt: {
            type: Date,
            default: null
        },
        rejectedAt: {
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

playlistPitchingSchema.index({ userId: 1, status: 1 })
playlistPitchingSchema.index({ userAccountId: 1, status: 1 })
playlistPitchingSchema.index({ trackName: 'text', artistName: 'text', labelName: 'text' })
playlistPitchingSchema.index({ createdAt: -1 })
playlistPitchingSchema.index({ status: 1, createdAt: -1 })
playlistPitchingSchema.index({ selectedStore: 1 })

playlistPitchingSchema.methods.approve = function(reviewerId, adminNotes = null) {
    this.status = EMarketingSubmissionStatus.APPROVED
    this.reviewedBy = reviewerId
    this.reviewedAt = new Date()
    this.approvedAt = new Date()
    this.adminNotes = adminNotes
    return this.save()
}

playlistPitchingSchema.methods.reject = function(reviewerId, rejectionReason, adminNotes = null) {
    this.status = EMarketingSubmissionStatus.REJECTED
    this.reviewedBy = reviewerId
    this.reviewedAt = new Date()
    this.rejectedAt = new Date()
    this.rejectionReason = rejectionReason
    this.adminNotes = adminNotes
    return this.save()
}

playlistPitchingSchema.statics.getUserSubmissions = function(userAccountId, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    return Promise.all([
        this.find({
            userAccountId,
            isActive: true
        })
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

playlistPitchingSchema.statics.getSubmissionStats = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ])
}

playlistPitchingSchema.statics.getPendingSubmissions = function(page = 1, limit = 10) {
    const skip = (page - 1) * limit
    return Promise.all([
        this.find({
            status: EMarketingSubmissionStatus.PENDING,
            isActive: true
        })
        .populate('userId', 'firstName lastName email accountId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
        this.countDocuments({
            status: EMarketingSubmissionStatus.PENDING,
            isActive: true
        })
    ])
}

playlistPitchingSchema.statics.getSubmissionsByStore = function(store, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    return Promise.all([
        this.find({
            selectedStore: store,
            isActive: true
        })
        .populate('userId', 'firstName lastName email accountId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
        this.countDocuments({
            selectedStore: store,
            isActive: true
        })
    ])
}

const PlaylistPitching = mongoose.model('PlaylistPitching', playlistPitchingSchema)

export default PlaylistPitching