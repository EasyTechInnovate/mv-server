import mongoose, { Schema } from 'mongoose'
import { ESublabelMembershipStatus } from '../constant/application.js'
import quicker from '../util/quicker.js'

const sublabelSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
    },
    membershipStatus: {
        type: String,
        enum: Object.values(ESublabelMembershipStatus),
        default: ESublabelMembershipStatus.PENDING,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    contractStartDate: {
        type: Date,
        required: true
    },
    contractEndDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        maxlength: 500,
        trim: true
    },
    contactInfo: {
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true
})

sublabelSchema.index({ name: 1 })
sublabelSchema.index({ membershipStatus: 1 })
sublabelSchema.index({ isActive: 1 })


sublabelSchema.statics.getActiveSublabels = function() {
    return this.find({ 
        isActive: true, 
        membershipStatus: ESublabelMembershipStatus.ACTIVE,
        contractEndDate: { $gte: new Date() }
    })
}

sublabelSchema.statics.getDefaultSublabel = function() {
    return this.findOne({ name: 'Maheshwari Visual', isActive: true })
}

const Sublabel = mongoose.model('Sublabel', sublabelSchema)
export default Sublabel