import { z } from 'zod'
import { 
    ETrackType, 
    EMusicGenre, 
    EAudioFormat, 
    ETerritories, 
    EDistributionPartners,
    EMusicLanguage
} from '../constant/application.js'

const createRelease = z.object({
    body: z.object({
        trackType: z.enum([ETrackType.SINGLE, ETrackType.ALBUM])
    })
})

const updateStep1 = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    }),
    body: z.object({
        coverArt: z.object({
            singerName: z.array(z.string().trim().max(100, 'Singer name too long')).optional(),
            imageUrl: z.string().url('Invalid image URL'),
            imageSize: z.number().min(1, 'Image size must be positive').optional(),
            imageFormat: z.enum(['jpg', 'jpeg', 'png', 'webp']).optional()
        }).optional(),
        releaseInfo: z.object({
            releaseName: z.string().trim().min(1, 'Release name is required').max(200, 'Release name too long'),
            genre: z.enum(Object.values(EMusicGenre)),
            labelName: z.string().trim().max(100, 'Label name too long').optional(),
            upc: z.string().regex(/^[0-9]{12}$/, 'UPC must be exactly 12 digits').optional()
        }).optional()
    })
})

const trackSchema = z.object({
    trackName: z.string().trim().min(1, 'Track name is required').max(200, 'Track name too long'),
    genre: z.enum(Object.values(EMusicGenre)),
    language: z.enum(Object.values(EMusicLanguage)).optional(),
    composerName: z.string().trim().max(100, 'Composer name too long').optional(),
    lyricistName: z.string().trim().max(100, 'Lyricist name too long').optional(),
    singerName: z.string().trim().max(100, 'Singer name too long').optional(),
    producerName: z.string().trim().max(100, 'Producer name too long').optional(),
    isrc: z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/, 'Invalid ISRC format').optional(),
    audioFiles: z.array(z.object({
        format: z.enum(Object.values(EAudioFormat)),
        fileUrl: z.string().url('Invalid file URL'),
        fileSize: z.number().min(1, 'File size must be positive').optional(),
        duration: z.number().min(1, 'Duration must be positive').optional()
    })).min(1, 'At least one audio file is required'),
    previewTiming: z.object({
        startTime: z.number().min(0, 'Start time cannot be negative').default(0),
        endTime: z.number().min(1, 'End time must be positive').default(30)
    }).optional(),
    callerTuneTiming: z.object({
        startTime: z.number().min(0, 'Start time cannot be negative').default(0),
        endTime: z.number().min(1, 'End time must be positive').default(30)
    }).optional()
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
        releaseDate: z.string().datetime('Invalid release date format').optional(),
        territorialRights: z.object({
            hasRights: z.boolean(),
            territories: z.array(z.enum(Object.values(ETerritories))).optional()
        }).optional(),
        partnerSelection: z.object({
            hasPartners: z.boolean(),
            partners: z.array(z.enum(Object.values(EDistributionPartners))).optional()
        }).optional(),
        copyrights: z.object({
            ownsCopyright: z.boolean(),
            copyrightDocuments: z.array(z.object({
                documentUrl: z.string().url('Invalid document URL'),
                uploadedAt: z.string().datetime('Invalid upload date').optional()
            })).optional()
        }).optional()
    })
})

const releaseIdParam = z.object({
    params: z.object({
        releaseId: z.string().min(1, 'Release ID is required')
    })
})

const requestUpdate = z.object({
    body: z.object({
        reason: z.string().trim().min(1, 'Reason is required').max(500, 'Reason too long'),
        changes: z.string().trim().min(1, 'Changes description is required').max(1000, 'Changes description too long')
    })
})

const requestTakeDown = z.object({
    body: z.object({
        reason: z.string().trim().min(1, 'Reason is required').max(500, 'Reason too long')
    })
})

const getReleases = z.object({
    query: z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
        status: z.string().optional(),
        userId: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'releaseName']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
})

const adminNotes = z.object({
    body: z.object({
        notes: z.string().trim().max(1000, 'Notes too long').optional()
    })
})

const rejectRelease = z.object({
    body: z.object({
        reason: z.string().trim().min(1, 'Rejection reason is required').max(500, 'Rejection reason too long')
    })
})

export default {
    createRelease,
    updateStep1,
    updateStep2,
    updateStep3,
    releaseIdParam,
    requestUpdate,
    requestTakeDown,
    getReleases,
    adminNotes,
    rejectRelease
};