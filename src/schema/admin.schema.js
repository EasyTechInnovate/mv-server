import { z } from 'zod'
import { EPlanTargetType } from '../constant/application.js'

const showcaseFeatureItem = z.object({
    text: z.string().min(1, 'Feature text is required').trim(),
    included: z.boolean().default(true)
})

const featuresSchema = z.object({
    unlimitedReleases: z.boolean().default(false),
    unlimitedArtists: z.boolean().default(false),
    singleLabel: z.boolean().default(false),
    ownership100: z.boolean().default(true),
    artistProfile: z.boolean().default(true),
    collaborateWithOthers: z.boolean().default(false),
    revenueShare: z.object({
        percentage: z.number().min(0).max(100).optional(),
        description: z.string().optional()
    }).optional(),
    metaContentId: z.boolean().default(false),
    youtubeContentId: z.boolean().default(false),
    tiktokContentId: z.boolean().default(false),
    youtubeOac: z.boolean().default(false),
    analyticsDemo: z.boolean().default(false),
    spotifyDiscoveryMode: z.boolean().default(false),
    assistedPlaylists: z.boolean().default(false),
    preReleasePromo: z.boolean().default(false),
    freeUpcCode: z.boolean().default(false),
    freeIsrcCode: z.boolean().default(false),
    lifetimeAvailability: z.boolean().default(false),
    supportHours: z.enum(['24_hours', '48_hours', '72_hours']).default('72_hours'),
    liveSupportTime: z.string().optional(),
    businessHours: z.boolean().default(false),
    liveSupport: z.boolean().default(false),
    dailyArtistDistribution: z.boolean().default(false),
    worldwideAvailability: z.boolean().default(true),
    analyticsCenter: z.boolean().default(false),
    royaltyClaimCentre: z.boolean().default(false),
    merchandisePanel: z.boolean().default(false),
    dolbyAtmos: z.boolean().default(false),
    playlistPitching: z.boolean().default(false),
    synchronization: z.boolean().default(false),
    fanLinksBuilder: z.boolean().default(false),
    mahiAi: z.boolean().default(false),
    youtubeMcnAccess: z.boolean().default(false),
    available150Stores: z.boolean().default(false)
})

const adminSchemas = {
    createPlan: z.object({
        body: z.object({
            planId: z.string()
                .min(1, 'Plan ID is required')
                .trim()
                .toLowerCase()
                .regex(/^[a-z0-9_]+$/, 'Plan ID can only contain lowercase letters, numbers, and underscores'),
            name: z.string().min(1, 'Plan name is required').trim(),
            description: z.string().min(1, 'Plan description is required').trim(),
            targetType: z.enum(Object.values(EPlanTargetType)).default(EPlanTargetType.EVERYONE),
            price: z.object({
                current: z.number().min(0, 'Current price cannot be negative'),
                original: z.number().min(0, 'Original price cannot be negative')
            }),
            currency: z.string().default('INR').transform(val => val.toUpperCase()),
            interval: z.enum(['month', 'year'], { required_error: 'Billing interval is required' }),
            intervalCount: z.number().min(1).default(1),
            features: featuresSchema,
            showcaseFeatures: z.array(showcaseFeatureItem).default([]),
            isPopular: z.boolean().default(false),
            isBestValue: z.boolean().default(false),
            displayOrder: z.number().default(0),
            limits: z.object({
                maxUploads: z.number().default(-1),
                maxCollaborators: z.number().default(1),
                maxDistributionChannels: z.number().default(10)
            }).optional(),
            trial: z.object({
                enabled: z.boolean().default(false),
                days: z.number().default(0)
            }).optional(),
            discount: z.object({
                enabled: z.boolean().default(false),
                percentage: z.number().min(0).max(100).default(0),
                validUntil: z.string().datetime().optional()
            }).optional()
        })
    }),

    updatePlan: z.object({
        body: z.object({
            name: z.string().min(1).trim().optional(),
            description: z.string().min(1).trim().optional(),
            targetType: z.enum(Object.values(EPlanTargetType)).optional(),
            price: z.object({
                current: z.number().min(0).optional(),
                original: z.number().min(0).optional()
            }).optional(),
            currency: z.string().transform(val => val.toUpperCase()).optional(),
            interval: z.enum(['month', 'year']).optional(),
            intervalCount: z.number().min(1).optional(),
            features: featuresSchema.partial().optional(),
            showcaseFeatures: z.array(showcaseFeatureItem).optional(),
            isPopular: z.boolean().optional(),
            isBestValue: z.boolean().optional(),
            displayOrder: z.number().optional(),
            limits: z.object({
                maxUploads: z.number().optional(),
                maxCollaborators: z.number().optional(),
                maxDistributionChannels: z.number().optional()
            }).optional(),
            trial: z.object({
                enabled: z.boolean().optional(),
                days: z.number().optional()
            }).optional(),
            discount: z.object({
                enabled: z.boolean().optional(),
                percentage: z.number().min(0).max(100).optional(),
                validUntil: z.string().datetime().optional()
            }).optional()
        })
    }),

    aggregatorSubscription: z.object({
        params: z.object({
            userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')
        }),
        body: z.object({
            startDate: z.string().datetime({ message: 'Invalid start date' }),
            endDate: z.string().datetime({ message: 'Invalid end date' }),
            notes: z.string().max(500).optional()
        }).refine(data => new Date(data.endDate) > new Date(data.startDate), {
            message: 'End date must be after start date',
            path: ['endDate']
        })
    }),

    resetUserPassword: z.object({
        params: z.object({
            userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')
        }),
        body: z.object({
            password: z.string().min(8, 'Password must be at least 8 characters long'),
            confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long')
        }).refine((data) => data.password === data.confirmPassword, {
            message: "Passwords don't match",
            path: ['confirmPassword']
        })
    })
}

export default adminSchemas
