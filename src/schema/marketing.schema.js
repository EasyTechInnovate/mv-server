import { z } from 'zod'
import {
    EMarketingSubmissionStatus,
    EMusicGenres,
    EMusicMood,
    EMusicTheme,
    EMusicLanguage,
    EPROAffiliation,
    ESyncProjectSuitability,
    EStreamingPlatform
} from '../constant/application.js'

const createSyncSubmissionSchema = z.object({
    body: z.object({
        trackName: z.string().min(1, 'Track name is required').max(200),
        artistName: z.string().min(1, 'Artist name is required').max(200),
        labelName: z.string().min(1, 'Label name is required').max(200),
        isrc: z.string().min(12, 'ISRC must be at least 12 characters').max(12, 'ISRC must be exactly 12 characters'),
        genres: z.array(z.enum(Object.values(EMusicGenres))).min(1, 'At least one genre is required'),
        mood: z.enum(Object.values(EMusicMood)),
        isVocalsPresent: z.boolean(),
        language: z.enum(Object.values(EMusicLanguage)),
        theme: z.enum(Object.values(EMusicTheme)),
        masterRightsOwner: z.string().min(1, 'Master rights owner is required').max(200),
        publishingRightsOwner: z.string().min(1, 'Publishing rights owner is required').max(200),
        isFullyClearedForSync: z.boolean(),
        proAffiliation: z.enum(Object.values(EPROAffiliation)),
        trackLinks: z.array(z.object({
            platform: z.string().min(1, 'Platform name is required').max(100),
            url: z.string().url('Invalid track URL')
        })).min(1, 'At least one track link is required'),
        projectSuitability: z.array(z.enum(Object.values(ESyncProjectSuitability))).min(1, 'At least one project suitability is required')
    })
})

const createPlaylistPitchingSchema = z.object({
    body: z.object({
        trackName: z.string().min(1, 'Track name is required').max(200),
        artistName: z.string().min(1, 'Artist name is required').max(200),
        labelName: z.string().min(1, 'Label name is required').max(200),
        isrc: z.string().min(12, 'ISRC must be at least 12 characters').max(12, 'ISRC must be exactly 12 characters'),
        genres: z.array(z.enum(Object.values(EMusicGenres))).min(1, 'At least one genre is required'),
        mood: z.enum(Object.values(EMusicMood)),
        isVocalsPresent: z.boolean(),
        language: z.enum(Object.values(EMusicLanguage)),
        theme: z.enum(Object.values(EMusicTheme)),
        selectedStore: z.enum(Object.values(EStreamingPlatform)),
        trackLinks: z.array(z.object({
            platform: z.enum(Object.values(EStreamingPlatform)),
            url: z.string().url('Invalid track URL')
        })).min(1, 'At least one track link is required')
    })
})

const getMarketingSubmissionsSchema = z.object({
    query: z.object({
        page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).optional().default('1'),
        limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional().default('10'),
        status: z.enum(Object.values(EMarketingSubmissionStatus)).optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'trackName', 'artistName']).optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
    })
})

const marketingSubmissionParamsSchema = z.object({
    params: z.object({
        submissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid submission ID format')
    })
})

const reviewMarketingSubmissionSchema = z.object({
    params: z.object({
        submissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid submission ID format')
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
        message: 'Rejection reason is required when rejecting a submission'
    })
})

const getPlaylistPitchingByStoreSchema = z.object({
    params: z.object({
        store: z.enum(Object.values(EStreamingPlatform))
    }),
    query: z.object({
        page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).optional().default('1'),
        limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional().default('10'),
        status: z.enum(Object.values(EMarketingSubmissionStatus)).optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'trackName', 'artistName']).optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
    })
})

const marketingStatsSchema = z.object({
    query: z.object({
        type: z.enum(['sync', 'playlist_pitching', 'both']).optional().default('both')
    })
})

export default {
    createSyncSubmissionSchema,
    createPlaylistPitchingSchema,
    getMarketingSubmissionsSchema,
    marketingSubmissionParamsSchema,
    reviewMarketingSubmissionSchema,
    getPlaylistPitchingByStoreSchema,
    marketingStatsSchema
}