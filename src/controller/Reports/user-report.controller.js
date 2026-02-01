import ReportData from '../../model/report-data.model.js'
import MonthManagement from '../../model/month-management.model.js'
import Analytics from '../../model/analytics.model.js'
import Royalty from '../../model/royalty.model.js'
import reportQuickerController from './report-quicker.controller.js'
import { EReportType, EReportStatus, EAnalyticsTimeframe, ERoyaltyTimeframe } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

export default {
    async getAvailableReports(req, res, next) {
        try {
            const {
                reportType,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query

            let filter = {
                isActive: true,
                status: EReportStatus.COMPLETED
            }

            if (reportType && Object.values(EReportType).includes(reportType)) {
                filter.reportType = reportType
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const reports = await ReportData.find(filter)
                .populate('monthId', 'month displayName type')
                .select('monthId reportType originalFileName fileSize totalRecords summary createdAt processedAt')
                .sort(sortObj)
                .limit(parseInt(limit))

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                reports
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getReportsByType(req, res, next) {
        try {
            const { reportType } = req.params
            const {
                page = 1,
                limit = 10,
                search
            } = req.query

            if (!Object.values(EReportType).includes(reportType)) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('reportType')), req, 400)
            }

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            let filter = {
                reportType,
                isActive: true,
                status: EReportStatus.COMPLETED
            }

            if (search) {
                filter.$or = [
                    { originalFileName: { $regex: search, $options: 'i' } },
                    { fileName: { $regex: search, $options: 'i' } }
                ]
            }

            const [reports, totalCount] = await Promise.all([
                ReportData.find(filter)
                    .populate('monthId', 'month displayName type')
                    .select('monthId reportType originalFileName fileSize totalRecords summary createdAt processedAt')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNumber),
                ReportData.countDocuments(filter)
            ])

            const pagination = {
                totalCount,
                totalPages: Math.ceil(totalCount / limitNumber),
                currentPage: pageNumber,
                hasNext: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrev: pageNumber > 1
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    reports,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getReportData(req, res, next) {
        try {
            const { id } = req.params
            const {
                page = 1,
                limit = 100,
                search,
                sortBy,
                sortOrder = 'asc'
            } = req.query

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const report = await ReportData.findOne({
                _id: id,
                isActive: true,
                status: EReportStatus.COMPLETED
            }).populate('monthId', 'month displayName type')

            if (!report) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Report')), req, 404)
            }

            let data = []
            const dataKey = report.reportType === EReportType.BONUS_ROYALTY ? 'bonusRoyalty' : report.reportType

            if (report.data && report.data[dataKey]) {
                data = [...report.data[dataKey]]

                if (search) {
                    data = data.filter(record =>
                        Object.values(record).some(value =>
                            value && value.toString().toLowerCase().includes(search.toLowerCase())
                        )
                    )
                }
                if (sortBy) {
                    data.sort((a, b) => {
                        const aVal = a[sortBy] || ''
                        const bVal = b[sortBy] || ''

                        if (typeof aVal === 'number' && typeof bVal === 'number') {
                            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
                        } else {
                            const comparison = aVal.toString().localeCompare(bVal.toString())
                            return sortOrder === 'desc' ? -comparison : comparison
                        }
                    })
                }

                const totalCount = data.length
                data = data.slice(skip, skip + limitNumber)

                const pagination = {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limitNumber),
                    currentPage: pageNumber,
                    hasNext: pageNumber < Math.ceil(totalCount / limitNumber),
                    hasPrev: pageNumber > 1
                }

                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.SUCCESS,
                    {
                        reportInfo: {
                            reportType: report.reportType,
                            monthInfo: report.monthId,
                            totalRecords: report.totalRecords,
                            summary: report.summary,
                            processedAt: report.processedAt
                        },
                        data,
                        pagination
                    }
                )
            } else {
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.SUCCESS,
                    {
                        reportInfo: {
                            reportType: report.reportType,
                            monthInfo: report.monthId,
                            totalRecords: report.totalRecords,
                            summary: report.summary,
                            processedAt: report.processedAt
                        },
                        data: [],
                        pagination: { totalCount: 0, totalPages: 0, currentPage: 1, hasNext: false, hasPrev: false }
                    }
                )
            }
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getReportsByMonth(req, res, next) {
        try {
            const { monthId } = req.params

            const month = await MonthManagement.findById(monthId)
            if (!month) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Month')), req, 404)
            }

            const reports = await ReportData.find({
                monthId,
                isActive: true,
                status: EReportStatus.COMPLETED
            })
                .populate('monthId', 'month displayName type')
                .select('monthId reportType originalFileName fileSize totalRecords summary createdAt processedAt')
                .sort({ reportType: 1, createdAt: -1 })

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    monthInfo: month,
                    reports
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getReportSummary(req, res, next) {
        try {
            const { id } = req.params

            const report = await ReportData.findOne({
                _id: id,
                isActive: true,
                status: EReportStatus.COMPLETED
            })
                .populate('monthId', 'month displayName type')
                .select('monthId reportType totalRecords summary processedAt createdAt')

            if (!report) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Report')), req, 404)
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    reportType: report.reportType,
                    monthInfo: report.monthId,
                    totalRecords: report.totalRecords,
                    summary: report.summary,
                    processedAt: report.processedAt,
                    createdAt: report.createdAt
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async searchReportData(req, res, next) {
        try {
            const { id } = req.params
            const {
                search,
                field,
                page = 1,
                limit = 50
            } = req.query

            if (!search) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('search')), req, 400)
            }

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const report = await ReportData.findOne({
                _id: id,
                isActive: true,
                status: EReportStatus.COMPLETED
            }).populate('monthId', 'month displayName type')

            if (!report) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Report')), req, 404)
            }

            let data = []
            const dataKey = report.reportType === EReportType.BONUS_ROYALTY ? 'bonusRoyalty' : report.reportType

            if (report.data && report.data[dataKey]) {
                data = report.data[dataKey]

                if (field) {
                    data = data.filter(record =>
                        record[field] && record[field].toString().toLowerCase().includes(search.toLowerCase())
                    )
                } else {
                    data = data.filter(record =>
                        Object.values(record).some(value =>
                            value && value.toString().toLowerCase().includes(search.toLowerCase())
                        )
                    )
                }

                const totalCount = data.length
                data = data.slice(skip, skip + limitNumber)

                const pagination = {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limitNumber),
                    currentPage: pageNumber,
                    hasNext: pageNumber < Math.ceil(totalCount / limitNumber),
                    hasPrev: pageNumber > 1
                }

                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.SUCCESS,
                    {
                        searchQuery: search,
                        searchField: field || 'all',
                        data,
                        pagination
                    }
                )
            } else {
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.SUCCESS,
                    {
                        searchQuery: search,
                        searchField: field || 'all',
                        data: [],
                        pagination: { totalCount: 0, totalPages: 0, currentPage: 1, hasNext: false, hasPrev: false }
                    }
                )
            }
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    // Analytics endpoint - comprehensive dashboard data
    async getAnalyticsDashboard(req, res, next) {
        try {
            const {
                timeframe = EAnalyticsTimeframe.LAST_30_DAYS,
                groupBy = 'day',
                topTracksLimit = 10,
                countriesLimit = 20
            } = req.query
            const userAccountId = req.authenticatedUser.accountId

            const timeframeConfig = {
                [EAnalyticsTimeframe.LAST_7_DAYS]: { days: 7 },
                [EAnalyticsTimeframe.LAST_30_DAYS]: { days: 30 },
                [EAnalyticsTimeframe.LAST_90_DAYS]: { days: 90 },
                [EAnalyticsTimeframe.LAST_6_MONTHS]: { months: 6 },
                [EAnalyticsTimeframe.LAST_YEAR]: { months: 12 }
            }

            const config = timeframeConfig[timeframe]
            const endDate = new Date()
            const startDate = new Date()

            if (config.days) {
                startDate.setDate(endDate.getDate() - config.days)
            } else if (config.months) {
                startDate.setMonth(endDate.getMonth() - config.months)
            }

            const previousPeriodLength = endDate - startDate
            const previousStartDate = new Date(startDate.getTime() - previousPeriodLength)
            const previousEndDate = new Date(startDate)

            const [
                // Overview metrics
                totalStreams,
                totalRevenue,
                countriesCount,
                activeListeners,
                previousPeriodStreams,
                previousPeriodRevenue,

                // Time series data
                streamsOverTime,
                revenueOverTime,

                // Distribution data
                topTracks,
                platformDistribution,
                countryDistribution,

                // Additional insights
                listenersByCountry,
                listenersByPlatform,
                revenueByPlatform
            ] = await Promise.all([
                // Overview metrics
                Analytics.getUserTotalStreams(userAccountId, { startDate, endDate }),
                Analytics.getUserTotalRevenue(userAccountId, { startDate, endDate }),
                Analytics.getUserCountriesReached(userAccountId, { startDate, endDate }),
                Analytics.getUserActiveListeners(userAccountId, { startDate, endDate }),
                Analytics.getUserTotalStreams(userAccountId, { startDate: previousStartDate, endDate: previousEndDate }),
                Analytics.getUserTotalRevenue(userAccountId, { startDate: previousStartDate, endDate: previousEndDate }),

                // Time series data
                Analytics.getUserStreamsOverTime(userAccountId, { startDate, endDate, groupBy }),
                Analytics.getUserRevenueOverTime(userAccountId, { startDate, endDate, groupBy }),

                // Distribution data
                Analytics.getUserTopTracks(userAccountId, { startDate, endDate, limit: parseInt(topTracksLimit) }),
                Analytics.getUserPlatformDistribution(userAccountId, { startDate, endDate }),
                Analytics.getUserCountryDistribution(userAccountId, { startDate, endDate, limit: parseInt(countriesLimit) }),

                // Additional insights
                Analytics.getUserListenersByCountry(userAccountId, { startDate, endDate, limit: 10 }),
                Analytics.getUserListenersByPlatform(userAccountId, { startDate, endDate }),
                Analytics.getUserRevenueBySources(userAccountId, { startDate, endDate })
            ])

            const streamsGrowth = previousPeriodStreams > 0
                ? ((totalStreams - previousPeriodStreams) / previousPeriodStreams * 100).toFixed(2)
                : totalStreams > 0 ? 100 : 0

            const revenueGrowth = previousPeriodRevenue > 0
                ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100).toFixed(2)
                : totalRevenue > 0 ? 100 : 0

            const dashboardData = {
                timeframe,
                periodStart: startDate,
                periodEnd: endDate,

                // Overview section
                overview: {
                    totalStreams,
                    streamsGrowth: parseFloat(streamsGrowth),
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    revenueGrowth: parseFloat(revenueGrowth),
                    countriesReached: countriesCount,
                    activeListeners
                },

                // Charts data
                charts: {
                    streamsOverTime: {
                        groupBy,
                        data: streamsOverTime
                    },
                    revenueOverTime: {
                        groupBy,
                        data: revenueOverTime
                    }
                },

                // Top content
                topTracks: {
                    limit: parseInt(topTracksLimit),
                    tracks: topTracks
                },

                // Distribution data
                distribution: {
                    platforms: platformDistribution,
                    countries: {
                        limit: parseInt(countriesLimit),
                        data: countryDistribution
                    }
                },

                // Audience insights
                audience: {
                    listenersByCountry,
                    listenersByPlatform
                },

                // Revenue breakdown
                revenue: {
                    byPlatform: revenueByPlatform,
                    total: parseFloat(totalRevenue.toFixed(2))
                }
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, dashboardData)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    // Royalty Management - Comprehensive Dashboard API
    async getRoyaltyDashboard(req, res, next) {
        try {
            const {
                timeframe = ERoyaltyTimeframe.LAST_30_DAYS,
                startDate,
                endDate
            } = req.query
            const userAccountId = req.authenticatedUser.accountId

            // Handle custom timeframe
            let dateFilter = {}
            if (timeframe === ERoyaltyTimeframe.CUSTOM && startDate && endDate) {
                dateFilter.start = new Date(startDate)
                dateFilter.end = new Date(endDate)
            } else {
                const timeframeConfig = {
                    [ERoyaltyTimeframe.LAST_7_DAYS]: { days: 7 },
                    [ERoyaltyTimeframe.LAST_30_DAYS]: { days: 30 },
                    [ERoyaltyTimeframe.LAST_90_DAYS]: { days: 90 },
                    [ERoyaltyTimeframe.LAST_6_MONTHS]: { months: 6 },
                    [ERoyaltyTimeframe.LAST_YEAR]: { months: 12 }
                }
                const config = timeframeConfig[timeframe]
                const endDate = new Date()
                const startDate = new Date()

                if (config.days) {
                    startDate.setDate(endDate.getDate() - config.days)
                } else if (config.months) {
                    startDate.setMonth(endDate.getMonth() - config.months)
                }

                dateFilter.start = startDate
                dateFilter.end = endDate
            }

            // Get all royalty data in parallel
            const [
                totalEarnings,
                thisMonthEarnings,
                monthlyRoyaltyTrends,
                royaltyComposition,
                performanceMetrics,
                monthlyBonusRoyaltyTrends,
                bonusRoyaltyComposition,
                bonusPerformanceMetrics,
                revenueByPlatform,
                platformPerformance,
                topEarningTracks,
                bonusRevenueByPlatform,
                bonusPlatformPerformance,
                topBonusEarningTracks,
                bonusRoyaltyReportSummary
            ] = await Promise.all([
                Royalty.getUserTotalEarnings(userAccountId, dateFilter),
                Royalty.getUserThisMonthEarnings(userAccountId),
                Royalty.getUserMonthlyRoyaltyTrends(userAccountId, dateFilter),
                Royalty.getUserRoyaltyComposition(userAccountId, dateFilter),
                Royalty.getUserPerformanceMetrics(userAccountId, dateFilter),
                Royalty.getUserBonusRoyaltyTrends(userAccountId, dateFilter),
                Royalty.getUserBonusRoyaltyComposition(userAccountId, dateFilter),
                Royalty.getUserBonusPerformanceMetrics(userAccountId, dateFilter),
                Royalty.getUserRevenueByPlatform(userAccountId, dateFilter),
                Royalty.getUserPlatformPerformance(userAccountId, dateFilter),
                Royalty.getUserTopEarningTracks(userAccountId, 10, dateFilter),
                Royalty.getUserBonusRoyaltyByPlatform(userAccountId, dateFilter),
                Royalty.getUserBonusPlatformPerformance(userAccountId, dateFilter),
                Royalty.getUserTopBonusEarningTracks(userAccountId, 10, dateFilter),
                reportQuickerController.getUserBonusRoyaltySummary(userAccountId)
            ])

            // Comprehensive dashboard data in one response
            const dashboardData = {
                // Overview metrics
                overview: {
                    totalEarnings: parseFloat(totalEarnings.regularRoyalty + totalEarnings.bonusRoyalty),
                    regularRoyalty: parseFloat(totalEarnings.regularRoyalty),
                    bonusRoyalty: parseFloat(totalEarnings.bonusRoyalty),
                    thisMonthMoney: parseFloat(thisMonthEarnings.total),
                    thisMonthRegular: parseFloat(thisMonthEarnings.regular),
                    thisMonthBonus: parseFloat(thisMonthEarnings.bonus),
                    growthPercent: parseFloat(thisMonthEarnings.growthPercent || 0)
                },

                // Trends over time
                trends: {
                    monthlyRoyaltyTrends: monthlyRoyaltyTrends.map(item => ({
                        month: item._id,
                        regularRoyalty: parseFloat(item.regularRoyalty),
                        totalEarnings: parseFloat(item.totalEarnings)
                    })),
                    monthlyBonusRoyaltyTrends: monthlyBonusRoyaltyTrends.map(item => ({
                        month: item._id,
                        bonusRoyalty: parseFloat(item.bonusRoyalty),
                        totalEarnings: parseFloat(item.totalEarnings)
                    }))
                },

                // Composition analysis
                composition: {
                    royalty: {
                        regular: parseFloat(royaltyComposition.regular || 0),
                        bonus: parseFloat(royaltyComposition.bonus || 0),
                        percentage: {
                            regular: parseFloat(royaltyComposition.regularPercentage || 0),
                            bonus: parseFloat(royaltyComposition.bonusPercentage || 0)
                        }
                    },
                    bonusRoyalty: {
                        composition: bonusRoyaltyComposition,
                        percentage: bonusRoyaltyComposition.percentage || {}
                    }
                },

                // Performance metrics
                performance: {
                    regular: {
                        averageMonthly: parseFloat(performanceMetrics.averageMonthly || 0),
                        bestMonth: {
                            month: performanceMetrics.bestMonth?.month || null,
                            amount: parseFloat(performanceMetrics.bestMonth?.amount || 0)
                        },
                        growthRate: parseFloat(performanceMetrics.growthRate || 0)
                    },
                    bonus: {
                        averageMonthly: parseFloat(bonusPerformanceMetrics.averageMonthly || 0),
                        bestMonth: {
                            month: bonusPerformanceMetrics.bestMonth?.month || null,
                            amount: parseFloat(bonusPerformanceMetrics.bestMonth?.amount || 0)
                        },
                        growthRate: parseFloat(bonusPerformanceMetrics.growthRate || 0)
                    }
                },

                // Platform data
                platforms: {
                    regular: {
                        revenue: revenueByPlatform.map(item => ({
                            platform: item._id,
                            revenue: parseFloat(item.revenue),
                            percentage: parseFloat(item.percentage)
                        })),
                        performance: platformPerformance
                    },
                    bonus: {
                        revenue: bonusRevenueByPlatform.map(item => ({
                            platform: item._id,
                            revenue: parseFloat(item.revenue),
                            percentage: parseFloat(item.percentage)
                        })),
                        performance: bonusPlatformPerformance
                    }
                },

                // Top earning tracks
                topTracks: {
                    regular: topEarningTracks.map(track => ({
                        trackTitle: track._id,
                        revenue: parseFloat(track.revenue),
                        streams: track.streams || 0,
                        artist: track.artist || 'Unknown'
                    })),
                    bonus: topBonusEarningTracks.map(track => ({
                        trackTitle: track._id,
                        revenue: parseFloat(track.revenue),
                        streams: track.streams || 0,
                        artist: track.artist || 'Unknown'
                    }))
                },

                // Bonus Royalty Report Summary (from uploaded CSV reports)
                bonusRoyaltyReports: {
                    summary: {
                        totalRecords: bonusRoyaltyReportSummary.totalRecords || 0,
                        totalUnits: bonusRoyaltyReportSummary.totalUnits || 0,
                        totalBonus: parseFloat(bonusRoyaltyReportSummary.totalBonus || 0),
                        totalRoyalty: parseFloat(bonusRoyaltyReportSummary.totalRoyalty || 0),
                        totalRevenue: parseFloat(bonusRoyaltyReportSummary.totalRevenue || 0),
                        totalIncome: parseFloat(bonusRoyaltyReportSummary.totalIncome || 0),
                        totalCommission: parseFloat(bonusRoyaltyReportSummary.totalCommission || 0),
                        reportsCount: bonusRoyaltyReportSummary.reportsCount || 0
                    },
                    topTracks: bonusRoyaltyReportSummary.topTracks || [],
                    platformBreakdown: bonusRoyaltyReportSummary.platformBreakdown || [],
                    monthlyBreakdown: bonusRoyaltyReportSummary.monthlyBreakdown || []
                }
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, dashboardData)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMCNDashboard(req, res, next) {
        try {
            const {
                timeframe = ERoyaltyTimeframe.LAST_30_DAYS,
                startDate,
                endDate
            } = req.query
            const userAccountId = req.authenticatedUser.accountId

            // Handle custom timeframe
            let dateFilter = {}
            if (timeframe === ERoyaltyTimeframe.CUSTOM && startDate && endDate) {
                dateFilter.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            } else {
                const timeframeConfig = {
                    [ERoyaltyTimeframe.LAST_7_DAYS]: { days: 7 },
                    [ERoyaltyTimeframe.LAST_30_DAYS]: { days: 30 },
                    [ERoyaltyTimeframe.LAST_90_DAYS]: { days: 90 },
                    [ERoyaltyTimeframe.LAST_6_MONTHS]: { months: 6 },
                    [ERoyaltyTimeframe.LAST_YEAR]: { months: 12 }
                }
                const config = timeframeConfig[timeframe]
                const end = new Date()
                const start = new Date()

                if (config.days) {
                    start.setDate(end.getDate() - config.days)
                } else if (config.months) {
                    start.setMonth(end.getMonth() - config.months)
                }

                dateFilter.createdAt = {
                    $gte: start,
                    $lte: end
                }
            }

            // Get MCN data
            const MCN = (await import('../../model/mcn.model.js')).default

            const [
                totalEarnings,
                monthlyTrends,
                channelPerformance,
                overallStats
            ] = await Promise.all([
                // Total earnings for user
                MCN.aggregate([
                    { $match: { userAccountId, isActive: true, ...dateFilter } },
                    {
                        $group: {
                            _id: null,
                            totalPayoutInr: { $sum: '$payoutRevenueInr' },
                            totalRevenueUsd: { $sum: '$revenueUsd' },
                            totalMvCommission: { $sum: '$mvCommission' },
                            totalYoutubePayoutUsd: { $sum: '$youtubePayoutUsd' },
                            channelCount: { $sum: 1 },
                            avgRevenueShare: { $avg: '$revenueSharePercent' }
                        }
                    }
                ]),
                // Monthly trends
                MCN.aggregate([
                    { $match: { userAccountId, isActive: true, ...dateFilter } },
                    {
                        $group: {
                            _id: { month: '$reportMonth', year: '$reportYear' },
                            totalPayoutInr: { $sum: '$payoutRevenueInr' },
                            totalRevenueUsd: { $sum: '$revenueUsd' },
                            totalMvCommission: { $sum: '$mvCommission' },
                            channels: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': -1, '_id.month': -1 } },
                    { $limit: 12 }
                ]),
                // Channel-wise performance
                MCN.aggregate([
                    { $match: { userAccountId, isActive: true, ...dateFilter } },
                    {
                        $group: {
                            _id: {
                                channelId: '$assetChannelId',
                                channelName: '$youtubeChannelName'
                            },
                            totalPayoutInr: { $sum: '$payoutRevenueInr' },
                            totalRevenueUsd: { $sum: '$revenueUsd' },
                            totalMvCommission: { $sum: '$mvCommission' },
                            avgRevenueShare: { $avg: '$revenueSharePercent' },
                            months: { $sum: 1 }
                        }
                    },
                    { $sort: { totalPayoutInr: -1 } },
                    { $limit: 10 }
                ]),
                // Overall stats (all time)
                MCN.aggregate([
                    { $match: { userAccountId, isActive: true } },
                    {
                        $group: {
                            _id: null,
                            allTimeTotalPayoutInr: { $sum: '$payoutRevenueInr' },
                            allTimeTotalRevenueUsd: { $sum: '$revenueUsd' },
                            allTimeTotalMvCommission: { $sum: '$mvCommission' },
                            uniqueChannels: { $addToSet: '$assetChannelId' }
                        }
                    }
                ])
            ])

            const earnings = totalEarnings[0] || {
                totalPayoutInr: 0,
                totalRevenueUsd: 0,
                totalMvCommission: 0,
                totalYoutubePayoutUsd: 0,
                channelCount: 0,
                avgRevenueShare: 0
            }

            const stats = overallStats[0] || {
                allTimeTotalPayoutInr: 0,
                allTimeTotalRevenueUsd: 0,
                allTimeTotalMvCommission: 0,
                uniqueChannels: []
            }

            const dashboardData = {
                overview: {
                    totalPayoutInr: parseFloat(earnings.totalPayoutInr || 0),
                    totalRevenueUsd: parseFloat(earnings.totalRevenueUsd || 0),
                    totalMvCommission: parseFloat(earnings.totalMvCommission || 0),
                    totalYoutubePayoutUsd: parseFloat(earnings.totalYoutubePayoutUsd || 0),
                    activeChannels: earnings.channelCount || 0,
                    avgRevenueShare: parseFloat(earnings.avgRevenueShare || 0),
                    allTimeEarnings: parseFloat(stats.allTimeTotalPayoutInr || 0),
                    totalUniqueChannels: stats.uniqueChannels?.length || 0
                },
                trends: monthlyTrends.map(item => ({
                    month: `${item._id.month}-${item._id.year}`,
                    payoutInr: parseFloat(item.totalPayoutInr || 0),
                    revenueUsd: parseFloat(item.totalRevenueUsd || 0),
                    mvCommission: parseFloat(item.totalMvCommission || 0),
                    channels: item.channels || 0
                })),
                topChannels: channelPerformance.map(channel => ({
                    channelId: channel._id.channelId,
                    channelName: channel._id.channelName,
                    totalPayoutInr: parseFloat(channel.totalPayoutInr || 0),
                    totalRevenueUsd: parseFloat(channel.totalRevenueUsd || 0),
                    mvCommission: parseFloat(channel.totalMvCommission || 0),
                    avgRevenueShare: parseFloat(channel.avgRevenueShare || 0),
                    months: channel.months || 0
                }))
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, dashboardData)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}