import { Schema, model } from 'mongoose'

const aggregatorApplicationSchema = new Schema(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        emailAddress: {
            type: String,
            required: [true, 'Email address is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
        websiteLink: {
            type: String,
            default: null,
        },
        instagramUrl: {
            type: String,
            default: null,
        },
        facebookUrl: {
            type: String,
            default: null,
        },
        linkedinUrl: {
            type: String,
            default: null,
        },
        youtubeLink: {
            type: String,
            default: null,
        },
        popularReleaseLinks: [
            {
                type: String,
            },
        ],
        popularArtistLinks: [
            {
                type: String,
            },
        ],
        associatedLabels: [
            {
                type: String,
            },
        ],
        totalReleases: {
            type: Number,
            min: [0, 'Total releases cannot be negative'],
            default: 0,
        },
        releaseFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
            default: null,
        },
        monthlyReleasePlans: {
            type: Number,
            min: [0, 'Monthly release plans cannot be negative'],
            default: 0,
        },
        briefInfo: {
            type: String,
            maxlength: [1000, 'Brief info cannot exceed 1000 characters'],
            required: [true, 'Brief info is required'],
        },
        additionalServices: [
            {
                type: String,
                enum: ['music_marketing', 'youtube_cms', 'music_video_distribution'],
            },
        ],
        howDidYouKnow: {
            type: String,
            enum: ['social_media', 'friend', 'advertisement', 'other'],
            default: null,
        },
        howDidYouKnowOther: {
            type: String,
            default: null,
        },
        applicationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        adminNotes: {
            type: String,
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isAccountCreated: {
            type: Boolean,
            default: false,
        },
        createdAccountId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
)

aggregatorApplicationSchema.index({ applicationStatus: 1 })
aggregatorApplicationSchema.index({ createdAt: -1 })

export default model('AggregatorApplication', aggregatorApplicationSchema)