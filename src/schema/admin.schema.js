import { z } from 'zod'
import { ESubscriptionPlan } from '../constant/application.js'

const adminSchemas = {
    createPlan: z.object({
        planId: z.enum(Object.values(ESubscriptionPlan), {
            required_error: 'Plan ID is required',
            invalid_type_error: 'Invalid plan ID'
        }),
        name: z.string().min(1, 'Plan name is required').trim(),
        description: z.string().min(1, 'Plan description is required').trim(),
        price: z.object({
            current: z.number().min(0, 'Current price cannot be negative'),
            original: z.number().min(0, 'Original price cannot be negative')
        }),
        currency: z.string().default('INR').transform(val => val.toUpperCase()),
        interval: z.enum(['month', 'year'], {
            required_error: 'Billing interval is required'
        }),
        intervalCount: z.number().min(1, 'Interval count must be at least 1').default(1),
        features: z.object({
            unlimitedReleases: z.boolean().default(false),
            artistProfile: z.boolean().default(true),
            collaborateWithOthers: z.boolean().default(false),
            revenueShare: z.object({
                percentage: z.number().min(0).max(100).optional(),
                description: z.string().optional()
            }).optional(),
            metaContentId: z.boolean().default(false),
            youtubeContentId: z.boolean().default(false),
            analyticsDemo: z.boolean().default(false),
            spotifyDiscoveryMode: z.boolean().default(false),
            assistedPlaylists: z.boolean().default(false),
            preReleasePromo: z.boolean().default(false),
            freeUpcCode: z.boolean().default(false),
            freeIsrcCode: z.boolean().default(false),
            lifetimeAvailability: z.boolean().default(false),
            supportHours: z.enum(['24_hours', '48_hours', '72_hours']).default('72_hours'),
            businessHours: z.boolean().default(false),
            liveSupport: z.boolean().default(false),
            dailyArtistDistribution: z.boolean().default(false),
            worldwideAvailability: z.boolean().default(true),
            analyticsCenter: z.boolean().default(false)
        }),
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
    }),

    updatePlan: z.object({
        name: z.string().min(1, 'Plan name is required').trim().optional(),
        description: z.string().min(1, 'Plan description is required').trim().optional(),
        price: z.object({
            current: z.number().min(0, 'Current price cannot be negative').optional(),
            original: z.number().min(0, 'Original price cannot be negative').optional()
        }).optional(),
        currency: z.string().transform(val => val.toUpperCase()).optional(),
        interval: z.enum(['month', 'year']).optional(),
        intervalCount: z.number().min(1, 'Interval count must be at least 1').optional(),
        features: z.object({
            unlimitedReleases: z.boolean().optional(),
            artistProfile: z.boolean().optional(),
            collaborateWithOthers: z.boolean().optional(),
            revenueShare: z.object({
                percentage: z.number().min(0).max(100).optional(),
                description: z.string().optional()
            }).optional(),
            metaContentId: z.boolean().optional(),
            youtubeContentId: z.boolean().optional(),
            analyticsDemo: z.boolean().optional(),
            spotifyDiscoveryMode: z.boolean().optional(),
            assistedPlaylists: z.boolean().optional(),
            preReleasePromo: z.boolean().optional(),
            freeUpcCode: z.boolean().optional(),
            freeIsrcCode: z.boolean().optional(),
            lifetimeAvailability: z.boolean().optional(),
            supportHours: z.enum(['24_hours', '48_hours', '72_hours']).optional(),
            businessHours: z.boolean().optional(),
            liveSupport: z.boolean().optional(),
            dailyArtistDistribution: z.boolean().optional(),
            worldwideAvailability: z.boolean().optional(),
            analyticsCenter: z.boolean().optional()
        }).optional(),
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
}

export default adminSchemas