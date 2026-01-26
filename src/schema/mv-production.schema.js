import { z } from 'zod';
import {
    EMVProductionStatus,
    ELocationPreference,
    ERevenueSharingModel,
    EMusicGenre,
    EMusicMood,
    EMusicLanguage,
    EMusicTheme
} from '../constant/application.js';

const createMVProduction = z.object({
    body: z.object({
        ownerInfo: z.object({
            copyrightOwnerName: z.string().trim().min(1, 'Copyright owner name is required').max(200, 'Copyright owner name too long'),
            mobileNumber: z.string().trim().min(1, 'Mobile number is required').max(20, 'Mobile number too long'),
            emailOfCopyrightHolder: z.string().trim().email('Invalid email address').max(255, 'Email too long')
        }),
        projectOverview: z.object({
            projectTitle: z.string().trim().min(1, 'Project title is required').max(300, 'Project title too long'),
            artistName: z.string().trim().min(1, 'Artist name is required').max(200, 'Artist name too long'),
            labelName: z.string().trim().min(1, 'Label name is required').max(200, 'Label name too long'),
            releaseTimeline: z.string().trim().min(1, 'Release timeline is required').max(100, 'Release timeline too long'),
            genres: z.array(z.enum(Object.values(EMusicGenre))).min(1, 'At least one genre is required'),
            mood: z.enum(Object.values(EMusicMood)),
            isPartOfAlbumOrEP: z.boolean(),
            language: z.enum(Object.values(EMusicLanguage)),
            theme: z.enum(Object.values(EMusicTheme)),
            locationPreference: z.array(z.enum(Object.values(ELocationPreference))).min(1, 'At least one location preference is required'),
            customLocationDescription: z.string().trim().max(500, 'Custom location description too long').optional()
        }),
        budgetRequestAndOwnershipProposal: z.object({
            totalBudgetRequested: z.number().min(0, 'Total budget cannot be negative'),
            proposedOwnershipDilution: z.number().min(0, 'Ownership dilution cannot be negative').max(100, 'Ownership dilution cannot exceed 100%'),
            breakdown: z.object({
                preProduction: z.number().min(0, 'Pre-production budget cannot be negative'),
                shootDay: z.number().min(0, 'Shoot day budget cannot be negative'),
                postProduction: z.number().min(0, 'Post-production budget cannot be negative'),
                miscellaneousContingency: z.number().min(0, 'Miscellaneous budget cannot be negative')
            }),
            willContributePersonalFunds: z.boolean(),
            personalFundsAmount: z.number().min(0, 'Personal funds amount cannot be negative').optional().nullable(),
            revenueSharingModelProposed: z.enum(Object.values(ERevenueSharingModel))
        }),
        marketingAndDistributionPlan: z.object({
            willBeReleasedViaMVDistribution: z.boolean(),
            anyBrandOrMerchTieIns: z.boolean(),
            brandOrMerchTieInsDescription: z.string().trim().max(1000, 'Description too long').optional().nullable(),
            planToRunAdsOrInfluencerCampaigns: z.boolean()
        }),
        legalAndOwnershipDeclaration: z.object({
            confirmFullCreativeOwnership: z.boolean().refine(val => val === true, 'You must confirm full creative ownership'),
            agreeToCreditMVProduction: z.boolean().refine(val => val === true, 'You must agree to credit MV Production'),
            agreeToShareFinalAssets: z.boolean().refine(val => val === true, 'You must agree to share final assets'),
            requireNDAOrCustomAgreement: z.boolean()
        })
    })
});

