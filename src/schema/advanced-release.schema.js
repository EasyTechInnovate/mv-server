import { z } from 'zod'
import { 
    EAdvancedReleaseType, 
    EReleasePricingTier, 
    EMusicGenre,
    EMusicLanguage,
    ETerritories,
    EDistributionPartners 
} from '../constant/application.js'

const contributorSchema = z.object({
    profession: z.string().trim().min(1, 'Profession/role is required').max(100, 'Profession/role too long'),
    contributors: z.string().trim().min(1, 'Contributor name is required').max(200, 'Contributor name too long')
})

const trackSchema = z.object({
    trackLink: z.string().url('Invalid track URL').min(1, 'Track link is required'),
    trackName: z.string().trim().min(1, 'Track name is required').max(200, 'Track name too long'),
    mixVersion: z.string().trim().max(100, 'Mix version too long').optional(),
    primaryArtists: z.array(z.string().trim().min(1, 'Artist name required').max(100, 'Artist name too long')).min(1, 'At least one primary artist required'),
    featuringArtists: z.array(z.string().trim().max(100, 'Artist name too long')).optional(),
    contributorsToSoundRecording: z.array(contributorSchema).optional(),
    contributorsToMusicalWork: z.array(contributorSchema).optional(),
    needsISRC: z.boolean().default(false),
    isrcCode: z.string().trim().max(20, 'ISRC code too long').optional(),
    previewStartTiming: z.number().min(0, 'Preview timing cannot be negative').max(600, 'Preview timing too long').optional(),
    callertuneStartTiming: z.number().min(0, 'Callertune timing cannot be negative').max(600, 'Callertune timing too long').optional(),
    primaryGenre: z.enum(Object.values(EMusicGenre)),
    secondaryGenre: z.enum(Object.values(EMusicGenre)).optional(),
    hasHumanVocals: z.boolean().default(true),
    language: z.enum(Object.values(EMusicLanguage)).optional(),
    isAvailableForDownload: z.boolean().default(true)
}).refine(data => {
    if (data.hasHumanVocals && !data.language) {
        return false;
    }
    return true;
}, {
    message: 'Language is required when vocals are present',
    path: ['language']
})

const createAdvancedRelease = z.object({
    body: z.object({
        releaseType: z.enum(Object.values(EAdvancedReleaseType))
    })
})

const updateStep1 = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        coverArt: z.object({
            imageUrl: z.string().url('Invalid image URL'),
            imageSize: z.number().min(1, 'Image size must be positive').optional(),
            imageFormat: z.enum(['jpg', 'jpeg', 'png', 'webp']).optional()
        }).optional(),
        releaseInfo: z.object({
            releaseName: z.string().trim().min(1, 'Release name is required').max(200, 'Release name too long'),
            releaseVersion: z.string().trim().max(50, 'Release version too long').optional(),
            catalog: z.string().trim().max(50, 'Catalog too long').optional(),
            releaseType: z.enum(Object.values(EAdvancedReleaseType)),
            primaryArtists: z.array(z.string().trim().min(1, 'Artist name required').max(100, 'Artist name too long')).min(1, 'At least one primary artist required'),
            variousArtists: z.array(z.string().trim().max(100, 'Artist name too long')).optional(),
            featuringArtists: z.array(z.string().trim().max(100, 'Artist name too long')).optional(),
            needsUPC: z.boolean().default(false),
            upcCode: z.string().trim().max(20, 'UPC code too long').optional(),
            primaryGenre: z.enum(Object.values(EMusicGenre)),
            secondaryGenre: z.enum(Object.values(EMusicGenre)).optional(),
            labelName: z.string().min(1, 'Label selection is required'),
            cLine: z.object({
                year: z.number().min(1900, 'Year must be from 1900 onwards').max(new Date().getFullYear() + 10, 'Year cannot be too far in future'),
                text: z.string().trim().min(1, 'C-Line text is required').max(200, 'C-Line text too long')
            }),
            pLine: z.object({
                year: z.number().min(1900, 'Year must be from 1900 onwards').max(new Date().getFullYear() + 10, 'Year cannot be too far in future'),
                text: z.string().trim().min(1, 'P-Line text is required').max(200, 'P-Line text too long')
            }),
            releasePricingTier: z.enum(Object.values(EReleasePricingTier))
        }).optional()
    })
})

