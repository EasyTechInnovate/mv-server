import { z } from 'zod';
import { EMerchStoreStatus, EMerchProductType, EMerchMarketingChannel } from '../constant/application.js';

const createMerchStore = z.object({
    body: z.object({
        artistInfo: z.object({
            artistName: z.string().min(1, 'Artist name is required').max(200),
            instagramLink: z.string().url('Invalid Instagram link').max(500).optional().or(z.literal('')),
            facebookLink: z.string().url('Invalid Facebook link').max(500).optional().or(z.literal('')),
            spotifyProfileLink: z.string().url('Invalid Spotify link').max(500).optional().or(z.literal('')),
            appleMusicProfileLink: z.string().url('Invalid Apple Music link').max(500).optional().or(z.literal('')),
            youtubeMusicProfileLink: z.string().url('Invalid YouTube Music link').max(500).optional().or(z.literal(''))
        }),
        productPreferences: z.object({
            selectedProducts: z.array(z.enum(Object.values(EMerchProductType))).min(1, 'At least one product must be selected'),
            otherProductDescription: z.string().max(500).optional()
        }).refine(
            (data) => {
                if (data.selectedProducts.includes(EMerchProductType.OTHER)) {
                    return data.otherProductDescription && data.otherProductDescription.trim().length > 0;
                }
                return true;
            },
            { message: 'Other product description is required when "Other" is selected' }
        ),
        marketingPlan: z.object({
            planToPromote: z.boolean(),
            promotionChannels: z.array(z.enum(Object.values(EMerchMarketingChannel))).optional().default([]),
            otherChannelDescription: z.string().max(500).optional(),
            mmcMarketingAssistance: z.boolean()
        }).refine(
            (data) => {
                if (data.planToPromote) {
                    return data.promotionChannels && data.promotionChannels.length > 0;
                }
                return true;
            },
            { message: 'At least one promotion channel is required when planning to promote' }
        ).refine(
            (data) => {
                if (data.promotionChannels && data.promotionChannels.includes(EMerchMarketingChannel.OTHER)) {
                    return data.otherChannelDescription && data.otherChannelDescription.trim().length > 0;
                }
                return true;
            },
            { message: 'Other channel description is required when "Other" is selected' }
        ),
        legalConsents: z.object({
            agreeToReviewProcess: z.boolean().refine(val => val === true, {
                message: 'You must agree to MMC\'s review and approval process'
            }),
            understandRevisionRights: z.boolean().refine(val => val === true, {
                message: 'You must acknowledge MMC\'s right to request revisions'
            }),
            consentToShowcase: z.boolean().refine(val => val === true, {
                message: 'You must consent to MMC showcasing approved designs'
            })
        })
    })
});

const updateMerchStore = z.object({
    params: z.object({
        storeId: z.string().min(1, 'Store ID is required')
    }),
    body: z.object({
        artistInfo: z.object({
            artistName: z.string().min(1).max(200).optional(),
            instagramLink: z.string().url().max(500).optional().or(z.literal('')),
            facebookLink: z.string().url().max(500).optional().or(z.literal('')),
            spotifyProfileLink: z.string().url().max(500).optional().or(z.literal('')),
            appleMusicProfileLink: z.string().url().max(500).optional().or(z.literal('')),
            youtubeMusicProfileLink: z.string().url().max(500).optional().or(z.literal(''))
        }).optional(),
        productPreferences: z.object({
            selectedProducts: z.array(z.enum(Object.values(EMerchProductType))).min(1).optional(),
            otherProductDescription: z.string().max(500).optional()
        }).optional(),
        marketingPlan: z.object({
            planToPromote: z.boolean().optional(),
            promotionChannels: z.array(z.enum(Object.values(EMerchMarketingChannel))).optional(),
            otherChannelDescription: z.string().max(500).optional(),
            mmcMarketingAssistance: z.boolean().optional()
        }).optional()
    })
});

const submitDesigns = z.object({
    params: z.object({
        storeId: z.string().min(1, 'Store ID is required')
    }),
    body: z.object({
        designs: z.array(z.object({
            designLink: z.string().url('Invalid design link').max(1000),
            designName: z.string().max(200).optional()
        })).min(5, 'Minimum 5 designs are required')
    })
});

const updateStatus = z.object({
    params: z.object({
        storeId: z.string().min(1, 'Store ID is required')
    }),
    body: z.object({
        status: z.enum(Object.values(EMerchStoreStatus)),
        adminNotes: z.string().max(1000).optional(),
        rejectionReason: z.string().max(1000).optional()
    }).refine(
        (data) => {
            if (data.status === EMerchStoreStatus.REJECTED || data.status === EMerchStoreStatus.DESIGN_REJECTED) {
                return data.rejectionReason && data.rejectionReason.trim().length > 0;
            }
            return true;
        },
        { message: 'Rejection reason is required when rejecting' }
    )
});

const getMerchStores = z.object({
    query: z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
        status: z.enum(Object.values(EMerchStoreStatus)).optional(),
        userId: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'artistName']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
});

const getApprovedDesigns = z.object({
    query: z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
        sortBy: z.enum(['uploadedAt', 'designName', 'artistName']).default('uploadedAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
});

const getMerchStoreById = z.object({
    params: z.object({
        storeId: z.string().min(1, 'Store ID is required')
    })
});

const deleteMerchStore = z.object({
    params: z.object({
        storeId: z.string().min(1, 'Store ID is required')
    })
});

export const merchStoreSchema = {
    createMerchStore,
    updateMerchStore,
    submitDesigns,
    updateStatus,
    getMerchStores,
    getApprovedDesigns,
    getMerchStoreById,
    deleteMerchStore
};
