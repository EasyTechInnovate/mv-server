import { z } from 'zod'
import { EStreamingPlatform, EUsageType, EAnalyticsTimeframe, EAnalyticsMetric } from '../constant/application.js'

const getAnalyticsOverviewSchema = z.object({
    query: z.object({
        timeframe: z.enum(Object.values(EAnalyticsTimeframe)).optional().default(EAnalyticsTimeframe.LAST_30_DAYS),
        startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        compareWithPrevious: z.string()
            .optional()
            .transform((val) => val === 'true')
            .pipe(z.boolean().optional().default(false))
    }).refine((data) => {
        if (data.timeframe === EAnalyticsTimeframe.CUSTOM) {
            return data.startDate && data.endDate
        }
        return true
    }, {
        message: 'Start date and end date are required for custom timeframe',
        path: ['timeframe']
    })
})

const getStreamsOverTimeSchema = z.object({
    query: z.object({
        timeframe: z.enum(Object.values(EAnalyticsTimeframe)).optional().default(EAnalyticsTimeframe.LAST_6_MONTHS),
        startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        groupBy: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
        metric: z.enum(Object.values(EAnalyticsMetric)).optional().default(EAnalyticsMetric.STREAMS)
    }).refine((data) => {
        if (data.timeframe === EAnalyticsTimeframe.CUSTOM) {
            return data.startDate && data.endDate
        }
        return true
    }, {
        message: 'Start date and end date are required for custom timeframe',
        path: ['timeframe']
    })
})

const getTopTracksSchema = z.object({
    query: z.object({
        timeframe: z.enum(Object.values(EAnalyticsTimeframe)).optional().default(EAnalyticsTimeframe.LAST_30_DAYS),
        startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        limit: z.string()
            .optional()
            .transform((val) => val ? parseInt(val, 10) : 10)
            .pipe(z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100')),
        sortBy: z.enum(['streams', 'revenue']).optional().default('streams')
    }).refine((data) => {
        if (data.timeframe === EAnalyticsTimeframe.CUSTOM) {
            return data.startDate && data.endDate
        }
        return true
    }, {
        message: 'Start date and end date are required for custom timeframe',
        path: ['timeframe']
    })
})

const getPlatformDistributionSchema = z.object({
    query: z.object({
        timeframe: z.enum(Object.values(EAnalyticsTimeframe)).optional().default(EAnalyticsTimeframe.LAST_30_DAYS),
        startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        metric: z.enum(Object.values(EAnalyticsMetric)).optional().default(EAnalyticsMetric.STREAMS)
    }).refine((data) => {
        if (data.timeframe === EAnalyticsTimeframe.CUSTOM) {
            return data.startDate && data.endDate
        }
        return true
    }, {
        message: 'Start date and end date are required for custom timeframe',
        path: ['timeframe']
    })
})

const getCountryDistributionSchema = z.object({
    query: z.object({
        timeframe: z.enum(Object.values(EAnalyticsTimeframe)).optional().default(EAnalyticsTimeframe.LAST_30_DAYS),
        startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        limit: z.string()
            .optional()
            .transform((val) => val ? parseInt(val, 10) : 20)
            .pipe(z.number().min(1, 'Limit must be at least 1').max(50, 'Limit must be at most 50')),
        metric: z.enum(Object.values(EAnalyticsMetric)).optional().default(EAnalyticsMetric.STREAMS)
    }).refine((data) => {
        if (data.timeframe === EAnalyticsTimeframe.CUSTOM) {
            return data.startDate && data.endDate
        }
        return true
    }, {
        message: 'Start date and end date are required for custom timeframe',
        path: ['timeframe']
    })
})

const getRevenueAnalyticsSchema = z.object({
    query: z.object({
        timeframe: z.enum(Object.values(EAnalyticsTimeframe)).optional().default(EAnalyticsTimeframe.LAST_6_MONTHS),
        startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        groupBy: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
        breakdown: z.enum(['platform', 'country', 'track', 'total']).optional().default('total')
    }).refine((data) => {
        if (data.timeframe === EAnalyticsTimeframe.CUSTOM) {
            return data.startDate && data.endDate
        }
        return true
    }, {
        message: 'Start date and end date are required for custom timeframe',
        path: ['timeframe']
    })
})

const getListenerInsightsSchema = z.object({
    query: z.object({
        timeframe: z.enum(Object.values(EAnalyticsTimeframe)).optional().default(EAnalyticsTimeframe.LAST_30_DAYS),
        startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        includeGrowth: z.string()
            .optional()
            .transform((val) => val === 'true')
            .pipe(z.boolean().optional().default(false))
    }).refine((data) => {
        if (data.timeframe === EAnalyticsTimeframe.CUSTOM) {
            return data.startDate && data.endDate
        }
        return true
    }, {
        message: 'Start date and end date are required for custom timeframe',
        path: ['timeframe']
    })
})

const getPerformanceComparisonSchema = z.object({
    query: z.object({
        currentPeriodStart: z.string().transform((val) => new Date(val)),
        currentPeriodEnd: z.string().transform((val) => new Date(val)),
        comparisonPeriodStart: z.string().transform((val) => new Date(val)),
        comparisonPeriodEnd: z.string().transform((val) => new Date(val)),
        metrics: z.string()
            .optional()
            .default('streams,revenue')
            .transform((val) => val.split(',').map(s => s.trim())),
        breakdown: z.enum(['platform', 'country', 'track', 'month', 'total']).optional().default('total')
    })
})

const getAnalyticsDashboardSchema = z.object({
    query: z.object({
        timeframe: z.enum(Object.values(EAnalyticsTimeframe)).optional().default(EAnalyticsTimeframe.LAST_30_DAYS),
        startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        groupBy: z.enum(['day', 'week', 'month', 'year']).optional().default('day'),
        topTracksLimit: z.string()
            .optional()
            .transform((val) => val ? parseInt(val, 10) : 10)
            .pipe(z.number().min(1).max(50)),
        countriesLimit: z.string()
            .optional()
            .transform((val) => val ? parseInt(val, 10) : 20)
            .pipe(z.number().min(1).max(50))
    }).refine((data) => {
        if (data.timeframe === EAnalyticsTimeframe.CUSTOM) {
            return data.startDate && data.endDate
        }
        return true
    }, {
        message: 'Start date and end date are required for custom timeframe',
        path: ['timeframe']
    })
})

export {
    getAnalyticsOverviewSchema,
    getStreamsOverTimeSchema,
    getTopTracksSchema,
    getPlatformDistributionSchema,
    getCountryDistributionSchema,
    getRevenueAnalyticsSchema,
    getListenerInsightsSchema,
    getPerformanceComparisonSchema,
    getAnalyticsDashboardSchema
}