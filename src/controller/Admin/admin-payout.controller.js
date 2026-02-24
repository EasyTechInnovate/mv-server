import PayoutRequest from '../../model/payoutRequest.model.js'
import Wallet from '../../model/wallet.model.js'
import User from '../../model/user.model.js'
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
