import { Schema, model } from 'mongoose'

const newsSchema = new Schema({
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    articleUrl: {
        type: String,
        required: true,
        trim: true
    },
    display: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

newsSchema.index({ display: 1 })
newsSchema.index({ order: 1 })
newsSchema.index({ createdAt: -1 })

export default model('News', newsSchema)
