import PayoutRequest from '../../model/payoutRequest.model.js'
import Wallet from '../../model/wallet.model.js'
import User from '../../model/user.model.js'
import Royalty from '../../model/royalty.model.js'
import MCN from '../../model/mcn.model.js'
import { EPayoutStatus } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

const adminPayoutController = {
    async getAllPayoutRequests(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const filter = { isActive: true }
            if (status) {
                filter.status = status
            }
            if (search) {
                filter.$or = [
                    { requestId: { $regex: search, $options: 'i' } },
                    { accountId: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [requests, totalCount] = await Promise.all([
                PayoutRequest.find(filter)
                    .populate('userId', 'firstName lastName emailAddress accountId kyc.bankDetails')
                    .populate('processedBy', 'firstName lastName emailAddress')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber),
                PayoutRequest.countDocuments(filter)
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
                    requests,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getPendingPayoutRequests(req, res, next) {
        try {
            const { limit = 50 } = req.query

            const requests = await PayoutRequest.findPendingRequests(parseInt(limit))

            const totalPending = await PayoutRequest.getTotalPendingAmount()

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    requests,
                    summary: {
                        totalPendingAmount: totalPending.totalAmount,
                        totalPendingCount: totalPending.count
                    }
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getPayoutRequestById(req, res, next) {
        try {
            const { requestId } = req.params

            const payoutRequest = await PayoutRequest.findOne({
                requestId,
                isActive: true
            })
                .populate('userId', 'firstName lastName emailAddress accountId kyc.bankDetails')
                .populate('processedBy', 'firstName lastName emailAddress')

            if (!payoutRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payout request')), req, 404)
            }

            const wallet = await Wallet.findByUserId(payoutRequest.userId._id)

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    payoutRequest,
                    wallet: wallet ? {
                        totalEarnings: wallet.totalEarnings,
                        availableBalance: wallet.availableBalance,
                        pendingPayout: wallet.pendingPayout,
                        withdrawableBalance: wallet.withdrawableBalance
                    } : null
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async approvePayoutRequest(req, res, next) {
        try {
            const { requestId } = req.params
            const { adminNotes } = req.body
            const adminId = req.authenticatedUser._id

            const payoutRequest = await PayoutRequest.findOne({
                requestId,
                isActive: true
            })

            if (!payoutRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payout request')), req, 404)
            }

            if (payoutRequest.status !== EPayoutStatus.PENDING) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only pending requests can be approved')),
                    req,
                    400
                )
            }

            await payoutRequest.approve(adminId, adminNotes)

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Payout request approved successfully'),
                { payoutRequest }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async rejectPayoutRequest(req, res, next) {
        try {
            const { requestId } = req.params
            const { reason, adminNotes } = req.body
            const adminId = req.authenticatedUser._id

            if (!reason) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('reason')), req, 400)
            }

            const payoutRequest = await PayoutRequest.findOne({
                requestId,
                isActive: true
            })

            if (!payoutRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payout request')), req, 404)
            }

            if (payoutRequest.status !== EPayoutStatus.PENDING && payoutRequest.status !== EPayoutStatus.APPROVED) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only pending or approved requests can be rejected')),
                    req,
                    400
                )
            }

            await payoutRequest.reject(adminId, reason, adminNotes)

            const wallet = await Wallet.findByUserId(payoutRequest.userId)
            if (wallet) {
                await wallet.removePendingPayout(payoutRequest.amount)
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Payout request rejected successfully'),
                { payoutRequest }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async markPayoutAsPaid(req, res, next) {
        try {
            const { requestId } = req.params
            const { transactionReference } = req.body

            const payoutRequest = await PayoutRequest.findOne({
                requestId,
                isActive: true
            })

            if (!payoutRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payout request')), req, 404)
            }

            if (payoutRequest.status !== EPayoutStatus.APPROVED) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only approved requests can be marked as paid')),
                    req,
                    400
                )
            }

            await payoutRequest.markAsPaid(transactionReference)

            const wallet = await Wallet.findByUserId(payoutRequest.userId)
            if (wallet) {
                await wallet.markPayoutComplete(payoutRequest.amount)
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Payout marked as paid successfully'),
                { payoutRequest }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async adjustWallet(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id
            const { userId } = req.params
            const { type, amount, reason } = req.body

            if (!type || !['credit', 'debit'].includes(type)) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('type must be credit or debit')), req, 400)
            }

            if (!amount || amount <= 0) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('amount must be greater than 0')), req, 400)
            }

            if (!reason || !reason.trim()) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('reason is required')), req, 400)
            }

            const user = await User.findById(userId)
            if (!user) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404)
            }

            let wallet = await Wallet.findByUserId(userId)
            if (!wallet) {
                wallet = await Wallet.createWallet(userId, user.accountId)
            }

            if (type === 'debit' && amount > wallet.availableBalance) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage(`Insufficient balance. Available: ${wallet.availableBalance}`)),
                    req,
                    400
                )
            }

            await wallet.applyAdminAdjustment(type, amount, reason.trim(), adminId)

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage(`Wallet ${type} of ${amount} applied successfully`),
                {
                    userId: user._id,
                    userName: `${user.firstName} ${user.lastName}`,
                    adjustment: {
                        type,
                        amount,
                        reason: reason.trim(),
                        balanceBefore: wallet.adminAdjustments[wallet.adminAdjustments.length - 1].balanceBefore,
                        balanceAfter: wallet.availableBalance
                    },
                    wallet: {
                        availableBalance: wallet.availableBalance,
                        withdrawableBalance: wallet.withdrawableBalance,
                        totalEarnings: wallet.totalEarnings,
                        pendingPayout: wallet.pendingPayout,
                        totalPaidOut: wallet.totalPaidOut
                    }
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getWalletByUser(req, res, next) {
        try {
            const { userId } = req.params

            const user = await User.findById(userId).select('firstName lastName emailAddress accountId')
            if (!user) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404)
            }

            let wallet = await Wallet.findByUserId(userId)
            if (!wallet) {
                wallet = await Wallet.createWallet(userId, user.accountId)
            }

            // Populate adjustedBy in adminAdjustments
            await wallet.populate('adminAdjustments.adjustedBy', 'firstName lastName emailAddress')

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    user: {
                        id: user._id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.emailAddress,
                        accountId: user.accountId
                    },
                    wallet: {
                        totalEarnings: wallet.totalEarnings,
                        regularRoyalty: wallet.regularRoyalty,
                        bonusRoyalty: wallet.bonusRoyalty,
                        mcnRoyalty: wallet.mcnRoyalty,
                        totalCommission: wallet.totalCommission,
                        availableBalance: wallet.availableBalance,
                        pendingPayout: wallet.pendingPayout,
                        totalPaidOut: wallet.totalPaidOut,
                        withdrawableBalance: wallet.withdrawableBalance,
                        lastCalculatedAt: wallet.lastCalculatedAt,
                        lastCalculatedMonth: wallet.lastCalculatedMonth
                    },
                    adminAdjustments: wallet.adminAdjustments
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getTransactionHistoryForUser(req, res, next) {
        try {
            const { userId } = req.params
            const { page = 1, limit = 20, type, month, year } = req.query

            const user = await User.findById(userId).select('firstName lastName emailAddress accountId')
            if (!user) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404)
            }

            const accountId = user.accountId
            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)

            // ── 1. Royalty credits ──
            const royaltyMatch = { userAccountId: accountId }
            if (month && year) {
                royaltyMatch.reportMonth = month
                royaltyMatch.reportYear = parseInt(year)
            }
            const royaltyByMonth = await Royalty.aggregate([
                { $match: royaltyMatch },
                {
                    $group: {
                        _id: { year: '$reportYear', month: '$reportMonth', royaltyType: '$royaltyType' },
                        totalEarnings: { $sum: '$totalEarnings' },
                        totalStreams: { $sum: '$totalUnits' },
                        latestDate: { $max: '$createdAt' }
                    }
                },
                { $sort: { latestDate: -1 } }
            ])

            // ── 2. MCN earnings ──
            const mcnMatch = { userAccountId: accountId, isActive: true }
            if (month && year) {
                mcnMatch.reportMonth = month
                mcnMatch.reportYear = parseInt(year)
            }
            const mcnByMonth = await MCN.aggregate([
                { $match: mcnMatch },
                {
                    $group: {
                        _id: { year: '$reportYear', month: '$reportMonth' },
                        totalEarnings: { $sum: '$payoutRevenueInr' },
                        latestDate: { $max: '$createdAt' }
                    }
                },
                { $sort: { latestDate: -1 } }
            ])

            // ── 3. Admin adjustments ──
            let wallet = await Wallet.findByUserId(userId)
            if (!wallet) {
                wallet = await Wallet.createWallet(userId, accountId)
            }
            await wallet.populate('adminAdjustments.adjustedBy', 'firstName lastName')

            let adminAdjustments = wallet.adminAdjustments || []
            if (month && year) {
                adminAdjustments = adminAdjustments.filter(adj => {
                    const d = new Date(adj.adjustedAt)
                    return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)
                })
            }

            // ── 4. Payout withdrawals ──
            const payoutMatch = { userId, isActive: true }
            if (month && year) {
                const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
                const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
                payoutMatch.requestedAt = { $gte: startOfMonth, $lte: endOfMonth }
            }
            const payouts = await PayoutRequest.find(payoutMatch).sort({ requestedAt: -1 }).lean()

            // ── Build unified list ──
            const transactions = []

            royaltyByMonth.forEach(r => {
                const isBonus = r._id.royaltyType === 'bonus'
                transactions.push({
                    id: `royalty_${r._id.year}_${r._id.month}_${r._id.royaltyType}`,
                    type: isBonus ? 'bonus_royalty' : 'regular_royalty',
                    direction: 'credit',
                    amount: parseFloat(r.totalEarnings.toFixed(2)),
                    description: `${isBonus ? 'Bonus' : 'Regular'} Royalty — ${r._id.month} ${r._id.year}`,
                    month: `${r._id.month} ${r._id.year}`,
                    streams: r.totalStreams,
                    date: r.latestDate
                })
            })

            mcnByMonth.forEach(m => {
                transactions.push({
                    id: `mcn_${m._id.year}_${m._id.month}`,
                    type: 'mcn_royalty',
                    direction: 'credit',
                    amount: parseFloat(m.totalEarnings.toFixed(2)),
                    description: `MCN Royalty — ${m._id.month} ${m._id.year}`,
                    month: `${m._id.month} ${m._id.year}`,
                    date: m.latestDate
                })
            })

            adminAdjustments.forEach(adj => {
                transactions.push({
                    id: adj._id,
                    type: 'admin_adjustment',
                    direction: adj.type,
                    amount: adj.amount,
                    description: adj.reason,
                    date: adj.adjustedAt,
                    adjustedBy: adj.adjustedBy
                        ? `${adj.adjustedBy.firstName} ${adj.adjustedBy.lastName}`
                        : 'Admin',
                    balanceBefore: adj.balanceBefore,
                    balanceAfter: adj.balanceAfter
                })
            })

            payouts.forEach(p => {
                transactions.push({
                    id: p.requestId,
                    type: 'withdrawal',
                    direction: 'debit',
                    amount: p.amount,
                    description: `Withdrawal — ${p.payoutMethod?.replace('_', ' ')}`,
                    date: p.requestedAt,
                    status: p.status,
                    adminNotes: p.adminNotes,
                    rejectionReason: p.rejectionReason,
                    requestId: p.requestId,
                    transactionReference: p.transactionReference,
                    paidAt: p.paidAt
                })
            })

            const filtered = type ? transactions.filter(t => t.type === type) : transactions
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date))

            const totalItems = filtered.length
            const paged = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)

            const totalCredits = transactions
                .filter(t => t.direction === 'credit')
                .reduce((sum, t) => sum + t.amount, 0)
            const totalDebits = transactions
                .filter(t => t.direction === 'debit')
                .reduce((sum, t) => sum + t.amount, 0)

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                user: {
                    id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.emailAddress,
                    accountId: user.accountId
                },
                transactions: paged,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalItems / limitNum),
                    totalItems,
                    itemsPerPage: limitNum
                },
                summary: {
                    totalCredits: parseFloat(totalCredits.toFixed(2)),
                    totalDebits: parseFloat(totalDebits.toFixed(2)),
                    currentBalance: wallet.availableBalance
                }
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getAllTransactions(req, res, next) {
        try {
            const { page = 1, limit = 20, type, month, year, search } = req.query
            
            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)

            // Optional User Filtering
            let userMatchIds = null
            let userAccountIds = null
            let usersMap = {}
            if (search) {
                const searchRegex = new RegExp(search, 'i')
                const users = await User.find({
                    $or: [
                        { firstName: searchRegex },
                        { lastName: searchRegex },
                        { emailAddress: searchRegex },
                        { accountId: searchRegex }
                    ]
                }).select('_id accountId firstName lastName emailAddress')
                
                userMatchIds = users.map(u => u._id)
                userAccountIds = users.map(u => u.accountId)
                users.forEach(u => {
                    usersMap[u.accountId] = u
                    usersMap[u._id.toString()] = u
                })
            } else {
                 const allUsers = await User.find({}).select('_id accountId firstName lastName emailAddress')
                 allUsers.forEach(u => {
                    usersMap[u.accountId] = u
                    usersMap[u._id.toString()] = u
                })
            }

            // ── 1. Royalty credits ──
            const royaltyMatch = {}
            if (userAccountIds) royaltyMatch.userAccountId = { $in: userAccountIds }
            if (month && year) {
                royaltyMatch.reportMonth = month
                royaltyMatch.reportYear = parseInt(year)
            }
            const royaltyByMonth = await Royalty.aggregate([
                { $match: royaltyMatch },
                {
                    $group: {
                        _id: { year: '$reportYear', month: '$reportMonth', royaltyType: '$royaltyType', userAccountId: '$userAccountId' },
                        totalEarnings: { $sum: '$totalEarnings' },
                        totalStreams: { $sum: '$totalUnits' },
                        latestDate: { $max: '$createdAt' }
                    }
                },
                { $sort: { latestDate: -1 } }
            ])

            // ── 2. MCN earnings ──
            const mcnMatch = { isActive: true }
            if (userAccountIds) mcnMatch.userAccountId = { $in: userAccountIds }
            if (month && year) {
                mcnMatch.reportMonth = month
                mcnMatch.reportYear = parseInt(year)
            }
            const mcnByMonth = await MCN.aggregate([
                { $match: mcnMatch },
                {
                    $group: {
                        _id: { year: '$reportYear', month: '$reportMonth', userAccountId: '$userAccountId' },
                        totalEarnings: { $sum: '$payoutRevenueInr' },
                        latestDate: { $max: '$createdAt' }
                    }
                },
                { $sort: { latestDate: -1 } }
            ])

            // ── 3. Admin adjustments ──
            const walletQuery = {}
            if (userMatchIds) walletQuery.userId = { $in: userMatchIds }
            let wallets = await Wallet.find(walletQuery).populate('userId', 'firstName lastName emailAddress accountId').populate('adminAdjustments.adjustedBy', 'firstName lastName')
            
            let adminAdjustments = []
            wallets.forEach(wallet => {
                let adjustArray = wallet.adminAdjustments || []
                if (month && year) {
                    adjustArray = adjustArray.filter(adj => {
                        const d = new Date(adj.adjustedAt)
                        return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)
                    })
                }
                adjustArray.forEach(adj => {
                    adminAdjustments.push({ ...adj.toObject(), walletUser: wallet.userId })
                })
            })

            // ── 4. Payout withdrawals ──
            const payoutMatch = { isActive: true }
            if (userMatchIds) payoutMatch.userId = { $in: userMatchIds }
            if (month && year) {
                const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
                const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
                payoutMatch.requestedAt = { $gte: startOfMonth, $lte: endOfMonth }
            }
            const payouts = await PayoutRequest.find(payoutMatch).populate('userId', 'firstName lastName emailAddress accountId').sort({ requestedAt: -1 }).lean()

            // ── Build unified list ──
            const transactions = []

            const getUserInfo = (userObj) => {
                if (!userObj) return null;
                return {
                     id: userObj._id,
                     name: `${userObj.firstName} ${userObj.lastName}`,
                     email: userObj.emailAddress,
                     accountId: userObj.accountId
                }
            }

            royaltyByMonth.forEach(r => {
                const isBonus = r._id.royaltyType === 'bonus'
                const u = usersMap[r._id.userAccountId]
                if (u || !userAccountIds) {
                    transactions.push({
                        id: `royalty_${r._id.year}_${r._id.month}_${r._id.royaltyType}_${r._id.userAccountId}`,
                        type: isBonus ? 'bonus_royalty' : 'regular_royalty',
                        direction: 'credit',
                        amount: parseFloat(r.totalEarnings.toFixed(2)),
                        description: `${isBonus ? 'Bonus' : 'Regular'} Royalty - ${r._id.month} ${r._id.year}`,
                        month: `${r._id.month} ${r._id.year}`,
                        streams: r.totalStreams,
                        date: r.latestDate,
                        user: getUserInfo(u)
                    })
                }
            })

            mcnByMonth.forEach(m => {
                 const u = usersMap[m._id.userAccountId]
                 if (u || !userAccountIds) {
                    transactions.push({
                        id: `mcn_${m._id.year}_${m._id.month}_${m._id.userAccountId}`,
                        type: 'mcn_royalty',
                        direction: 'credit',
                        amount: parseFloat(m.totalEarnings.toFixed(2)),
                        description: `MCN Royalty - ${m._id.month} ${m._id.year}`,
                        month: `${m._id.month} ${m._id.year}`,
                        date: m.latestDate,
                        user: getUserInfo(u)
                    })
                }
            })

            adminAdjustments.forEach(adj => {
                transactions.push({
                    id: adj._id,
                    type: 'admin_adjustment',
                    direction: adj.type,
                    amount: adj.amount,
                    description: adj.reason,
                    date: adj.adjustedAt,
                    adjustedBy: adj.adjustedBy
                        ? `${adj.adjustedBy.firstName} ${adj.adjustedBy.lastName}`
                        : 'Admin',
                    balanceBefore: adj.balanceBefore,
                    balanceAfter: adj.balanceAfter,
                    user: getUserInfo(adj.walletUser)
                })
            })

            payouts.forEach(p => {
                transactions.push({
                    id: p.requestId,
                    type: 'withdrawal',
                    direction: 'debit',
                    amount: p.amount,
                    description: `Withdrawal - ${p.payoutMethod?.replace('_', ' ')}`,
                    date: p.requestedAt,
                    status: p.status,
                    requestId: p.requestId,
                    adminNotes: p.adminNotes,
                    rejectionReason: p.rejectionReason,
                    transactionReference: p.transactionReference,
                    paidAt: p.paidAt,
                    user: getUserInfo(p.userId)
                })
            })

            const filtered = type ? transactions.filter(t => t.type === type) : transactions
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date))

            const totalItems = filtered.length
            const paged = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)

            const totalCredits = filtered
                .filter(t => t.direction === 'credit')
                .reduce((sum, t) => sum + t.amount, 0)
            const totalDebits = filtered
                .filter(t => t.direction === 'debit')
                .reduce((sum, t) => sum + t.amount, 0)

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                transactions: paged,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalItems / limitNum),
                    totalItems,
                    itemsPerPage: limitNum
                },
                summary: {
                    totalCredits: parseFloat(totalCredits.toFixed(2)),
                    totalDebits: parseFloat(totalDebits.toFixed(2)),
                }
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getPayoutStats(req, res, next) {
        try {
            const stats = await PayoutRequest.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ])

            const totalPending = await PayoutRequest.getTotalPendingAmount()

            const recentPayouts = await PayoutRequest.find({
                status: EPayoutStatus.PAID,
                isActive: true
            })
                .sort({ paidAt: -1 })
                .limit(10)
                .populate('userId', 'firstName lastName emailAddress accountId')

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    stats: {
                        byStatus: stats,
                        pendingSummary: {
                            totalAmount: totalPending.totalAmount,
                            count: totalPending.count
                        }
                    },
                    recentPayouts
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}

export default adminPayoutController
