import { Schema, model } from 'mongoose'
import { ECompanySettingsStatus } from '../constant/application.js'

const companySettingsSchema = new Schema({
    // Social Media Links
    socialMedia: {
        instagram: {
            type: String,
            trim: true,
            default: null
        },
        facebook: {
            type: String,
            trim: true,
            default: null
        },
        linkedin: {
            type: String,
            trim: true,
            default: null
        },
        youtube: {
            type: String,
            trim: true,
            default: null
        },
        website: {
            type: String,
            trim: true,
            default: null
        },
        x: {
            type: String,
            trim: true,
            default: null
        },
        youtubeLinks: [{
            title: {
                type: String,
                trim: true,
                maxlength: 100
            },
            url: {
                type: String,
                trim: true
            }
        }]
    },

    // Contact Information
    contactInfo: {
        primaryPhone: {
            type: String,
            trim: true,
            default: null
        },
        secondaryPhone: {
            type: String,
            trim: true,
            default: null
        },
        primaryEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: null
        },
        supportEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: null
        },
        businessEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: null
        },
        pressEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: null
        },
        legalEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: null
        },
        whatsappQRCode: {
            type: String,
            trim: true,
            default: null
        },
        physicalAddress: {
            street: {
                type: String,
                trim: true,
                default: null
            },
            city: {
                type: String,
                trim: true,
                default: null
            },
            state: {
                type: String,
                trim: true,
                default: null
            },
            zipCode: {
                type: String,
                trim: true,
                default: null
            },
            country: {
                type: String,
                trim: true,
                default: null
            }
        },
        businessHours: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null
        }
    },

    status: {
        type: String,
        enum: Object.values(ECompanySettingsStatus),
        default: ECompanySettingsStatus.ACTIVE
    },

    isSetupComplete: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

// Index for quick lookup
companySettingsSchema.index({ status: 1 })
companySettingsSchema.index({ isSetupComplete: 1 })

// Method to check if setup is complete
companySettingsSchema.methods.checkSetupComplete = function() {
    const required = [
        this.socialMedia?.instagram,
        this.socialMedia?.facebook,
        this.contactInfo?.primaryPhone,
        this.contactInfo?.primaryEmail,
        this.contactInfo?.physicalAddress?.street,
        this.contactInfo?.physicalAddress?.city,
        this.contactInfo?.businessHours
    ]

    const isComplete = required.every(field => field && field.trim() !== '')
    this.isSetupComplete = isComplete
    return isComplete
}

// Pre-save middleware to update setup status
companySettingsSchema.pre('save', function(next) {
    this.checkSetupComplete()
    next()
})

export default model('CompanySettings', companySettingsSchema)