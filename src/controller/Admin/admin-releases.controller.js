import BasicRelease from '../../model/basic-release.model.js'
import User from '../../model/user.model.js'
import { EReleaseStatus } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Admin Releases'));
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async getAllReleases(req, res, next) {
        try {
            const { page = 1, limit = 10, status, trackType, userId, search } = req.query;

            const query = { isActive: true };
            if (status) query.releaseStatus = status;
            if (trackType) query.trackType = trackType;
            if (userId) query.userId = userId;

            if (search) {
                const searchRegex = new RegExp(search, 'i');

                const orConditions = [
                    { releaseId: { $regex: searchRegex } },
                    { 'step1.releaseInfo.releaseName': { $regex: searchRegex } },
                ];

                // Only search by artist name if a specific user filter is not already applied
                if (!userId) {
                    const userQuery = {
                        $or: [
                            { firstName: { $regex: searchRegex } },
                            { lastName: { $regex: searchRegex } },
                        ]
                    };
                    const matchingUsers = await User.find(userQuery).select('_id');
                    if (matchingUsers.length > 0) {
                        const userIds = matchingUsers.map(user => user._id);
                        orConditions.push({ userId: { $in: userIds } });
                    }
                }
                
                query.$or = orConditions;
            }
        
            const releases = await BasicRelease.find(query)
                .populate('userId', 'firstName lastName emailAddress userType')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await BasicRelease.countDocuments(query);

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    releases: releases.map(release => ({
                        releaseId: release.releaseId,
                        releaseName: release.releaseTitle,
                        trackType: release.trackType,
                        trackCount: release.step2?.tracks?.length || 0,
                        releaseStatus: release.releaseStatus,
                        completionPercentage: release.completionPercentage,
                        stepsCompleted: `${release.completedSteps}/${release.totalSteps}`,
                        isReadyForSubmission: release.isReadyForSubmission,
                        user: {
                            name: `${release.userId.firstName} ${release.userId.lastName}`,
                            email: release.userId.emailAddress,
                            userType: release.userId.userType
                        },
                        createdAt: release.createdAt,
                        submittedAt: release.submittedAt,
                        publishedAt: release.publishedAt,
                        liveAt: release.liveAt
                    })),
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    }
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getPendingReviews(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;

            const releases = await BasicRelease.findPendingReviews()
                .populate('userId', 'firstName lastName emailAddress userType')
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await BasicRelease.countDocuments({
                releaseStatus: { $in: [EReleaseStatus.SUBMITTED, EReleaseStatus.UPDATE_REQUEST] },
                isActive: true
            });

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    releases: releases.map(release => ({
                        releaseId: release.releaseId,
                        releaseName: release.releaseTitle,
                        trackType: release.trackType,
                        releaseStatus: release.releaseStatus,
                        user: {
                            name: `${release.userId.firstName} ${release.userId.lastName}`,
                            email: release.userId.emailAddress,
                            userType: release.userId.userType
                        },
                        submittedAt: release.submittedAt,
                        updateRequest: release.updateRequest
                    })),
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    }
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getReleaseDetails(req, res, next) {
        try {
            const { releaseId } = req.params;

            const release = await BasicRelease.findOne({ releaseId, isActive: true })
                .populate('userId', 'firstName lastName emailAddress userType phoneNumber')
                .populate('adminReview.reviewedBy', 'firstName lastName emailAddress');

            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    releaseId: release.releaseId,
                    trackType: release.trackType,
                    releaseStatus: release.releaseStatus,
                    currentStep: release.currentStep,
                    completionPercentage: release.completionPercentage,
                    user: {
                        id: release.userId._id,
                        name: `${release.userId.firstName} ${release.userId.lastName}`,
                        email: release.userId.emailAddress,
                        userType: release.userId.userType,
                        phone: release.userId.phoneNumber
                    },
                    step1: release.step1,
                    step2: release.step2,
                    step3: release.step3,
                    adminReview: release.adminReview,
                    updateRequest: release.updateRequest,
                    takeDown: release.takeDown,
                    createdAt: release.createdAt,
                    updatedAt: release.updatedAt,
                    submittedAt: release.submittedAt,
                    publishedAt: release.publishedAt,
                    liveAt: release.liveAt
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async approveForReview(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id;
            const { releaseId } = req.params;
            const { notes = '' } = req.body;

            const release = await BasicRelease.findOne({ releaseId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus !== EReleaseStatus.SUBMITTED) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only submitted releases can be approved for review')),
                    req,
                    400
                );
            }

            release.approveForProcessing(adminId, notes);
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release approved for review successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    adminReview: release.adminReview
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async startProcessing(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id;
            const { releaseId } = req.params;

            const release = await BasicRelease.findOne({ releaseId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus !== EReleaseStatus.UNDER_REVIEW) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only releases under review can be processed')),
                    req,
                    400
                );
            }

            release.startProcessing(adminId);
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release processing started successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    adminReview: release.adminReview
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async publishRelease(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id;
            const { releaseId } = req.params;

            const release = await BasicRelease.findOne({ releaseId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus !== EReleaseStatus.PROCESSING) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only processing releases can be published')),
                    req,
                    400
                );
            }

            release.publishRelease(adminId);
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release published successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    publishedAt: release.publishedAt,
                    adminReview: release.adminReview
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async goLive(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id;
            const { releaseId } = req.params;

            const release = await BasicRelease.findOne({ releaseId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus !== EReleaseStatus.PUBLISHED) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only published releases can go live')),
                    req,
                    400
                );
            }

            release.goLive(adminId);
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release is now live successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    liveAt: release.liveAt,
                    adminReview: release.adminReview
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async rejectRelease(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id;
            const { releaseId } = req.params;
            const { reason } = req.body;

            if (!reason) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Rejection reason is required')),
                    req,
                    400
                );
            }

            const release = await BasicRelease.findOne({ releaseId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            const validStatuses = [EReleaseStatus.SUBMITTED, EReleaseStatus.UNDER_REVIEW, EReleaseStatus.PROCESSING];
            if (!validStatuses.includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Release cannot be rejected in current status')),
                    req,
                    400
                );
            }

            release.rejectRelease(adminId, reason);
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release rejected successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    adminReview: release.adminReview
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async processTakeDown(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id;
            const { releaseId } = req.params;

            const release = await BasicRelease.findOne({ releaseId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus !== EReleaseStatus.TAKE_DOWN) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only take down requests can be processed')),
                    req,
                    400
                );
            }

            release.takeDown.processedAt = new Date();
            release.takeDown.processedBy = adminId;
            release.isActive = false;
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Take down request processed successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    takeDown: release.takeDown
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getReleaseStats(req, res, next) {
        try {
            const stats = await Promise.all([
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.DRAFT, isActive: true }),
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.SUBMITTED, isActive: true }),
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.UNDER_REVIEW, isActive: true }),
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.PROCESSING, isActive: true }),
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.PUBLISHED, isActive: true }),
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.LIVE, isActive: true }),
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.REJECTED, isActive: true }),
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.TAKE_DOWN, isActive: true }),
                BasicRelease.countDocuments({ releaseStatus: EReleaseStatus.UPDATE_REQUEST, isActive: true }),
                BasicRelease.countDocuments({ trackType: 'single', isActive: true }),
                BasicRelease.countDocuments({ trackType: 'album', isActive: true }),
                BasicRelease.countDocuments({ isActive: true })
            ]);

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    statusCounts: {
                        draft: stats[0],
                        submitted: stats[1],
                        underReview: stats[2],
                        processing: stats[3],
                        published: stats[4],
                        live: stats[5],
                        rejected: stats[6],
                        takeDown: stats[7],
                        updateRequest: stats[8]
                    },
                    trackTypeCounts: {
                        single: stats[9],
                        album: stats[10]
                    },
                    totalReleases: stats[11]
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    }
};