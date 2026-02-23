import User from '../model/user.model.js'
import BasicRelease from '../model/basic-release.model.js'
import AdvancedRelease from '../model/advanced-release.model.js'
import Wallet from '../model/wallet.model.js'
import SupportTicket from '../model/support-ticket.model.js'
import PayoutRequest from '../model/payoutRequest.model.js'
import Royalty from '../model/royalty.model.js'
import { EReleaseStatus } from '../constant/application.js'
import responseMessage from '../constant/responseMessage.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'

const releaseStatuses = Object.values(EReleaseStatus)

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const getReleaseCountsByStatus = async (Model, filter = {}) => {
    const counts = await Model.aggregate([
        { $match: { isActive: true, ...filter } },
        { $group: { _id: '$releaseStatus', count: { $sum: 1 } } }
    ])

    const result = {}
    releaseStatuses.forEach(status => { result[status] = 0 })
    counts.forEach(c => { result[c._id] = c.count })
    result.total = counts.reduce((sum, c) => sum + c.count, 0)
    return result
}

const getLast6Months = () => {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
            year: d.getFullYear(),
            monthNum: d.getMonth() + 1,
            label: MONTH_NAMES[d.getMonth()]
        })
    }
    return months
}

export default {
    async userDashboard(req, res, next) {
        try {
            const userId = req.authenticatedUser._id

            const last6Months = getLast6Months()
            const sixMonthsAgo = new Date(last6Months[0].year, last6Months[0].monthNum - 1, 1)

            const userDoc = await User.findById(userId).select('subscription accountId').lean()
            const accountId = userDoc?.accountId

            const [
                basicReleases,
                advancedReleases,
                wallet,
                totalStreamsData,
                monthlyRoyaltyData,
                recentBasicRaw,
                recentAdvancedRaw
            ] = await Promise.all([
                getReleaseCountsByStatus(BasicRelease, { userId }),
                getReleaseCountsByStatus(AdvancedRelease, { userId }),
                Wallet.findByUserId(userId),
                accountId ? Royalty.aggregate([
                    { $match: { userAccountId: accountId } },
                    { $group: { _id: null, totalStreams: { $sum: '$totalUnits' } } }
                ]) : Promise.resolve([]),
                accountId ? Royalty.aggregate([
                    { $match: { userAccountId: accountId, createdAt: { $gte: sixMonthsAgo } } },
                    {
                        $group: {
                            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                            earnings: { $sum: '$totalEarnings' },
                            streams: { $sum: '$totalUnits' }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ]) : Promise.resolve([]),
                BasicRelease.find({ userId, isActive: true })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('releaseId step1.coverArt.singerName step1.releaseInfo.releaseName step1.releaseInfo.upc trackType releaseStatus createdAt')
                    .lean(),
                AdvancedRelease.find({ userId, isActive: true })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('releaseId step1.coverArt.singerName step1.releaseInfo.releaseName step1.releaseInfo.upc releaseType releaseStatus createdAt')
                    .lean()
            ])

            // Build chart data for last 6 months
            const royaltyByMonth = {}
            monthlyRoyaltyData.forEach(d => {
                royaltyByMonth[`${d._id.year}-${d._id.month}`] = d
            })

            const monthlyEarnings = last6Months.map(m => ({
                month: m.label,
                earnings: royaltyByMonth[`${m.year}-${m.monthNum}`]?.earnings || 0
            }))

            const monthlyStreams = last6Months.map(m => ({
                month: m.label,
                streams: royaltyByMonth[`${m.year}-${m.monthNum}`]?.streams || 0
            }))

            // Get streams per release by UPC
            const allUPCs = [
                ...recentBasicRaw.map(r => r.step1?.releaseInfo?.upc),
                ...recentAdvancedRaw.map(r => r.step1?.releaseInfo?.upc)
            ].filter(Boolean)

            let streamsByUPC = {}
            if (allUPCs.length > 0 && accountId) {
                const streamsData = await Royalty.aggregate([
                    { $match: { userAccountId: accountId, upc: { $in: allUPCs } } },
                    { $group: { _id: '$upc', streams: { $sum: '$totalUnits' } } }
                ])
                streamsData.forEach(s => { streamsByUPC[s._id] = s.streams })
            }

            const mapRelease = (r, type) => ({
                releaseId: r.releaseId,
                releaseName: r.step1?.releaseInfo?.releaseName || 'Untitled',
                artistName: Array.isArray(r.step1?.coverArt?.singerName) && r.step1.coverArt.singerName.length
                    ? r.step1.coverArt.singerName.join(', ')
                    : '',
                releaseType: type === 'basic' ? r.trackType : r.releaseType,
                releaseStatus: r.releaseStatus,
                streamsCount: r.step1?.releaseInfo?.upc ? (streamsByUPC[r.step1.releaseInfo.upc] || 0) : 0,
                createdAt: r.createdAt
            })

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    basicReleases,
                    advancedReleases,
                    totalReleases: basicReleases.total + advancedReleases.total,
                    totalStreams: totalStreamsData[0]?.totalStreams || 0,
                    wallet: wallet ? {
                        totalEarnings: wallet.totalEarnings,
                        availableBalance: wallet.availableBalance,
                        withdrawableBalance: wallet.withdrawableBalance,
                        pendingPayout: wallet.pendingPayout,
                        totalPaidOut: wallet.totalPaidOut
                    } : null,
                    subscription: userDoc?.subscription || null,
                    charts: {
                        monthlyEarnings,
                        monthlyStreams
                    },
                    recentReleases: {
                        basic: recentBasicRaw.map(r => mapRelease(r, 'basic')),
                        advanced: recentAdvancedRaw.map(r => mapRelease(r, 'advanced'))
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async adminDashboard(req, res, next) {
        try {
            const last6Months = getLast6Months()
            const sixMonthsAgo = new Date(last6Months[0].year, last6Months[0].monthNum - 1, 1)
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

            const [
                usersByType,
                totalUsers,
                basicReleases,
                advancedReleases,
                walletStats,
                pendingPayouts,
                openTickets,
                recentUsers,
                pendingKYCData,
                monthlyRevenueData,
                monthlyUserGrowthData,
                basicActivity24h,
                advancedActivity24h,
                userActivity24h,
                recentBasicSubmissions,
                recentAdvancedSubmissions,
                recentKYCVerified
            ] = await Promise.all([
                User.aggregate([
                    { $match: { role: 'user', isActive: true } },
                    { $group: { _id: '$userType', count: { $sum: 1 } } }
                ]),
                User.countDocuments({ role: 'user', isActive: true }),
                getReleaseCountsByStatus(BasicRelease),
                getReleaseCountsByStatus(AdvancedRelease),
                Wallet.aggregate([
                    { $match: { isActive: true } },
                    {
                        $group: {
                            _id: null,
                            totalEarnings: { $sum: '$totalEarnings' },
                            totalAvailable: { $sum: '$availableBalance' },
                            totalPaidOut: { $sum: '$totalPaidOut' },
                            totalPending: { $sum: '$pendingPayout' }
                        }
                    }
                ]),
                PayoutRequest.countDocuments({ status: 'pending' }),
                SupportTicket.countDocuments({ status: { $in: ['open', 'pending'] } }),
                User.find({ role: 'user', isActive: true })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('firstName lastName emailAddress userType createdAt accountId')
                    .lean(),
                // Pending KYC with urgent (>7 days) vs standard breakdown
                User.aggregate([
                    { $match: { role: 'user', 'kyc.status': 'pending', isActive: true } },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            urgent: {
                                $sum: { $cond: [{ $lte: ['$updatedAt', sevenDaysAgo] }, 1, 0] }
                            }
                        }
                    }
                ]),
                // Monthly revenue (from Royalty model, last 6 months)
                Royalty.aggregate([
                    { $match: { createdAt: { $gte: sixMonthsAgo } } },
                    {
                        $group: {
                            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                            revenue: { $sum: '$totalEarnings' }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ]),
                // Monthly user growth (last 6 months)
                User.aggregate([
                    { $match: { role: 'user', isActive: true, createdAt: { $gte: sixMonthsAgo } } },
                    {
                        $group: {
                            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                            users: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ]),
                // Platform usage (24h) - releases updated in last 24h, bucketed by 4-hour slots
                BasicRelease.aggregate([
                    { $match: { updatedAt: { $gte: twentyFourHoursAgo } } },
                    { $group: { _id: { $floor: { $divide: [{ $hour: '$updatedAt' }, 4] } }, count: { $sum: 1 } } }
                ]),
                AdvancedRelease.aggregate([
                    { $match: { updatedAt: { $gte: twentyFourHoursAgo } } },
                    { $group: { _id: { $floor: { $divide: [{ $hour: '$updatedAt' }, 4] } }, count: { $sum: 1 } } }
                ]),
                User.aggregate([
                    { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
                    { $group: { _id: { $floor: { $divide: [{ $hour: '$createdAt' }, 4] } }, count: { $sum: 1 } } }
                ]),
                // Recent submissions for activity feed
                BasicRelease.find({ releaseStatus: EReleaseStatus.SUBMITTED, isActive: true })
                    .sort({ submittedAt: -1 })
                    .limit(3)
                    .select('step1.releaseInfo.releaseName submittedAt')
                    .lean(),
                AdvancedRelease.find({ releaseStatus: EReleaseStatus.SUBMITTED, isActive: true })
                    .sort({ submittedAt: -1 })
                    .limit(3)
                    .select('step1.releaseInfo.releaseName submittedAt')
                    .lean(),
                // Recent KYC verifications
                User.find({ role: 'user', 'kyc.status': 'verified', isActive: true })
                    .sort({ updatedAt: -1 })
                    .limit(3)
                    .select('firstName lastName updatedAt')
                    .lean()
            ])

            // Build chart data

            // Platform usage (24h) — 6 buckets: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
            const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
            const activityByBucket = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            ;[...basicActivity24h, ...advancedActivity24h, ...userActivity24h].forEach(d => {
                if (d._id !== null && d._id >= 0 && d._id <= 5) {
                    activityByBucket[d._id] = (activityByBucket[d._id] || 0) + d.count
                }
            })
            const platformUsage24h = timeLabels.map((time, i) => ({
                time,
                value: activityByBucket[i] || 0
            }))

            // Revenue & user growth (last 6 months)
            const revenueByMonth = {}
            monthlyRevenueData.forEach(d => {
                revenueByMonth[`${d._id.year}-${d._id.month}`] = d.revenue
            })

            const usersByMonth = {}
            monthlyUserGrowthData.forEach(d => {
                usersByMonth[`${d._id.year}-${d._id.month}`] = d.users
            })

            const revenueGrowth = last6Months.map(m => ({
                month: m.label,
                value: revenueByMonth[`${m.year}-${m.monthNum}`] || 0
            }))

            const userGrowth = last6Months.map(m => ({
                month: m.label,
                value: usersByMonth[`${m.year}-${m.monthNum}`] || 0
            }))

            // Recent system activities (synthesized from multiple models)
            const rawActivities = []

            recentUsers.forEach(u => {
                rawActivities.push({
                    type: 'info',
                    message: `New user ${u.firstName} ${u.lastName} registered`,
                    time: u.createdAt
                })
            })

            recentBasicSubmissions.forEach(r => {
                if (r.submittedAt) {
                    rawActivities.push({
                        type: 'success',
                        message: `Release "${r.step1?.releaseInfo?.releaseName || 'Untitled'}" submitted for review`,
                        time: r.submittedAt
                    })
                }
            })

            recentAdvancedSubmissions.forEach(r => {
                if (r.submittedAt) {
                    rawActivities.push({
                        type: 'success',
                        message: `Advanced release "${r.step1?.releaseInfo?.releaseName || 'Untitled'}" submitted for review`,
                        time: r.submittedAt
                    })
                }
            })

            recentKYCVerified.forEach(u => {
                rawActivities.push({
                    type: 'success',
                    message: `KYC verified for ${u.firstName} ${u.lastName}`,
                    time: u.updatedAt
                })
            })

            rawActivities.sort((a, b) => new Date(b.time) - new Date(a.time))
            const recentSystemActivities = rawActivities.slice(0, 10)

            // Pending KYC breakdown
            const kycRaw = pendingKYCData[0] || { total: 0, urgent: 0 }
            const pendingKYC = {
                total: kycRaw.total,
                urgent: kycRaw.urgent,
                standard: kycRaw.total - kycRaw.urgent
            }

            const userTypeBreakdown = {}
            usersByType.forEach(u => { userTypeBreakdown[u._id] = u.count })

            const revenue = walletStats[0] || {
                totalEarnings: 0,
                totalAvailable: 0,
                totalPaidOut: 0,
                totalPending: 0
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    users: {
                        total: totalUsers,
                        byType: userTypeBreakdown
                    },
                    basicReleases,
                    advancedReleases,
                    totalReleases: basicReleases.total + advancedReleases.total,
                    revenue: {
                        totalEarnings: revenue.totalEarnings,
                        totalAvailable: revenue.totalAvailable,
                        totalPaidOut: revenue.totalPaidOut,
                        totalPending: revenue.totalPending
                    },
                    pendingItems: {
                        pendingReviews: (basicReleases[EReleaseStatus.SUBMITTED] || 0) + (advancedReleases[EReleaseStatus.SUBMITTED] || 0),
                        pendingPayouts,
                        openTickets
                    },
                    pendingKYC,
                    charts: {
                        platformUsage24h,
                        revenueGrowth,
                        userGrowth
                    },
                    recentSystemActivities,
                    recentUsers
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}
