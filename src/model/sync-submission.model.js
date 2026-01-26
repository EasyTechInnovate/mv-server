import mongoose from 'mongoose'
import {
    EMarketingSubmissionStatus,
    EMusicGenre,
    EMusicMood,
    EMusicTheme,
    EMusicLanguage,
    EPROAffiliation,
    ESyncProjectSuitability
} from '../constant/application.js'

const syncSubmissionSchema = new mongoose.Schema(
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
            required: false,
            trim: true,
            uppercase: true
        },
        genres: [{
            type: String,
            enum: Object.values(EMusicGenre),
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
            required: false
        },
        theme: {
            type: String,
            enum: Object.values(EMusicTheme),
            required: true
        },
        masterRightsOwner: {
            type: String,
            required: true,
            trim: true
        },
        publishingRightsOwner: {
            type: String,
            required: true,
            trim: true
        },
        isFullyClearedForSync: {
            type: String,
            enum: ['true', 'false', 'unsure'],
            required: true
        },
        proAffiliation: {
            type: String,
            enum: Object.values(EPROAffiliation),
            required: false
        },
        trackLinks: [{
            platform: {
                type: String,
                required: true,
                trim: true
            },
            url: {
                type: String,
                required: true,
                trim: true
            }
        }],
        projectSuitability: [{
            type: String,
            enum: Object.values(ESyncProjectSuitability),
            required: true
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

syncSubmissionSchema.index({ userId: 1, status: 1 })
syncSubmissionSchema.index({ userAccountId: 1, status: 1 })
syncSubmissionSchema.index({ trackName: 'text', artistName: 'text', labelName: 'text' }, { default_language: 'none', language_override: 'textLanguage' })
syncSubmissionSchema.index({ createdAt: -1 })
syncSubmissionSchema.index({ status: 1, createdAt: -1 })

syncSubmissionSchema.methods.approve = function (reviewerId, adminNotes = null) {
    this.status = EMarketingSubmissionStatus.APPROVED
    this.reviewedBy = reviewerId
    this.reviewedAt = new Date()
    this.approvedAt = new Date()
    this.adminNotes = adminNotes
    return this.save()
}

syncSubmissionSchema.methods.reject = function (reviewerId, rejectionReason, adminNotes = null) {
    this.status = EMarketingSubmissionStatus.REJECTED
    this.reviewedBy = reviewerId
    this.reviewedAt = new Date()
    this.rejectedAt = new Date()
    this.rejectionReason = rejectionReason
    this.adminNotes = adminNotes
    return this.save()
}

syncSubmissionSchema.statics.getUserSubmissions = function (userAccountId, page = 1, limit = 10) {
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

syncSubmissionSchema.statics.getSubmissionStats = function () {
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

syncSubmissionSchema.statics.getPendingSubmissions = function (page = 1, limit = 10) {
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

const SyncSubmission = mongoose.model('SyncSubmission', syncSubmissionSchema)

export default SyncSubmission