import { Schema, model } from 'mongoose'
import { ETrendingLabelStatus } from '../constant/application.js'

const trendingLabelSchema = new Schema({
    labelNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50
    },
    labelName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    designation: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    logoUrl: {
        type: String,
        trim: true,
        default: null
    },
    totalArtists: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    totalReleases: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    monthlyStreams: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: Object.values(ETrendingLabelStatus),
        default: ETrendingLabelStatus.ACTIVE
    }
}, {
    timestamps: true
})

// labelNumber index is automatically created by unique: true
trendingLabelSchema.index({ status: 1 })
trendingLabelSchema.index({ monthlyStreams: -1 })
trendingLabelSchema.index({ totalReleases: -1 })

export default model('TrendingLabel', trendingLabelSchema)