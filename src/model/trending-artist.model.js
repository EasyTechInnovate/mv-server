import { Schema, model } from 'mongoose'
import { ETrendingArtistStatus } from '../constant/application.js'

const trendingArtistSchema = new Schema({
    artistNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50
    },
    artistName: {
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
    profileImageUrl: {
        type: String,
        trim: true,
        default: null
    },
    catalogUrls: {
        type: [String],
        default: [],
        validate: {
            validator: function(urls) {
                return urls.every(url => {
                    try {
                        new URL(url)
                        return true
                    } catch {
                        return false
                    }
                })
            },
            message: 'All catalog URLs must be valid URLs'
        }
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
        enum: Object.values(ETrendingArtistStatus),
        default: ETrendingArtistStatus.ACTIVE
    }
}, {
    timestamps: true
})

// artistNumber index is automatically created by unique: true
trendingArtistSchema.index({ status: 1 })
trendingArtistSchema.index({ monthlyStreams: -1 })
trendingArtistSchema.index({ totalReleases: -1 })

export default model('TrendingArtist', trendingArtistSchema)
