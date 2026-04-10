import { z } from 'zod';
import { EFanLinkStatus, EFanLinkPlatform } from '../constant/application.js';

const platformLinkSchema = z.object({
    platform: z.string().min(1, 'Platform is required'),
    link: z.string().url().min(1, 'Platform link is required'),
    isActive: z.boolean().default(true)
});

const createFanLinkSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
        description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
        customUrl: z.string()
            .min(3, 'Custom URL must be at least 3 characters')
            .max(50, 'Custom URL must be less than 50 characters')
            .regex(/^[a-z0-9-_]+$/, 'Custom URL can only contain lowercase letters, numbers, hyphens, and underscores'),
        platformLinks: z.array(platformLinkSchema)
            .min(1, 'At least one platform link is required')
            .max(20, 'Maximum 20 platform links allowed')
    })
});

const updateFanLinkSchema = z.object({
    params: z.object({
        fanLinkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid fan link ID')
    }),
    body: z.object({
        title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
        description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters').optional(),
        customUrl: z.string()
            .min(3, 'Custom URL must be at least 3 characters')
            .max(50, 'Custom URL must be less than 50 characters')
            .regex(/^[a-z0-9-_]+$/, 'Custom URL can only contain lowercase letters, numbers, hyphens, and underscores')
            .optional(),
        platformLinks: z.array(platformLinkSchema)
            .min(1, 'At least one platform link is required')
            .max(20, 'Maximum 20 platform links allowed')
            .optional(),
        status: z.enum(Object.values(EFanLinkStatus)).optional()
    })
});

const getFanLinksSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0, 'Page must be greater than 0').default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').default('10'),
        status: z.enum(Object.values(EFanLinkStatus)).optional(),
        search: z.string().min(1).optional()
    })
});

const fanLinkParamsSchema = z.object({
    params: z.object({
        fanLinkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid fan link ID')
    })
});

const customUrlParamsSchema = z.object({
    params: z.object({
        customUrl: z.string().min(1, 'Custom URL is required')
    })
});

const fanLinkStatsSchema = z.object({
    query: z.object({
        timeframe: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time']).default('all_time')
    })
});

const checkCustomUrlSchema = z.object({
    params: z.object({
        customUrl: z.string().min(1, 'Custom URL is required')
    })
});

const fanLinkSchemas = {
    createFanLinkSchema,
    updateFanLinkSchema,
    getFanLinksSchema,
    fanLinkParamsSchema,
    customUrlParamsSchema,
    fanLinkStatsSchema,
    checkCustomUrlSchema
};

export default fanLinkSchemas;