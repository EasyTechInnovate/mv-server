import MCNRequest from '../../model/mcn-request.model.js'
import MCNChannel from '../../model/mcn-channel.model.js'
import { EMCNRequestStatus } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('MCN'), null)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async submitMCNRequest(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const userAccountId = req.authenticatedUser.accountId
            const requestData = {
                ...req.body,
                userId,
                userAccountId
            }

            const existingPendingRequest = await MCNRequest.findOne({
                userAccountId,
                youtubeChannelId: req.body.youtubeChannelId,
                status: { $in: [EMCNRequestStatus.PENDING, EMCNRequestStatus.APPROVED] },
                isActive: true
            })

            if (existingPendingRequest) {
                return httpError(next, new Error(responseMessage.ERROR.ALREADY_EXISTS('MCN request for this channel')), req, 400)
            }

            const mcnRequest = new MCNRequest(requestData)
            const savedRequest = await mcnRequest.save()

            httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('MCN request submitted successfully'),
                savedRequest
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMyRequests(req, res, next) {
        try {
            const userAccountId = req.authenticatedUser.accountId
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

            let filter = {
                userAccountId
            }

            if (status && Object.values(EMCNRequestStatus).includes(status)) {
                filter.status = status
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [requests, totalCount] = await Promise.all([
                MCNRequest.find(filter)
                    .populate('userId', 'firstName lastName')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                MCNRequest.countDocuments(filter)
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

    async getRequestById(req, res, next) {
        try {
            const { requestId } = req.params
            const userAccountId = req.authenticatedUser.accountId

            const request = await MCNRequest.findOne({
                _id: requestId,
                userAccountId,
                isActive: true
            }).lean()

            if (!request) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('MCN request')), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, request)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMyChannels(req, res, next) {
        try {
            const userAccountId = req.authenticatedUser.accountId
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

            let filter = {
                userAccountId,
            }

            if (status) {
                filter.status = status
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [channels, totalCount] = await Promise.all([
                MCNChannel.find(filter)
                    .populate('mcnRequestId', 'youtubeChannelName youtubeChannelId subscriberCount')
                    .populate('userId', 'firstName lastName')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                MCNChannel.countDocuments(filter)
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
                    channels,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getChannelById(req, res, next) {
        try {
            const { channelId } = req.params
            const userAccountId = req.authenticatedUser.accountId

            const channel = await MCNChannel.findOne({
                _id: channelId,
                userAccountId,
                isActive: true
            })
            .populate('mcnRequestId', 'youtubeChannelName youtubeChannelId subscriberCount')
            .lean()

            if (!channel) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('MCN channel')), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, channel)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async requestRemoval(req, res, next) {
        try {
            const { requestId } = req.params
            const userAccountId = req.authenticatedUser.accountId

            const mcnRequest = await MCNRequest.findOne({
                _id: requestId,
                userAccountId,
                status: EMCNRequestStatus.APPROVED,
                isActive: true
            })

            if (!mcnRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Approved MCN request')), req, 404)
            }

            await mcnRequest.requestRemoval()

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Channel removal request submitted successfully'),
                mcnRequest
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMyStats(req, res, next) {
        try {
            const userAccountId = req.authenticatedUser.accountId

            const [requestStats, channelStats] = await Promise.all([
                MCNRequest.aggregate([
                    { $match: { userAccountId, isActive: true } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]),
                MCNChannel.aggregate([
                    { $match: { userAccountId, isActive: true } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            totalRevenue: { $sum: '$totalRevenue' },
                            avgRevenueShare: { $avg: '$revenueShare' }
                        }
                    }
                ])
            ])

            const stats = {
                requests: requestStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count
                    return acc
                }, {}),
                channels: channelStats.reduce((acc, stat) => {
                    acc[stat._id] = {
                        count: stat.count,
                        totalRevenue: stat.totalRevenue || 0,
                        avgRevenueShare: stat.avgRevenueShare || 0
                    }
                    return acc
                }, {})
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, stats)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}