const updateStep2 = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        tracks: z.array(trackSchema).min(1, 'At least one track is required')
    })
})

const updateStep3 = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        deliveryDetails: z.object({
            forFutureRelease: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid future release date').optional(),
            forPastRelease: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid past release date').optional()
        }).optional(),
        territorialRights: z.object({
            territories: z.array(z.enum(Object.values(ETerritories))).optional(),
            isWorldwide: z.boolean().default(false)
        }).optional().refine(
            (data) => {
                if (!data) return true;
                if (data.isWorldwide) return true;
                return data.territories && data.territories.length > 0;
            },
            { message: 'Territories are required when not selecting worldwide release' }
        ),
        distributionPartners: z.array(z.enum(Object.values(EDistributionPartners))).min(1, 'At least one distribution partner required').optional(),
        copyrightOptions: z.object({
            proceedWithoutCopyright: z.boolean().default(false),
            copyrightDocumentLink: z.string().url('Invalid copyright document URL').optional().nullable(),
            ownsCopyrights: z.boolean().default(false),
            ownedCopyrightDocumentLink: z.string().url('Invalid owned copyright document URL').optional().nullable()
        }).optional().refine(
            (data) => {
                if (!data) return true;
                if (data.proceedWithoutCopyright) return true;
                return data.copyrightDocumentLink;
            },
            { message: 'Copyright document link is required when not proceeding without copyright' }
        ).refine(
            (data) => {
                if (!data) return true;
                if (!data.ownsCopyrights) return true;
                return data.ownedCopyrightDocumentLink;
            },
            { message: 'Owned copyright document link is required when claiming copyright ownership' }
        )
    })
})

const getReleaseById = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    })
})

const deleteRelease = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    })
})

const submitRelease = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    })
})

const requestUpdate = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        reason: z.string().trim().min(1, 'Reason is required').max(500, 'Reason too long'),
        changes: z.string().trim().min(1, 'Changes description is required').max(1000, 'Changes description too long')
    })
})

const requestTakedown = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        reason: z.string().trim().min(1, 'Reason is required').max(500, 'Reason too long')
    })
})

const getMyReleases = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        status: z.enum(['draft', 'submitted', 'under_review', 'processing', 'published', 'live', 'rejected']).optional(),
        releaseType: z.enum(Object.values(EAdvancedReleaseType)).optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'releaseName']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
})

// Admin schemas
const adminGetReleases = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        status: z.enum(['draft', 'submitted', 'under_review', 'processing', 'published', 'live', 'rejected']).optional(),
        releaseType: z.enum(Object.values(EAdvancedReleaseType)).optional(),
        userId: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'releaseName', 'submittedAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
})

const adminNotes = z.object({
    body: z.object({
        notes: z.string().trim().max(1000, 'Notes too long').optional()
    })
})

const rejectRelease = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        reason: z.string().trim().min(1, 'Rejection reason is required').max(500, 'Rejection reason too long')
    })
})

const provideUPC = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        upcCode: z.string().trim().min(1, 'UPC code is required').max(20, 'UPC code too long')
    })
})

const provideISRC = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        trackId: z.string().min(1, 'Track ID is required'),
        isrcCode: z.string().trim().min(1, 'ISRC code is required').max(20, 'ISRC code too long')
    })
})

export default {
    createAdvancedRelease,
    updateStep1,
    updateStep2,
    updateStep3,
    getReleaseById,
    deleteRelease,
    submitRelease,
    requestUpdate,
    requestTakedown,
    getMyReleases,
    adminGetReleases,
    adminNotes,
    rejectRelease,
    provideUPC,
    provideISRC
}