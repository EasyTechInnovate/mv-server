import { z } from 'zod'
import { EMCNRequestStatus, EMCNChannelStatus } from '../constant/application.js'

const createMCNRequestSchema = z.object({
    body: z.object({
        youtubeChannelName: z.string().min(1, 'YouTube channel name is required').max(200),
        youtubeChannelId: z.string().min(1, 'YouTube channel ID is required').max(100),
        subscriberCount: z.number().int().min(0, 'Subscriber count must be non-negative'),
        totalViewsCountsIn28Days: z.number().int().min(0, 'Total views count must be non-negative'),
        monetizationEligibility: z.boolean(),
        isAdSenseEnabled: z.boolean(),
        hasCopyrightStrikes: z.boolean(),
        isContentOriginal: z.boolean(),
        isPartOfAnotherMCN: z.boolean(),
        otherMCNDetails: z.string().optional().nullable(),
        channelRevenueLastMonth: z.number().min(0, 'Channel revenue must be non-negative'),
        analyticsScreenshotUrl: z.string().url('Invalid analytics screenshot URL'),
        revenueScreenshotUrl: z.string().url('Invalid revenue screenshot URL'),
        isLegalOwner: z.boolean().refine(val => val === true, 'Must confirm legal ownership'),
        agreesToTerms: z.boolean().refine(val => val === true, 'Must agree to terms'),
        understandsOwnership: z.boolean().refine(val => val === true, 'Must understand ownership terms'),
        consentsToContact: z.boolean().refine(val => val === true, 'Must consent to contact')
    })
})

const getMCNRequestsSchema = z.object({
    query: z.object({
        page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).optional().default('1'),
        limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(200)).optional().default('10'),
        status: z.enum(Object.values(EMCNRequestStatus)).optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'youtubeChannelName', 'subscriberCount']).optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
    })
})

const mcnRequestParamsSchema = z.object({
    params: z.object({
        requestId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid request ID format')
    })
})

const reviewMCNRequestSchema = z.object({
    params: z.object({
        requestId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid request ID format')
    }),
    body: z.object({
        action: z.enum(['approve', 'reject']),
        rejectionReason: z.string().optional(),
        adminNotes: z.string().optional()
    }).refine(data => {
        if (data.action === 'reject' && !data.rejectionReason) {
            return false
        }
        return true
    }, {
        message: 'Rejection reason is required when rejecting a request'
    })
})

const createMCNChannelSchema = z.object({
    params: z.object({
        requestId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid request ID format')
    }),
    body: z.object({
        channelName: z.string().min(1, 'Channel name is required').max(200),
        channelLink: z.string().url('Invalid channel link'),
        revenueShare: z.number().min(0).max(100, 'Revenue share must be between 0 and 100'),
        channelManager: z.string().min(1, 'Channel manager is required').max(100),
        notes: z.string().optional()
    })
})

const getMCNChannelsSchema = z.object({
    query: z.object({
        page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).optional().default('1'),
        limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(200)).optional().default('10'),
        status: z.enum(Object.values(EMCNChannelStatus)).optional(),
        channelManager: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'channelName', 'totalRevenue', 'monthlyRevenue']).optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
    })
})

const mcnChannelParamsSchema = z.object({
    params: z.object({
        channelId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid channel ID format')
    })
})

const updateMCNChannelSchema = z.object({
    params: z.object({
        channelId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid channel ID format')
    }),
    body: z.object({
        channelName: z.string().min(1).max(200).optional(),
        channelLink: z.string().url().optional(),
        revenueShare: z.number().min(0).max(100).optional(),
        channelManager: z.string().min(1).max(100).optional(),
        monthlyRevenue: z.number().min(0).optional(),
        totalRevenue: z.number().min(0).optional(),
        notes: z.string().optional()
    })
})

const updateChannelStatusSchema = z.object({
    params: z.object({
        channelId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid channel ID format')
    }),
    body: z.object({
        status: z.enum(Object.values(EMCNChannelStatus)),
        suspensionReason: z.string().optional()
    }).refine(data => {
        if (data.status === EMCNChannelStatus.SUSPENDED && !data.suspensionReason) {
            return false
        }
        return true
    }, {
        message: 'Suspension reason is required when suspending a channel'
    })
})

const requestRemovalSchema = z.object({
    params: z.object({
        requestId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid request ID format')
    })
})

const bulkDeleteMCNRequestsSchema = z.object({
    body: z.object({
        requestIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid request ID format')).min(1, 'At least one request ID is required')
    })
})

export default {
    createMCNRequestSchema,
    getMCNRequestsSchema,
    mcnRequestParamsSchema,
    reviewMCNRequestSchema,
    createMCNChannelSchema,
    getMCNChannelsSchema,
    mcnChannelParamsSchema,
    updateMCNChannelSchema,
    updateChannelStatusSchema,
    requestRemovalSchema,
    bulkDeleteMCNRequestsSchema
}