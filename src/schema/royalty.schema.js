import { z } from 'zod'
import { ERoyaltyTimeframe } from '../constant/application.js'

const royaltyDashboardQuery = z.object({
    timeframe: z.enum(Object.values(ERoyaltyTimeframe)).optional().default(ERoyaltyTimeframe.LAST_30_DAYS),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
}).refine((data) => {
    if (data.timeframe === ERoyaltyTimeframe.CUSTOM) {
        return data.startDate && data.endDate
    }
    return true
}, {
    message: "startDate and endDate are required when timeframe is 'custom'"
})

const royaltyMonthlyTrendsQuery = z.object({
    timeframe: z.enum(Object.values(ERoyaltyTimeframe)).optional().default(ERoyaltyTimeframe.LAST_6_MONTHS),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    type: z.enum(['regular', 'bonus', 'both']).optional().default('both')
}).refine((data) => {
    if (data.timeframe === ERoyaltyTimeframe.CUSTOM) {
        return data.startDate && data.endDate
    }
    return true
}, {
    message: "startDate and endDate are required when timeframe is 'custom'"
})

const royaltyCompositionQuery = z.object({
    timeframe: z.enum(Object.values(ERoyaltyTimeframe)).optional().default(ERoyaltyTimeframe.LAST_30_DAYS),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
}).refine((data) => {
    if (data.timeframe === ERoyaltyTimeframe.CUSTOM) {
        return data.startDate && data.endDate
    }
    return true
}, {
    message: "startDate and endDate are required when timeframe is 'custom'"
})

const royaltyPerformanceQuery = z.object({
    timeframe: z.enum(Object.values(ERoyaltyTimeframe)).optional().default(ERoyaltyTimeframe.LAST_YEAR),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    type: z.enum(['regular', 'bonus', 'both']).optional().default('both')
}).refine((data) => {
    if (data.timeframe === ERoyaltyTimeframe.CUSTOM) {
        return data.startDate && data.endDate
    }
    return true
}, {
    message: "startDate and endDate are required when timeframe is 'custom'"
})

const royaltyPlatformQuery = z.object({
    timeframe: z.enum(Object.values(ERoyaltyTimeframe)).optional().default(ERoyaltyTimeframe.LAST_30_DAYS),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    type: z.enum(['regular', 'bonus', 'both']).optional().default('both')
}).refine((data) => {
    if (data.timeframe === ERoyaltyTimeframe.CUSTOM) {
        return data.startDate && data.endDate
    }
    return true
}, {
    message: "startDate and endDate are required when timeframe is 'custom'"
})

const royaltyTopTracksQuery = z.object({
    timeframe: z.enum(Object.values(ERoyaltyTimeframe)).optional().default(ERoyaltyTimeframe.LAST_30_DAYS),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    type: z.enum(['regular', 'bonus', 'both']).optional().default('both'),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional().default(10)
}).refine((data) => {
    if (data.timeframe === ERoyaltyTimeframe.CUSTOM) {
        return data.startDate && data.endDate
    }
    return true
}, {
    message: "startDate and endDate are required when timeframe is 'custom'"
})

export default {
    royaltyDashboardQuery,
    royaltyMonthlyTrendsQuery,
    royaltyCompositionQuery,
    royaltyPerformanceQuery,
    royaltyPlatformQuery,
    royaltyTopTracksQuery
}