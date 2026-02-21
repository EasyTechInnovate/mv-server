import mongoose, { Schema } from 'mongoose'
import quicker from '../util/quicker.js'
import { 
    EReleaseStatus, 
    EAdvancedReleaseType, 
    EReleasePricingTier,
    EAdvancedReleaseStep,
    EMusicGenre,
    EMusicLanguage,
    ETerritories,
    EDistributionPartners
} from '../constant/application.js'

const contributorSchema = new Schema({
    profession: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    contributors: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    }
}, { _id: false })

// Schema for track data within an advanced release
const trackSchema = new Schema({
    trackLink: {
        type: String,
        required: false,
        trim: true
    },
    trackName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    mixVersion: {
        type: String,
        trim: true,
        maxlength: 100
    },
    primaryArtists: [{
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    }],
    featuringArtists: [{
        type: String,
        trim: true,
        maxlength: 100
    }],
    contributorsToSoundRecording: [contributorSchema],
    contributorsToMusicalWork: [contributorSchema],
    needsISRC: {
        type: Boolean,
        default: false
    },
    isrcCode: {
        type: String,
        trim: true,
        maxlength: 20
    },
    adminProvidedISRC: {
        type: String,
        trim: true,
        maxlength: 20
    },
    previewStartTiming: {
        type: Number,
        min: 0,
        max: 600
    },
    callertuneStartTiming: {
        type: Number,
        min: 0,
        max: 600
    },
    primaryGenre: {
        type: String,
        enum: Object.values(EMusicGenre),
        required: true
    },
    secondaryGenre: {
        type: String,
        enum: Object.values(EMusicGenre)
    },
    hasHumanVocals: {
        type: Boolean,
        default: true
    },
    language: {
        type: String,
        enum: Object.values(EMusicLanguage),
        required: false
    },
    vocalType: {
        type: String,
        trim: true,
        maxlength: 200
    },
    isAvailableForDownload: {
        type: Boolean,
        default: true
    }
}, { _id: true })

