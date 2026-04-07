import SyncSubmission from '../../model/sync-submission.model.js'
import PlaylistPitching from '../../model/playlist-pitching.model.js'
import { EMarketingSubmissionStatus } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import { sendSyncRequestSubmittedEmail, sendPlaylistPitchingSubmittedEmail } from '../../service/emailService.js'

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Marketing'), null)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async submitSyncRequest(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const userAccountId = req.authenticatedUser.accountId
            const submissionData = {
                ...req.body,
                userId,
                userAccountId
            }

            const syncSubmission = new SyncSubmission(submissionData)
            const savedSubmission = await syncSubmission.save()

            sendSyncRequestSubmittedEmail(req.authenticatedUser.emailAddress, req.authenticatedUser.firstName, savedSubmission.trackName).catch(() => {})

            httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('Sync submission created successfully'),
                savedSubmission
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async submitPlaylistPitchingRequest(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const userAccountId = req.authenticatedUser.accountId
            const submissionData = {
                ...req.body,
                userId,
                userAccountId
            }

            const playlistSubmission = new PlaylistPitching(submissionData)
            const savedSubmission = await playlistSubmission.save()

            sendPlaylistPitchingSubmittedEmail(req.authenticatedUser.emailAddress, req.authenticatedUser.firstName, savedSubmission.trackName).catch(() => {})

            httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('Playlist pitching submission created successfully'),
                savedSubmission
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMySyncSubmissions(req, res, next) {
        try {
            const userAccountId = req.authenticatedUser.accountId
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

            let filter = {
                userAccountId,
                isActive: true
            }

            if (status && Object.values(EMarketingSubmissionStatus).includes(status)) {
                filter.status = status
            }

            if (search) {
                filter.$or = [
                    { trackName: { $regex: search, $options: 'i' } },
                    { artistName: { $regex: search, $options: 'i' } },
                    { labelName: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [submissions, totalCount] = await Promise.all([
                SyncSubmission.find(filter)
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

    async getMyPlaylistPitchingSubmissions(req, res, next) {
        try {
            const userAccountId = req.authenticatedUser.accountId
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

            let filter = {
                userAccountId,
                isActive: true
            }

            if (status && Object.values(EMarketingSubmissionStatus).includes(status)) {
                filter.status = status
            }

            if (search) {
                filter.$or = [
                    { trackName: { $regex: search, $options: 'i' } },
                    { artistName: { $regex: search, $options: 'i' } },
                    { labelName: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [submissions, totalCount] = await Promise.all([
                PlaylistPitching.find(filter)
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
            const userAccountId = req.authenticatedUser.accountId

            const submission = await SyncSubmission.findOne({
                _id: submissionId,
                userAccountId,
                isActive: true
            }).lean()

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
            const userAccountId = req.authenticatedUser.accountId

            const submission = await PlaylistPitching.findOne({
                _id: submissionId,
                userAccountId,
                isActive: true
            }).lean()

            if (!submission) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Playlist pitching submission')), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, submission)
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMyMarketingStats(req, res, next) {
        try {
            const userAccountId = req.authenticatedUser.accountId
            const { type = 'both' } = req.query

            let syncStats = []
            let playlistStats = []

            if (type === 'sync' || type === 'both') {
                syncStats = await SyncSubmission.aggregate([
                    { $match: { userAccountId, isActive: true } },
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
                    { $match: { userAccountId, isActive: true } },
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
    }
}