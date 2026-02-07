import User from '../model/user.model.js'
import BasicRelease from '../model/basic-release.model.js'
import AdvancedRelease from '../model/advanced-release.model.js'
import Wallet from '../model/wallet.model.js'
import SupportTicket from '../model/support-ticket.model.js'
import PayoutRequest from '../model/payoutRequest.model.js'
import { EReleaseStatus } from '../constant/application.js'
import responseMessage from '../constant/responseMessage.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'

const releaseStatuses = Object.values(EReleaseStatus)

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

export default {
    async userDashboard(req, res, next) {
        try {
            const userId = req.authenticatedUser._id

            const [basicReleases, advancedReleases, wallet, user] = await Promise.all([
                getReleaseCountsByStatus(BasicRelease, { userId }),
                getReleaseCountsByStatus(AdvancedRelease, { userId }),
                Wallet.findByUserId(userId),
                User.findById(userId).select('subscription').lean()
            ])

            const recentBasic = await BasicRelease.find({ userId, isActive: true })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('releaseId step1.releaseInfo.releaseName trackType releaseStatus createdAt submittedAt')
                .lean()

            const recentAdvanced = await AdvancedRelease.find({ userId, isActive: true })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('releaseId step1.releaseInfo.releaseName releaseType releaseStatus createdAt submittedAt')
                .lean()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    basicReleases,
                    advancedReleases,
                    totalReleases: basicReleases.total + advancedReleases.total,
                    wallet: wallet ? {
                        totalEarnings: wallet.totalEarnings,
                        availableBalance: wallet.availableBalance,
                        withdrawableBalance: wallet.withdrawableBalance,
                        pendingPayout: wallet.pendingPayout,
                        totalPaidOut: wallet.totalPaidOut
                    } : null,
                    subscription: user?.subscription || null,
                    recentReleases: {
                        basic: recentBasic.map(r => ({
                            releaseId: r.releaseId,
                            releaseName: r.step1?.releaseInfo?.releaseName || 'Untitled',
                            trackType: r.trackType,
                            releaseStatus: r.releaseStatus,
                            createdAt: r.createdAt
                        })),
                        advanced: recentAdvanced.map(r => ({
                            releaseId: r.releaseId,
                            releaseName: r.step1?.releaseInfo?.releaseName || 'Untitled',
                            releaseType: r.releaseType,
                            releaseStatus: r.releaseStatus,
                            createdAt: r.createdAt
                        }))
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async adminDashboard(req, res, next) {
        try {
            const [
                usersByType,
                totalUsers,
                basicReleases,
                advancedReleases,
                walletStats,
                pendingPayouts,
                openTickets,
                recentUsers
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
                    .lean()
            ])

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
                    recentUsers
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}
