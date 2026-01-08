import PayoutRequest from '../model/payoutRequest.model.js'
import Wallet from '../model/wallet.model.js'
import { EPayoutMethod } from '../constant/application.js'
import responseMessage from '../constant/responseMessage.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'

const payoutRequestController = {
    async createPayoutRequest(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const accountId = req.authenticatedUser.accountId
            const { amount, payoutMethod = EPayoutMethod.BANK_TRANSFER } = req.body

            if (!amount || amount <= 0) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('amount')), req, 400)
            }

            const wallet = await Wallet.findByUserId(userId)
            if (!wallet) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Wallet')), req, 404)
            }

            if (wallet.withdrawableBalance < amount) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage(`Insufficient balance. Available: ${wallet.withdrawableBalance} INR`)),
                    req,
                    400
                )
            }

            const minPayoutAmount = 100
            if (amount < minPayoutAmount) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage(`Minimum payout amount is ${minPayoutAmount} INR`)),
                    req,
                    400
                )
            }

            const payoutRequest = new PayoutRequest({
                userId,
                accountId,
                amount,
                payoutMethod
            })

            await payoutRequest.save()

            await wallet.addPendingPayout(amount)

            httpResponse(
                req,
                res,
                201,
                responseMessage.CREATED,
                {
                    payoutRequest: {
                        requestId: payoutRequest.requestId,
                        amount: payoutRequest.amount,
                        currency: payoutRequest.currency,
                        payoutMethod: payoutRequest.payoutMethod,
                        status: payoutRequest.status,
                        requestedAt: payoutRequest.requestedAt
                    }
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMyPayoutRequests(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const {
                page = 1,
                limit = 10,
                status,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const filter = { userId, isActive: true }
            if (status) {
                filter.status = status
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [requests, totalCount] = await Promise.all([
                PayoutRequest.find(filter)
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

    async getPayoutRequestById(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { requestId } = req.params

            const payoutRequest = await PayoutRequest.findOne({
                requestId,
                userId,
                isActive: true
            })

            if (!payoutRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payout request')), req, 404)
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                { payoutRequest }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async cancelPayoutRequest(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { requestId } = req.params
            const { reason } = req.body

            const payoutRequest = await PayoutRequest.findOne({
                requestId,
                userId,
                isActive: true
            })

            if (!payoutRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payout request')), req, 404)
            }

            if (payoutRequest.status !== 'pending') {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only pending requests can be cancelled')),
                    req,
                    400
                )
            }

            await payoutRequest.cancel(reason)

            const wallet = await Wallet.findByUserId(userId)
            if (wallet) {
                await wallet.removePendingPayout(payoutRequest.amount)
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Payout request cancelled successfully'),
                { payoutRequest }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}

export default payoutRequestController