const advancedReleaseSchema = new Schema({
    releaseId: {
        type: String,
        unique: true,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountId: {
        type: String,
        required: true
    },
    releaseType: {
        type: String,
        enum: Object.values(EAdvancedReleaseType),
        required: true
    },
    releaseStatus: {
        type: String,
        enum: Object.values(EReleaseStatus),
        default: EReleaseStatus.DRAFT
    },
    currentStep: {
        type: String,
        enum: Object.values(EAdvancedReleaseStep),
        default: EAdvancedReleaseStep.COVER_ART_AND_RELEASE_INFO
    },
    
    step1: {
        isCompleted: {
            type: Boolean,
            default: false
        },
        completedAt: {
            type: Date
        },
        coverArt: {
            imageUrl: {
                type: String,
                trim: true
            },
            imageSize: {
                type: Number
            },
            imageFormat: {
                type: String,
                enum: ['jpg', 'jpeg', 'png', 'webp']
            }
        },
        releaseInfo: {
            releaseName: {
                type: String,
                trim: true,
                maxlength: 200
            },
            releaseVersion: {
                type: String,
                trim: true,
                maxlength: 50
            },
            catalog: {
                type: String,
                trim: true,
                maxlength: 50
            },
            releaseType: {
                type: String,
                enum: Object.values(EAdvancedReleaseType)
            },
            primaryArtists: [{
                type: String,
                trim: true,
                maxlength: 100
            }],
            variousArtists: [{
                type: String,
                trim: true,
                maxlength: 100
            }],
            featuringArtists: [{
                type: String,
                trim: true,
                maxlength: 100
            }],
            needsUPC: {
                type: Boolean,
                default: false
            },
            upcCode: {
                type: String,
                trim: true,
                maxlength: 20
            },
            adminProvidedUPC: {
                type: String,
                trim: true,
                maxlength: 20
            },
            primaryGenre: {
                type: String,
                enum: Object.values(EMusicGenre)
            },
            secondaryGenre: {
                type: String,
                enum: Object.values(EMusicGenre)
            },
            labelName: {
                type: Schema.Types.ObjectId,
                ref: 'Sublabel'
            },
            cLine: {
                year: {
                    type: Number,
                    min: 1900,
                    max: new Date().getFullYear() + 10
                },
                text: {
                    type: String,
                    trim: true,
                    maxlength: 200
                }
            },
            pLine: {
                year: {
                    type: Number,
                    min: 1900,
                    max: new Date().getFullYear() + 10
                },
                text: {
                    type: String,
                    trim: true,
                    maxlength: 200
                }
            },
            releasePricingTier: {
                type: String,
                enum: Object.values(EReleasePricingTier)
            }
        }
    },

    step2: {
        isCompleted: {
            type: Boolean,
            default: false
        },
        completedAt: {
            type: Date
        },
        tracks: [trackSchema]
    },

    step3: {
        isCompleted: {
            type: Boolean,
            default: false
        },
        completedAt: {
            type: Date
        },
        deliveryDetails: {
            forFutureRelease: {
                type: Date
            },
            forPastRelease: {
                type: Date
            }
        },
        territorialRights: {
            territories: [{
                type: String,
                enum: Object.values(ETerritories)
            }],
            isWorldwide: {
                type: Boolean,
                default: false
            }
        },
        distributionPartners: [{
            type: String,
            enum: Object.values(EDistributionPartners)
        }],
        copyrightOptions: {
            proceedWithoutCopyright: {
                type: Boolean,
                default: false
            },
            copyrightDocumentLink: {
                type: String,
                trim: true
            },
            ownsCopyrights: {
                type: Boolean,
                default: false
            },
            ownedCopyrightDocumentLink: {
                type: String,
                trim: true
            }
        }
    },

    adminReview: {
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        reviewedAt: {
            type: Date,
            default: null
        },
        adminNotes: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    
    submittedAt: {
        type: Date,
        default: null
    },
    
    publishedAt: {
        type: Date,
        default: null
    },
    
    liveAt: {
        type: Date,
        default: null
    },
    
    updateRequest: {
        requestedAt: {
            type: Date,
            default: null
        },
        requestReason: {
            type: String,
            trim: true,
            maxlength: 500
        },
        requestedChanges: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    
    takeDown: {
        requestedAt: {
            type: Date,
            default: null
        },
        reason: {
            type: String,
            trim: true,
            maxlength: 500
        },
        processedAt: {
            type: Date,
            default: null
        },
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    
    totalSteps: {
        type: Number,
        default: 3,
        min: 3,
        max: 3
    },
    
    completedSteps: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },

    audioFootprinting: [{
        trackId: { type: Schema.Types.ObjectId, default: null },
        trackName: { type: String, trim: true, default: null },
        matchPercentage: { type: Number, min: 0, max: 100, default: null },
        title: { type: String, trim: true, default: null },
        label: { type: String, trim: true, default: null },
        artists: { type: [String], default: [] },
        album: { type: String, trim: true, default: null },
        releaseDate: { type: String, default: null },
        durationMs: { type: Number, default: null },
        matchTime: {
            startMs: { type: Number, default: null },
            dbStartMs: { type: Number, default: null },
            dbEndMs: { type: Number, default: null }
        },
        externalIds: {
            isrc: { type: String, trim: true, uppercase: true, default: null },
            upc: { type: String, trim: true, default: null }
        },
        streamingLinks: {
            spotify: { type: String, trim: true, default: null },
            deezer: { type: String, trim: true, default: null }
        },
        genres: { type: [String], default: [] },
        checkedAt: { type: Date, default: Date.now },
        checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    }],

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
})

advancedReleaseSchema.index({ userId: 1 })
advancedReleaseSchema.index({ accountId: 1 })
advancedReleaseSchema.index({ releaseStatus: 1 })
advancedReleaseSchema.index({ releaseType: 1 })
advancedReleaseSchema.index({ currentStep: 1 })
advancedReleaseSchema.index({ isActive: 1 })
advancedReleaseSchema.index({ userId: 1, releaseStatus: 1 })
advancedReleaseSchema.index({ userId: 1, releaseType: 1 })
advancedReleaseSchema.index({ releaseStatus: 1, createdAt: -1 })
advancedReleaseSchema.index({ userId: 1, createdAt: -1 })
advancedReleaseSchema.index({ 'step1.releaseInfo.releaseName': 'text' }, { default_language: 'none', language_override: 'textLanguage' })
advancedReleaseSchema.index({ submittedAt: -1 })
advancedReleaseSchema.index({ publishedAt: -1 })
advancedReleaseSchema.index({ liveAt: -1 })
advancedReleaseSchema.index({ createdAt: -1 })

advancedReleaseSchema.virtual('isReadyForSubmission').get(function() {
    return this.step1.isCompleted && this.step2.isCompleted && this.step3.isCompleted
})

advancedReleaseSchema.virtual('completionPercentage').get(function() {
    return Math.round((this.completedSteps / this.totalSteps) * 100)
})

advancedReleaseSchema.virtual('trackCount').get(function() {
    return this.step2.tracks ? this.step2.tracks.length : 0
})

advancedReleaseSchema.pre('save', async function(next) {
    if (this.isNew && !this.releaseId) {
        this.releaseId = await quicker.generateReleaseId('advance', this.releaseType, this.constructor)
    }
    next()
})

advancedReleaseSchema.methods.completeStep = function(stepNumber) {
    const stepKey = `step${stepNumber}`
    if (this[stepKey] && !this[stepKey].isCompleted) {
        this[stepKey].isCompleted = true
        this[stepKey].completedAt = new Date()
        this.completedSteps += 1
        
        // Update currentStep to next step
        switch(stepNumber) {
            case 1:
                this.currentStep = EAdvancedReleaseStep.TRACKS_AND_AUDIO
                break
            case 2:
                this.currentStep = EAdvancedReleaseStep.DELIVERY_AND_RIGHTS
                break
            case 3:
                // Keep as is, all steps completed
                break
        }
    }
    return this
}

advancedReleaseSchema.methods.submitForReview = function() {
    if (this.isReadyForSubmission) {
        this.releaseStatus = EReleaseStatus.SUBMITTED
        this.submittedAt = new Date()
    }
    return this
}

advancedReleaseSchema.methods.approveForProcessing = function() {
    this.releaseStatus = EReleaseStatus.UNDER_REVIEW
    return this
}

advancedReleaseSchema.methods.startProcessing = function() {
    this.releaseStatus = EReleaseStatus.PROCESSING
    return this
}

advancedReleaseSchema.methods.publishRelease = function() {
    this.releaseStatus = EReleaseStatus.PUBLISHED
    this.publishedAt = new Date()
    return this
}

advancedReleaseSchema.methods.goLive = function() {
    this.releaseStatus = EReleaseStatus.LIVE
    this.liveAt = new Date()
    return this
}

advancedReleaseSchema.methods.rejectRelease = function(reason, reviewedBy = null) {
    this.releaseStatus = EReleaseStatus.REJECTED
    this.adminReview.rejectionReason = reason
    this.adminReview.reviewedAt = new Date()
    if (reviewedBy) {
        this.adminReview.reviewedBy = reviewedBy
    }
    return this
}

advancedReleaseSchema.methods.requestUpdate = function(reason, changes) {
    this.releaseStatus = EReleaseStatus.UPDATE_REQUEST
    this.updateRequest.requestedAt = new Date()
    this.updateRequest.requestReason = reason
    this.updateRequest.requestedChanges = changes
    return this
}

advancedReleaseSchema.methods.requestTakedown = function(reason) {
    this.releaseStatus = EReleaseStatus.TAKE_DOWN
    this.takeDown.requestedAt = new Date()
    this.takeDown.reason = reason
    return this
}

advancedReleaseSchema.methods.processTakedown = function(processedBy = null) {
    this.takeDown.processedAt = new Date()
    if (processedBy) {
        this.takeDown.processedBy = processedBy
    }
    return this
}

advancedReleaseSchema.statics.findByStatus = function(status) {
    return this.find({ releaseStatus: status, isActive: true })
}

advancedReleaseSchema.statics.findByUser = function(userId) {
    return this.find({ userId, isActive: true })
}

advancedReleaseSchema.statics.findPendingReviews = function() {
    return this.find({ 
        releaseStatus: EReleaseStatus.SUBMITTED,
        isActive: true 
    }).populate('userId', 'firstName lastName emailAddress')
}

const AdvancedRelease = mongoose.model('AdvancedRelease', advancedReleaseSchema)
export default AdvancedRelease