import mongoose from 'mongoose'
import { ESubscriptionPlan } from '../constant/application.js'

const subscriptionPlanSchema = new mongoose.Schema({
    planId: {
        type: String,
        enum: Object.values(ESubscriptionPlan),
        required: [true, 'Plan ID is required']
    },
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Plan description is required'],
        trim: true
    },
    price: {
        current: {
            type: Number,
            required: [true, 'Current price is required'],
            min: [0, 'Price cannot be negative']
        },
        original: {
            type: Number,
            required: [true, 'Original price is required'],
            min: [0, 'Price cannot be negative']
        }
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true
    },
    interval: {
        type: String,
        enum: ['month', 'year'],
        required: [true, 'Billing interval is required']
    },
    intervalCount: {
        type: Number,
        default: 1,
        min: [1, 'Interval count must be at least 1']
    },
    features: {
        unlimitedReleases: {
            type: Boolean,
            default: false
        },
        artistProfile: {
            type: Boolean,
            default: true
        },
        collaborateWithOthers: {
            type: Boolean,
            default: false
        },
        revenueShare: {
            percentage: {
                type: Number,
                min: [0, 'Revenue share cannot be negative'],
                max: [100, 'Revenue share cannot exceed 100%']
            },
            description: {
                type: String,
                default: null
            }
        },
        metaContentId: {
            type: Boolean,
            default: false
        },
        youtubeContentId: {
            type: Boolean,
            default: false
        },
        analyticsDemo: {
            type: Boolean,
            default: false
        },
        spotifyDiscoveryMode: {
            type: Boolean,
            default: false
        },
        assistedPlaylists: {
            type: Boolean,
            default: false
        },
        preReleasePromo: {
            type: Boolean,
            default: false
        },
        freeUpcCode: {
            type: Boolean,
            default: false
        },
        freeIsrcCode: {
            type: Boolean,
            default: false
        },
        lifetimeAvailability: {
            type: Boolean,
            default: false
        },
        supportHours: {
            type: String,
            enum: ['24_hours', '48_hours', '72_hours'],
            default: '72_hours'
        },
        businessHours: {
            type: Boolean,
            default: false
        },
        liveSupport: {
            type: Boolean,
            default: false
        },
        dailyArtistDistribution: {
            type: Boolean,
            default: false
        },
        worldwideAvailability: {
            type: Boolean,
            default: true
        },
        analyticsCenter: {
            type: Boolean,
            default: false
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    isBestValue: {
        type: Boolean,
        default: false
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    razorpayPlanId: {
        type: String,
        default: null
    },
    limits: {
        maxUploads: {
            type: Number,
            default: -1
        },
        maxCollaborators: {
            type: Number,
            default: 1
        },
        maxDistributionChannels: {
            type: Number,
            default: 10
        }
    },
    trial: {
        enabled: {
            type: Boolean,
            default: false
        },
        days: {
            type: Number,
            default: 0
        }
    },
    discount: {
        enabled: {
            type: Boolean,
            default: false
        },
        percentage: {
            type: Number,
            min: [0, 'Discount cannot be negative'],
            max: [100, 'Discount cannot exceed 100%'],
            default: 0
        },
        validUntil: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
})

subscriptionPlanSchema.index({ planId: 1 }, { unique: true })
subscriptionPlanSchema.index({ isActive: 1 })
subscriptionPlanSchema.index({ displayOrder: 1 })
subscriptionPlanSchema.index({ 'price.current': 1 })

subscriptionPlanSchema.virtual('discountedPrice').get(function() {
    if (this.discount.enabled && this.discount.percentage > 0) {
        return Math.round(this.price.current * (1 - this.discount.percentage / 100))
    }
    return this.price.current
})

subscriptionPlanSchema.statics.getActivePlans = function() {
    return this.find({ isActive: true }).sort({ displayOrder: 1 })
}

subscriptionPlanSchema.statics.getPlanByPlanId = function(planId) {
    return this.findOne({ planId, isActive: true })
}

subscriptionPlanSchema.methods.isTrialAvailable = function() {
    return this.trial.enabled && this.trial.days > 0
}

subscriptionPlanSchema.methods.getEffectivePrice = function() {
    return this.discountedPrice
}

subscriptionPlanSchema.methods.hasFeature = function(featureName) {
    return !!this.features[featureName]
}

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema)