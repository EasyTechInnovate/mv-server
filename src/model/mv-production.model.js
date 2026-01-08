import mongoose, { Schema } from 'mongoose';
import {
    EMVProductionStatus,
    ELocationPreference,
    ERevenueSharingModel,
    EMusicGenres,
    EMusicMood,
    EMusicLanguage,
    EMusicTheme
} from '../constant/application.js';

const mvProductionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        accountId: {
            type: String,
            required: true,
            trim: true
        },
        ownerInfo: {
            copyrightOwnerName: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200
            },
            mobileNumber: {
                type: String,
                required: true,
                trim: true,
                maxlength: 20
            },
            emailOfCopyrightHolder: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                maxlength: 255
            }
        },
        projectOverview: {
            projectTitle: {
                type: String,
                required: true,
                trim: true,
                maxlength: 300
            },
            artistName: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200
            },
            labelName: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200
            },
            releaseTimeline: {
                type: String,
                required: true,
                trim: true,
                maxlength: 100
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
            isPartOfAlbumOrEP: {
                type: Boolean,
                required: true,
                default: false
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
            locationPreference: [{
                type: String,
                enum: Object.values(ELocationPreference),
                required: true
            }]
        },
        budgetRequestAndOwnershipProposal: {
            totalBudgetRequested: {
                type: Number,
                required: true,
                min: 0
            },
            proposedOwnershipDilution: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            },
            breakdown: {
                preProduction: {
                    type: Number,
                    required: true,
                    min: 0
                },
                shootDay: {
                    type: Number,
                    required: true,
                    min: 0
                },
                postProduction: {
                    type: Number,
                    required: true,
                    min: 0
                },
                miscellaneousContingency: {
                    type: Number,
                    required: true,
                    min: 0
                }
            },
            willContributePersonalFunds: {
                type: Boolean,
                required: true,
                default: false
            },
            personalFundsAmount: {
                type: Number,
                min: 0,
                default: null
            },
            revenueSharingModelProposed: {
                type: String,
                enum: Object.values(ERevenueSharingModel),
                required: true
            }
        },
        marketingAndDistributionPlan: {
            willBeReleasedViaMVDistribution: {
                type: Boolean,
                required: true,
                default: false
            },
            anyBrandOrMerchTieIns: {
                type: Boolean,
                required: true,
                default: false
            },
            brandOrMerchTieInsDescription: {
                type: String,
                trim: true,
                maxlength: 1000,
                default: null
            },
            planToRunAdsOrInfluencerCampaigns: {
                type: Boolean,
                required: true,
                default: false
            }
        },
        legalAndOwnershipDeclaration: {
            confirmFullCreativeOwnership: {
                type: Boolean,
                required: true,
                default: false
            },
            agreeToCreditMVProduction: {
                type: Boolean,
                required: true,
                default: false
            },
            agreeToShareFinalAssets: {
                type: Boolean,
                required: true,
                default: false
            },
            requireNDAOrCustomAgreement: {
                type: Boolean,
                required: true,
                default: false
            }
        },
        status: {
            type: String,
            enum: Object.values(EMVProductionStatus),
            default: EMVProductionStatus.PENDING
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
        rejectionReason: {
            type: String,
            default: null
        },
        adminNotes: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

mvProductionSchema.index({ userId: 1, status: 1 });
mvProductionSchema.index({ accountId: 1 });
mvProductionSchema.index({ status: 1 });
mvProductionSchema.index({ createdAt: -1 });

mvProductionSchema.methods.approve = function(reviewerId, adminNotes = null) {
    this.status = EMVProductionStatus.ACCEPT
    this.reviewedBy = reviewerId
    this.reviewedAt = new Date()
    this.approvedAt = new Date()
    this.adminNotes = adminNotes
    this.rejectionReason = null
    return this.save()
}

mvProductionSchema.methods.reject = function(reviewerId, rejectionReason, adminNotes = null) {
    this.status = EMVProductionStatus.REJECT
    this.reviewedBy = reviewerId
    this.reviewedAt = new Date()
    this.rejectedAt = new Date()
    this.rejectionReason = rejectionReason
    this.adminNotes = adminNotes
    return this.save()
}

const MVProduction = mongoose.model('MVProduction', mvProductionSchema);

export default MVProduction;
