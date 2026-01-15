import mongoose from 'mongoose';
import { EMerchStoreStatus, EMerchProductType, EMerchMarketingChannel } from '../constant/application.js';

const { Schema } = mongoose;

const merchStoreSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        accountId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        artistInfo: {
            artistName: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200
            },
            instagramLink: {
                type: String,
                trim: true,
                maxlength: 500
            },
            facebookLink: {
                type: String,
                trim: true,
                maxlength: 500
            },
            spotifyProfileLink: {
                type: String,
                trim: true,
                maxlength: 500
            },
            appleMusicProfileLink: {
                type: String,
                trim: true,
                maxlength: 500
            },
            youtubeMusicProfileLink: {
                type: String,
                trim: true,
                maxlength: 500
            }
        },
        productPreferences: {
            selectedProducts: [{
                type: String,
                enum: Object.values(EMerchProductType),
                required: true
            }],
            otherProductDescription: {
                type: String,
                trim: true,
                maxlength: 500
            }
        },
        marketingPlan: {
            planToPromote: {
                type: Boolean,
                default: false
            },
            promotionChannels: [{
                type: String,
                enum: Object.values(EMerchMarketingChannel)
            }],
            otherChannelDescription: {
                type: String,
                trim: true,
                maxlength: 500
            },
            mmcMarketingAssistance: {
                type: Boolean,
                default: false
            }
        },
        legalConsents: {
            agreeToReviewProcess: {
                type: Boolean,
                required: true,
                default: false
            },
            understandRevisionRights: {
                type: Boolean,
                required: true,
                default: false
            },
            consentToShowcase: {
                type: Boolean,
                required: true,
                default: false
            }
        },
        designs: [{
            designLink: {
                type: String,
                required: true,
                trim: true,
                maxlength: 1000
            },
            designName: {
                type: String,
                trim: true,
                maxlength: 200
            },
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            },
            rejectionReason: {
                type: String,
                trim: true,
                maxlength: 1000
            },
            adminNotes: {
                type: String,
                trim: true,
                maxlength: 1000
            },
            products: [{
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                link: {
                    type: String,
                    required: true,
                    trim: true
                }
            }],
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        status: {
            type: String,
            enum: Object.values(EMerchStoreStatus),
            default: EMerchStoreStatus.PENDING,
            index: true
        },
        adminNotes: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        approvedAt: {
            type: Date
        },
        designsSubmittedAt: {
            type: Date
        },
        designsApprovedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

merchStoreSchema.index({ userId: 1, createdAt: -1 });
merchStoreSchema.index({ accountId: 1, status: 1 });

const MerchStore = mongoose.model('MerchStore', merchStoreSchema);

export default MerchStore;
