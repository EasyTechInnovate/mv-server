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
