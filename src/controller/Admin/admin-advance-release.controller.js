import AdvancedRelease from '../../model/advanced-release.model.js'
import User from '../../model/user.model.js'
import { EReleaseStatus } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

export default {
    async self(req, res, next) {
        try {
            return httpResponse(req, res, 200, responseMessage.SERVICE('Admin Advanced Release Management'))
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getAllReleases(req, res, next) {
        try {
            const { page = 1, limit = 10, status, releaseType, userId, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

            const filter = { isActive: true }
            if (status) filter.releaseStatus = status
            if (releaseType) filter.releaseType = releaseType
            if (userId) filter.userId = userId

            if (search) {
                filter.$or = [
                    { 'step1.releaseInfo.releaseName': { $regex: search, $options: 'i' } },
                    { releaseId: { $regex: search, $options: 'i' } }
                ]
            }

            const sort = {}
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1

            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)
            const skip = (pageNum - 1) * limitNum

            const [releases, total] = await Promise.all([
                AdvancedRelease.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum)
                    .populate('userId', 'firstName lastName emailAddress accountId')
                    .populate('step1.releaseInfo.labelName', 'name')
                    .populate('adminReview.reviewedBy', 'firstName lastName')
                    .lean(),
                AdvancedRelease.countDocuments(filter)
            ])

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    releases,
                    pagination: {
                        currentPage: pageNum,
                        totalPages: Math.ceil(total / limitNum),
                        totalItems: total,
                        itemsPerPage: limitNum
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getPendingReviews(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query

            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)
            const skip = (pageNum - 1) * limitNum

            const [releases, total] = await Promise.all([
                AdvancedRelease.findPendingReviews()
                    .sort({ submittedAt: 1 })
                    .skip(skip)
                    .limit(limitNum)
                    .populate('step1.releaseInfo.labelName', 'name')
                    .lean(),
                AdvancedRelease.countDocuments({ 
                    releaseStatus: EReleaseStatus.SUBMITTED,
                    isActive: true 
                })
            ])

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    pendingReleases: releases,
                    pagination: {
                        currentPage: pageNum,
                        totalPages: Math.ceil(total / limitNum),
                        totalItems: total,
                        itemsPerPage: limitNum
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getReleaseStats(req, res, next) {
        try {
            const stats = await AdvancedRelease.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$releaseStatus',
                        count: { $sum: 1 }
                    }
                }
            ])

            const releaseTypeStats = await AdvancedRelease.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$releaseType',
                        count: { $sum: 1 }
                    }
                }
            ])

            const totalReleases = await AdvancedRelease.countDocuments({ isActive: true })
            const todaySubmissions = await AdvancedRelease.countDocuments({
                submittedAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                isActive: true
            })

            const statusStats = {}
            stats.forEach(stat => {
                statusStats[stat._id] = stat.count
            })

            const typeStats = {}
            releaseTypeStats.forEach(stat => {
                typeStats[stat._id] = stat.count
            })

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    totalReleases,
                    todaySubmissions,
                    statusBreakdown: statusStats,
                    typeBreakdown: typeStats
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getReleaseById(req, res, next) {
        try {
            const { releaseId } = req.params

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
                .populate('userId', 'firstName lastName emailAddress accountId phoneNumber')
                .populate('step1.releaseInfo.labelName', 'name membershipStatus')
                .populate('adminReview.reviewedBy', 'firstName lastName')
                .populate('takeDown.processedBy', 'firstName lastName')

            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    release: {
                        ...release.toObject(),
                        completionPercentage: release.completionPercentage
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async approveForReview(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id
            const { releaseId } = req.params
            const { notes } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (release.releaseStatus !== EReleaseStatus.SUBMITTED) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only submitted releases can be approved for review')),
                    req,
                    400
                )
            }

            release.approveForProcessing()
            release.adminReview.reviewedBy = adminId
            release.adminReview.reviewedAt = new Date()
            if (notes) {
                release.adminReview.adminNotes = notes
            }

            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release approved for processing'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    reviewedAt: release.adminReview.reviewedAt
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async startProcessing(req, res, next) {
        try {
            const { releaseId } = req.params

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (release.releaseStatus !== EReleaseStatus.UNDER_REVIEW) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only releases under review can start processing')),
                    req,
                    400
                )
            }

            release.startProcessing()
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release processing started'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async publishRelease(req, res, next) {
        try {
            const { releaseId } = req.params

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (release.releaseStatus !== EReleaseStatus.PROCESSING) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only processing releases can be published')),
                    req,
                    400
                )
            }

            release.publishRelease()
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release published successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    publishedAt: release.publishedAt
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async goLive(req, res, next) {
        try {
            const { releaseId } = req.params

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (release.releaseStatus !== EReleaseStatus.PUBLISHED) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only published releases can go live')),
                    req,
                    400
                )
            }

            release.goLive()
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release is now live'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    liveAt: release.liveAt
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async rejectRelease(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id
            const { releaseId } = req.params
            const { reason } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (![EReleaseStatus.SUBMITTED, EReleaseStatus.UNDER_REVIEW].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only submitted or under review releases can be rejected')),
                    req,
                    400
                )
            }

            release.rejectRelease(reason, adminId)
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release rejected'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    rejectionReason: release.adminReview.rejectionReason,
                    reviewedAt: release.adminReview.reviewedAt
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async processTakeDown(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id
            const { releaseId } = req.params

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (!release.takeDown.requestedAt) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('No takedown request found for this release')),
                    req,
                    404
                )
            }

            if (release.takeDown.processedAt) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Takedown already processed')),
                    req,
                    400
                )
            }

            release.processTakedown(adminId)
            release.isActive = false
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Takedown processed successfully'),
                {
                    releaseId: release.releaseId,
                    processedAt: release.takeDown.processedAt
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async provideUPC(req, res, next) {
        try {
            const { releaseId } = req.params
            const { upcCode } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (!release.step1.releaseInfo.needsUPC) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('This release does not require admin-provided UPC')),
                    req,
                    400
                )
            }

            release.step1.releaseInfo.adminProvidedUPC = upcCode
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('UPC code provided successfully'),
                {
                    releaseId: release.releaseId,
                    upcCode: release.step1.releaseInfo.adminProvidedUPC
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async provideISRC(req, res, next) {
        try {
            const { releaseId } = req.params
            const { trackId, isrcCode } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            const track = release.step2.tracks.id(trackId)
            if (!track) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Track')),
                    req,
                    404
                )
            }

            if (!track.needsISRC) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('This track does not require admin-provided ISRC')),
                    req,
                    400
                )
            }

            track.adminProvidedISRC = isrcCode
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('ISRC code provided successfully'),
                {
                    releaseId: release.releaseId,
                    trackId: track._id,
                    isrcCode: track.adminProvidedISRC
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async saveAudioFootprinting(req, res, next) {
        try {
            const { releaseId } = req.params
            const { footprintingData } = req.body
            const adminId = req.authenticatedUser._id

            if (!footprintingData || !Array.isArray(footprintingData)) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('footprintingData must be an array')), req, 400)
            }

            const release = await AdvancedRelease.findOne({ _id: releaseId, isActive: true })

            if (!release) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Release')), req, 404)
            }

            // Add checkedBy and checkedAt to each footprinting entry
            const processedData = footprintingData.map(data => ({
                ...data,
                checkedBy: adminId,
                checkedAt: new Date()
            }))

            // Append new footprinting data
            release.audioFootprinting.push(...processedData)
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Audio footprinting data saved successfully'),
                {
                    releaseId: release._id,
                    totalFootprints: release.audioFootprinting.length
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}