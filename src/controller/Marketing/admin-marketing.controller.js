import SyncSubmission from '../../model/sync-submission.model.js'
import PlaylistPitching from '../../model/playlist-pitching.model.js'
import { EMarketingSubmissionStatus } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Admin Marketing'), null)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getAllSyncSubmissions(req, res, next) {
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

            if (status && Object.values(EMarketingSubmissionStatus).includes(status)) {
                filter.status = status
            }

            if (search) {
                filter.$or = [
                    { trackName: { $regex: search, $options: 'i' } },
                    { artistName: { $regex: search, $options: 'i' } },
                    { labelName: { $regex: search, $options: 'i' } },
                    { userAccountId: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [submissions, totalCount] = await Promise.all([
                SyncSubmission.find(filter)
                    .populate('userId', 'firstName lastName email accountId')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                SyncSubmission.countDocuments(filter)
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
                    submissions,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getAllPlaylistPitchingSubmissions(req, res, next) {
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

            if (status && Object.values(EMarketingSubmissionStatus).includes(status)) {
                filter.status = status
            }

            if (search) {
                filter.$or = [
                    { trackName: { $regex: search, $options: 'i' } },
                    { artistName: { $regex: search, $options: 'i' } },
                    { labelName: { $regex: search, $options: 'i' } },
                    { userAccountId: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [submissions, totalCount] = await Promise.all([
                PlaylistPitching.find(filter)
                    .populate('userId', 'firstName lastName email accountId')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                PlaylistPitching.countDocuments(filter)
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
                    submissions,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getSyncSubmissionById(req, res, next) {
        try {
            const { submissionId } = req.params

            const submission = await SyncSubmission.findOne({
                _id: submissionId,
                isActive: true
            })
            .populate('userId', 'firstName lastName email accountId phone kyc subscription')
            .lean()

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Sync submission')), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, submission)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getPlaylistPitchingSubmissionById(req, res, next) {
        try {
            const { submissionId } = req.params

            const submission = await PlaylistPitching.findOne({
                _id: submissionId,
                isActive: true
            })
            .populate('userId', 'firstName lastName email accountId phone kyc subscription')
            .lean()

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Playlist pitching submission')), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, submission)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async reviewSyncSubmission(req, res, next) {
        try {
            const { submissionId } = req.params
            const { action, rejectionReason, adminNotes } = req.body
            const reviewerId = req.authenticatedUser._id

            const submission = await SyncSubmission.findOne({
                _id: submissionId,
                isActive: true
            })

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Sync submission')), req, 404)
            }

            if (action === 'approve') {
                await submission.approve(reviewerId, adminNotes)
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.customMessage('Sync submission approved successfully'),
                    submission
                )
            } else if (action === 'reject') {
                await submission.reject(reviewerId, rejectionReason, adminNotes)
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.customMessage('Sync submission rejected successfully'),
                    submission
                )
            }
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async reviewPlaylistPitchingSubmission(req, res, next) {
        try {
            const { submissionId } = req.params
            const { action, rejectionReason, adminNotes } = req.body
            const reviewerId = req.authenticatedUser._id

            const submission = await PlaylistPitching.findOne({
                _id: submissionId,
                isActive: true
            })

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Playlist pitching submission')), req, 404)
            }

            if (action === 'approve') {
                await submission.approve(reviewerId, adminNotes)
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.customMessage('Playlist pitching submission approved successfully'),
                    submission
                )
            } else if (action === 'reject') {
                await submission.reject(reviewerId, rejectionReason, adminNotes)
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.customMessage('Playlist pitching submission rejected successfully'),
                    submission
                )
            }
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getPendingSyncSubmissions(req, res, next) {
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

            const [submissions, totalCount] = await Promise.all([
                SyncSubmission.find({
                    status: EMarketingSubmissionStatus.PENDING,
                    isActive: true
                })
                .populate('userId', 'firstName lastName email accountId')
                .sort(sortObj)
                .skip(skip)
                .limit(limitNumber)
                .lean(),
                SyncSubmission.countDocuments({
                    status: EMarketingSubmissionStatus.PENDING,
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
                    submissions,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getPendingPlaylistPitchingSubmissions(req, res, next) {
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

            const [submissions, totalCount] = await Promise.all([
                PlaylistPitching.find({
                    status: EMarketingSubmissionStatus.PENDING,
                    isActive: true
                })
                .populate('userId', 'firstName lastName email accountId')
                .sort(sortObj)
                .skip(skip)
                .limit(limitNumber)
                .lean(),
                PlaylistPitching.countDocuments({
                    status: EMarketingSubmissionStatus.PENDING,
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
                    submissions,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getPlaylistPitchingByStore(req, res, next) {
        try {
            const { store } = req.params
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
                selectedStore: store,
                isActive: true
            }

            if (status && Object.values(EMarketingSubmissionStatus).includes(status)) {
                filter.status = status
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [submissions, totalCount] = await Promise.all([
                PlaylistPitching.find(filter)
                    .populate('userId', 'firstName lastName email accountId')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                PlaylistPitching.countDocuments(filter)
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
                    submissions,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMarketingStats(req, res, next) {
        try {
            const { type = 'both' } = req.query

            let syncStats = []
            let playlistStats = []

            if (type === 'sync' || type === 'both') {
                syncStats = await SyncSubmission.aggregate([
                    { $match: { isActive: true } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            }

            if (type === 'playlist_pitching' || type === 'both') {
                playlistStats = await PlaylistPitching.aggregate([
                    { $match: { isActive: true } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            }

            const stats = {
                sync: syncStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count
                    return acc
                }, {}),
                playlistPitching: playlistStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count
                    return acc
                }, {})
            }

            if (type === 'sync') {
                delete stats.playlistPitching
            } else if (type === 'playlist_pitching') {
                delete stats.sync
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, stats)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async updatePlaylistPitchingSubmission(req, res, next) {
        try {
            const { submissionId } = req.params
            const updateData = req.body

            const submission = await PlaylistPitching.findOne({
                _id: submissionId,
                isActive: true
            })

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Playlist pitching submission')), req, 404)
            }

            Object.assign(submission, updateData)
            await submission.save()

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Playlist pitching submission updated successfully'),
                submission
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async deletePlaylistPitchingSubmission(req, res, next) {
        try {
            const { submissionId } = req.params

            const submission = await PlaylistPitching.findOne({
                _id: submissionId,
                isActive: true
            })

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Playlist pitching submission')), req, 404)
            }

            submission.isActive = false
            await submission.save()

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Playlist pitching submission deleted successfully'),
                null
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async updateSyncSubmission(req, res, next) {
        try {
            const { submissionId } = req.params
            const updateData = req.body

            const submission = await SyncSubmission.findOne({
                _id: submissionId,
                isActive: true
            })

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Sync submission')), req, 404)
            }

            Object.assign(submission, updateData)
            await submission.save()

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Sync submission updated successfully'),
                submission
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async deleteSyncSubmission(req, res, next) {
        try {
            const { submissionId } = req.params

            const submission = await SyncSubmission.findOne({
                _id: submissionId,
                isActive: true
            })

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Sync submission')), req, 404)
            }

            submission.isActive = false
            await submission.save()

            httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Sync submission deleted successfully'),
                null
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}