const updateMVProduction = z.object({
    params: z.object({
        productionId: z.string().min(1, 'Production ID is required')
    }),
    body: z.object({
        ownerInfo: z.object({
            copyrightOwnerName: z.string().trim().min(1, 'Copyright owner name is required').max(200, 'Copyright owner name too long'),
            mobileNumber: z.string().trim().min(1, 'Mobile number is required').max(20, 'Mobile number too long'),
            emailOfCopyrightHolder: z.string().trim().email('Invalid email address').max(255, 'Email too long')
        }).optional(),
        projectOverview: z.object({
            projectTitle: z.string().trim().min(1, 'Project title is required').max(300, 'Project title too long'),
            artistName: z.string().trim().min(1, 'Artist name is required').max(200, 'Artist name too long'),
            labelName: z.string().trim().min(1, 'Label name is required').max(200, 'Label name too long'),
            releaseTimeline: z.string().trim().min(1, 'Release timeline is required').max(100, 'Release timeline too long'),
            genres: z.array(z.enum(Object.values(EMusicGenre))).min(1, 'At least one genre is required'),
            mood: z.enum(Object.values(EMusicMood)),
            isPartOfAlbumOrEP: z.boolean(),
            language: z.enum(Object.values(EMusicLanguage)),
            theme: z.enum(Object.values(EMusicTheme)),
            locationPreference: z.array(z.enum(Object.values(ELocationPreference))).min(1, 'At least one location preference is required'),
            customLocationDescription: z.string().trim().max(500, 'Custom location description too long').optional()
        }).optional(),
        budgetRequestAndOwnershipProposal: z.object({
            totalBudgetRequested: z.number().min(0, 'Total budget cannot be negative'),
            proposedOwnershipDilution: z.number().min(0, 'Ownership dilution cannot be negative').max(100, 'Ownership dilution cannot exceed 100%'),
            breakdown: z.object({
                preProduction: z.number().min(0, 'Pre-production budget cannot be negative'),
                shootDay: z.number().min(0, 'Shoot day budget cannot be negative'),
                postProduction: z.number().min(0, 'Post-production budget cannot be negative'),
                miscellaneousContingency: z.number().min(0, 'Miscellaneous budget cannot be negative')
            }),
            willContributePersonalFunds: z.boolean(),
            personalFundsAmount: z.number().min(0, 'Personal funds amount cannot be negative').optional().nullable(),
            revenueSharingModelProposed: z.enum(Object.values(ERevenueSharingModel))
        }).optional(),
        marketingAndDistributionPlan: z.object({
            willBeReleasedViaMVDistribution: z.boolean(),
            anyBrandOrMerchTieIns: z.boolean(),
            brandOrMerchTieInsDescription: z.string().trim().max(1000, 'Description too long').optional().nullable(),
            planToRunAdsOrInfluencerCampaigns: z.boolean()
        }).optional(),
        legalAndOwnershipDeclaration: z.object({
            confirmFullCreativeOwnership: z.boolean().refine(val => val === true, 'You must confirm full creative ownership'),
            agreeToCreditMVProduction: z.boolean().refine(val => val === true, 'You must agree to credit MV Production'),
            agreeToShareFinalAssets: z.boolean().refine(val => val === true, 'You must agree to share final assets'),
            requireNDAOrCustomAgreement: z.boolean()
        }).optional()
    })
});

const updateMVProductionStatus = z.object({
    params: z.object({
        productionId: z.string().min(1, 'Production ID is required')
    }),
    body: z.object({
        status: z.enum(Object.values(EMVProductionStatus))
    })
});

const getMVProductionById = z.object({
    params: z.object({
        productionId: z.string().min(1, 'Production ID is required')
    })
});

const deleteMVProduction = z.object({
    params: z.object({
        productionId: z.string().min(1, 'Production ID is required')
    })
});

const getAllMVProductions = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        status: z.enum(Object.values(EMVProductionStatus)).optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'status']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional()
    })
});

const getUserMVProductions = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        status: z.enum(Object.values(EMVProductionStatus)).optional()
    })
});

export default {
    createMVProduction,
    updateMVProduction,
    updateMVProductionStatus,
    getMVProductionById,
    deleteMVProduction,
    getAllMVProductions,
    getUserMVProductions
};
