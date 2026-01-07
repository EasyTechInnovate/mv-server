import MCNRequest from '../../model/mcn-request.model.js'
import MCNChannel from '../../model/mcn-channel.model.js'
import { EMCNRequestStatus, EMCNChannelStatus } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Admin MCN'), null)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getAllRequests(req, res, next) {
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

            let filter = { isActive: true }

            if (status && Object.values(EMCNRequestStatus).includes(status)) {
                filter.status = status
            }

            if (search) {
                filter.$or = [
                    { youtubeChannelName: { $regex: search, $options: 'i' } },
                    { youtubeChannelId: { $regex: search, $options: 'i' } },
                    { userAccountId: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [requests, totalCount] = await Promise.all([
                MCNRequest.find(filter)
                    .populate('userId', 'firstName lastName email accountId')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                MCNRequest.countDocuments(filter)
            ])

            const requestIds = requests.map(request => request._id)
            const channels = await MCNChannel.find({ mcnRequestId: { $in: requestIds } }).select('mcnRequestId').lean()
            const createdChannelRequestIds = new Set(channels.map(channel => channel.mcnRequestId.toString()))

            requests.forEach(request => {
                request.isChannelCreated = createdChannelRequestIds.has(request._id.toString())
            })

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

            const request = await MCNRequest.findOne({
                _id: requestId,
                isActive: true
            })
            .populate('userId', 'firstName lastName email accountId phone kyc subscription')
            .lean()

            if (!request) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('MCN request')), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, request)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async reviewRequest(req, res, next) {
        try {
            const { requestId } = req.params
            const { action, rejectionReason, adminNotes } = req.body
            const reviewerId = req.authenticatedUser._id

            const mcnRequest = await MCNRequest.findOne({
                _id: requestId,
                status: EMCNRequestStatus.PENDING,
                isActive: true
            })

            if (!mcnRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Pending MCN request')), req, 404)
            }

            if (action === 'approve') {
                await mcnRequest.approve(reviewerId, adminNotes)
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.customMessage('MCN request approved successfully'),
                    mcnRequest
                )
            } else if (action === 'reject') {
                await mcnRequest.reject(reviewerId, rejectionReason, adminNotes)
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.customMessage('MCN request rejected successfully'),
                    mcnRequest
                )
            }
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async createMCNChannel(req, res, next) {
        try {
            const { requestId } = req.params
            const { channelName, channelLink, revenueShare, channelManager, notes } = req.body

            const mcnRequest = await MCNRequest.findOne({
                _id: requestId,
                status: EMCNRequestStatus.APPROVED,
                isActive: true
            })

            if (!mcnRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Approved MCN request')), req, 404)
            }

            const existingChannel = await MCNChannel.findOne({
                mcnRequestId: requestId,
                isActive: true
            })

            if (existingChannel) {
                return httpError(next, new Error(responseMessage.ERROR.ALREADY_EXISTS('MCN channel for this request')), req, 400)
            }

            const channelData = {
                userId: mcnRequest.userId,
                userAccountId: mcnRequest.userAccountId,
                mcnRequestId: requestId,
                channelName,
                channelLink,
                youtubeChannelId: mcnRequest.youtubeChannelId,
                revenueShare,
                channelManager,
                notes
            }

            const mcnChannel = new MCNChannel(channelData)
            const savedChannel = await mcnChannel.save()

            httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('MCN channel created successfully'),
                savedChannel
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getAllChannels(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                channelManager,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            let filter = {}

            if (status && Object.values(EMCNChannelStatus).includes(status)) {
                filter.status = status
            }

            if (channelManager) {
                filter.channelManager = { $regex: channelManager, $options: 'i' }
            }

            if (search) {
                filter.$or = [
                    { channelName: { $regex: search, $options: 'i' } },
                    { youtubeChannelId: { $regex: search, $options: 'i' } },
                    { userAccountId: { $regex: search, $options: 'i' } },
                    { channelManager: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [channels, totalCount] = await Promise.all([
                MCNChannel.find(filter)
                    .populate('userId', 'firstName lastName email accountId')
                    .populate('mcnRequestId', 'youtubeChannelName subscriberCount')
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

            const channel = await MCNChannel.findOne({
                _id: channelId,
                isActive: true
            })
            .populate('userId', 'firstName lastName email accountId phone')
            .populate('mcnRequestId')
            .lean()

            if (!channel) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('MCN channel')), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, channel)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async updateChannel(req, res, next) {
        try {
            const { channelId } = req.params
            const updateData = req.body

            const channel = await MCNChannel.findOne({
                _id: channelId,
                isActive: true
            })

            if (!channel) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('MCN channel')), req, 404)
            }

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    channel[key] = updateData[key]
                }
            })

            if (updateData.monthlyRevenue !== undefined || updateData.totalRevenue !== undefined) {
                channel.lastRevenueUpdate = new Date()
            }

            const updatedChannel = await channel.save()

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('MCN channel updated successfully'),
                updatedChannel
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async updateChannelStatus(req, res, next) {
        try {
            const { channelId } = req.params
            const { status, suspensionReason } = req.body

            const channel = await MCNChannel.findOne({
                _id: channelId,
                isActive: true
            })

            if (!channel) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('MCN channel')), req, 404)
            }

            if (status === EMCNChannelStatus.SUSPENDED) {
                await channel.suspend(suspensionReason)
            } else if (status === EMCNChannelStatus.ACTIVE) {
                await channel.reactivate()
            } else if (status === EMCNChannelStatus.INACTIVE) {
                await channel.deactivate()
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('MCN channel status updated successfully'),
                channel
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async deleteChannel(req, res, next) {
        try {
            const { channelId } = req.params

            const channel = await MCNChannel.findOne({
                _id: channelId,
                isActive: true
            })

            if (!channel) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('MCN channel')), req, 404)
            }

            channel.isActive = false
            await channel.save()

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('MCN channel deleted successfully'),
                null
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getStats(req, res, next) {
        try {
            const [requestStats, channelStats, revenueStats] = await Promise.all([
                MCNRequest.aggregate([
                    { $match: { isActive: true } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]),
                MCNChannel.aggregate([
                    { $match: { isActive: true } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            totalRevenue: { $sum: '$totalRevenue' },
                            avgRevenueShare: { $avg: '$revenueShare' }
                        }
                    }
                ]),
                MCNChannel.aggregate([
                    { $match: { isActive: true, status: EMCNChannelStatus.ACTIVE } },
                    {
                        $group: {
                            _id: null,
                            totalMonthlyRevenue: { $sum: '$monthlyRevenue' },
                            totalRevenue: { $sum: '$totalRevenue' },
                            totalChannels: { $sum: 1 },
                            avgMonthlyRevenue: { $avg: '$monthlyRevenue' }
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
                }, {}),
                revenue: revenueStats[0] || {
                    totalMonthlyRevenue: 0,
                    totalRevenue: 0,
                    totalChannels: 0,
                    avgMonthlyRevenue: 0
                }
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, stats)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getPendingRequests(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [requests, totalCount] = await Promise.all([
                MCNRequest.find({
                    status: EMCNRequestStatus.PENDING,
                    isActive: true
                })
                .populate('userId', 'firstName lastName email accountId')
                .sort(sortObj)
                .skip(skip)
                .limit(limitNumber)
                .lean(),
                MCNRequest.countDocuments({
                    status: EMCNRequestStatus.PENDING,
                    isActive: true
                })
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

    async processRemovalRequest(req, res, next) {
        try {
            const { requestId } = req.params
            const { adminNotes } = req.body
            const reviewerId = req.authenticatedUser._id

            const mcnRequest = await MCNRequest.findOne({
                _id: requestId,
                status: EMCNRequestStatus.REMOVAL_REQUESTED,
                isActive: true
            })

            if (!mcnRequest) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Removal requested MCN request')), req, 404)
            }

            await mcnRequest.approveRemoval(reviewerId, adminNotes)

            const mcnChannel = await MCNChannel.findOne({
                mcnRequestId: requestId,
                isActive: true
            })

            if (mcnChannel) {
                await mcnChannel.deactivate()
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('MCN removal request processed successfully'),
                mcnRequest
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}