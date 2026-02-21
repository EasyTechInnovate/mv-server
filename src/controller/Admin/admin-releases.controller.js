import BasicRelease from '../../model/basic-release.model.js'
import User from '../../model/user.model.js'
import { EReleaseStatus, EReleaseStep } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import quicker from '../../util/quicker.js'

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
            const { page = 1, limit = 10, status, trackType, userId, search, isExport } = req.query;

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
                            { accountId: { $regex: searchRegex } }
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

            let releasesQuery = BasicRelease.find(query)
                .populate('userId', 'firstName lastName emailAddress userType accountId')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            if (isExport === 'true') {
                // For export, we need ALL details. Populate everything.
                releasesQuery = releasesQuery
                    .populate('adminReview.reviewedBy', 'firstName lastName emailAddress')
            }

            const releases = await releasesQuery;

            const total = await BasicRelease.countDocuments(query);

            let releasesData = [];

            if (isExport === 'true') {
                // Return full rich object for export mapping
                releasesData = releases;
            } else {
                // Return simplified list for table view
                releasesData = releases.map(release => ({
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
                        userType: release.userId.userType,
                        accountId: release.userId.accountId
                    },
                    createdAt: release.createdAt,
                    submittedAt: release.submittedAt,
                    publishedAt: release.publishedAt,
                    liveAt: release.liveAt
                }));
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    releases: releasesData,
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
                .populate('userId', 'firstName lastName emailAddress userType phoneNumber accountId')
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
                        phone: release.userId.phoneNumber,
                        accountId: release.userId.accountId
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

            // Only allow if in TAKE_DOWN status (or LIVE if forcing, but usually TAKE_DOWN)
            if (release.releaseStatus !== EReleaseStatus.TAKE_DOWN && release.releaseStatus !== EReleaseStatus.LIVE) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Release is not in a valid state for takedown processing')),
                    req,
                    400
                );
            }

            release.takeDown.processedAt = new Date();
            release.takeDown.processedBy = adminId;
            release.releaseStatus = EReleaseStatus.TAKEN_DOWN; // New status
            // release.isActive = false; // KEEP ACTIVE so it shows in admin list
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

    async rejectTakeDown(req, res, next) {
        try {
            const { releaseId } = req.params;
            const { reason } = req.body; // Optional reason

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
                    new Error(responseMessage.customMessage('Only take down requests can be rejected')),
                    req,
                    400
                );
            }

            // Revert to LIVE
            release.releaseStatus = EReleaseStatus.LIVE;
            
            // Clear takedown data but keep history if needed? 
            // For now, let's keep request data but mark as rejected? 
            // Or just clear it to allow fresh request. Clearing is simpler for state.
            release.takeDown = undefined; 

            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Take down request rejected - Release is Live again'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async revertTakeDown(req, res, next) {
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

            if (release.releaseStatus !== EReleaseStatus.TAKEN_DOWN) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only taken down releases can be restored')),
                    req,
                    400
                );
            }

            release.releaseStatus = EReleaseStatus.LIVE;
            release.takeDown = undefined; // Clear previous takedown info
            
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release restored to Live successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus
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
    },

    async saveAudioFootprinting(req, res, next) {
        try {
            const { releaseId } = req.params
            const { footprintingData } = req.body
            const adminId = req.authenticatedUser._id

            if (!footprintingData || !Array.isArray(footprintingData)) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('footprintingData must be an array')), req, 400)
            }

            const release = await BasicRelease.findOne({ releaseId: releaseId, isActive: true })

            if (!release) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Release')), req, 404)
            }

            // Add checkedBy and checkedAt to each footprinting entry
            const processedData = footprintingData.map(data => ({
                ...data,
                checkedBy: adminId,
                checkedAt: new Date()
            }))

            // For each new footprint, remove any existing footprint for the same trackId
            // This prevents duplicates when re-checking the same track
            processedData.forEach(newFootprint => {
                if (newFootprint.trackId) {
                    // Remove existing footprint for this track
                    release.audioFootprinting = release.audioFootprinting.filter(
                        existing => existing.trackId?.toString() !== newFootprint.trackId.toString()
                    )
                }
            })

            // Add new footprinting data
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
    },

    async editRelease(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id
            const { releaseId } = req.params
            const { step1, step2, step3, trackType } = req.body

            const release = await BasicRelease.findOne({ releaseId, isActive: true })

            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            // Update trackType if provided
            if (trackType) {
                release.trackType = trackType
            }

            // Update step1 - Cover Art & Release Info
            if (step1) {
                if (step1.coverArt) {
                    if (step1.coverArt.imageUrl !== undefined) release.step1.coverArt.imageUrl = step1.coverArt.imageUrl
                    if (step1.coverArt.imageSize !== undefined) release.step1.coverArt.imageSize = step1.coverArt.imageSize
                    if (step1.coverArt.imageFormat !== undefined) release.step1.coverArt.imageFormat = step1.coverArt.imageFormat
                    if (step1.coverArt.singerName !== undefined) release.step1.coverArt.singerName = step1.coverArt.singerName
                }
                if (step1.releaseInfo) {
                    if (step1.releaseInfo.releaseName !== undefined) release.step1.releaseInfo.releaseName = step1.releaseInfo.releaseName
                    if (step1.releaseInfo.genre !== undefined) release.step1.releaseInfo.genre = step1.releaseInfo.genre
                    if (step1.releaseInfo.labelName !== undefined) release.step1.releaseInfo.labelName = step1.releaseInfo.labelName
                    if (step1.releaseInfo.upc !== undefined) release.step1.releaseInfo.upc = step1.releaseInfo.upc
                }
            }

            // Update step2 - Tracks
            if (step2 && step2.tracks) {
                release.step2.tracks = step2.tracks
            }

            // Update step3 - Distribution Settings
            if (step3) {
                if (step3.releaseDate !== undefined) release.step3.releaseDate = step3.releaseDate
                if (step3.territorialRights) {
                    if (step3.territorialRights.hasRights !== undefined) release.step3.territorialRights.hasRights = step3.territorialRights.hasRights
                    if (step3.territorialRights.territories !== undefined) release.step3.territorialRights.territories = step3.territorialRights.territories
                }
                if (step3.partnerSelection) {
                    if (step3.partnerSelection.hasPartners !== undefined) release.step3.partnerSelection.hasPartners = step3.partnerSelection.hasPartners
                    if (step3.partnerSelection.partners !== undefined) release.step3.partnerSelection.partners = step3.partnerSelection.partners
                }
                if (step3.copyrights) {
                    if (step3.copyrights.ownsCopyright !== undefined) release.step3.copyrights.ownsCopyright = step3.copyrights.ownsCopyright
                    if (step3.copyrights.copyrightDocuments !== undefined) release.step3.copyrights.copyrightDocuments = step3.copyrights.copyrightDocuments
                }
            }

            // Track admin edit
            release.adminReview.reviewedBy = adminId
            release.adminReview.reviewedAt = new Date()

            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release updated successfully'),
                {
                    releaseId: release.releaseId,
                    trackType: release.trackType,
                    step1: release.step1,
                    step2: release.step2,
                    step3: release.step3,
                    updatedAt: release.updatedAt
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getEditRequests(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query

            const query = {
                isActive: true,
                'updateRequest.requestedAt': { $exists: true, $ne: null }
            }

            const releases = await BasicRelease.find(query)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .sort({ 'updateRequest.requestedAt': -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean()

            const count = await BasicRelease.countDocuments(query)

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Edit requests fetched successfully'),
                {
                    releases,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                    totalItems: count
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async approveEditRequest(req, res, next) {
        try {
            const { releaseId } = req.params
            const adminId = req.authenticatedUser._id

            const release = await BasicRelease.findOne({ releaseId, isActive: true })

            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (!release.updateRequest?.requestedAt) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('No edit request found for this release')),
                    req,
                    404
                )
            }

            // Move release back to draft so user can edit
            release.releaseStatus = EReleaseStatus.DRAFT
            
            // Clear update request
            release.updateRequest.requestedAt = null
            release.updateRequest.requestReason = null
            release.updateRequest.requestedChanges = null

            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Edit request approved - Release moved to draft'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async rejectEditRequest(req, res, next) {
        try {
            const { releaseId } = req.params
            const { reason } = req.body

            if (!reason || !reason.trim()) {
                return httpError(
                    next,
                    new Error(responseMessage.COMMON.INVALID_PARAMETERS('Rejection reason is required')),
                    req,
                    400
                )
            }

            const release = await BasicRelease.findOne({ releaseId, isActive: true })

            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (!release.updateRequest?.requestedAt) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('No edit request found for this release')),
                    req,
                    404
                )
            }

            // Clear update request and keep original status
            release.updateRequest.requestedAt = null
            release.updateRequest.requestReason = null
            release.updateRequest.requestedChanges = null

            // If status was update_request, revert to LIVE
            if (release.releaseStatus === EReleaseStatus.UPDATE_REQUEST) {
                release.releaseStatus = EReleaseStatus.LIVE
            }

            await release.save()

            // TODO: Send notification to user about rejection with reason

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Edit request rejected'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    rejectionReason: reason
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async permanentDelete(req, res, next) {
        try {
            const { releaseId } = req.params

            const release = await BasicRelease.findOneAndDelete({ releaseId })

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
                responseMessage.customMessage('Release permanently deleted'),
                {
                    releaseId: release.releaseId
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async createForUser(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id
            const { userId, trackType, step1, step2, step3 } = req.body

            if (!userId || !trackType) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('userId and trackType are required')),
                    req,
                    400
                )
            }

            const user = await User.findById(userId)
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('User')),
                    req,
                    404
                )
            }

            const releaseId = await quicker.generateReleaseId('basic', trackType, BasicRelease)

            const release = new BasicRelease({
                userId,
                releaseId,
                trackType,
                releaseStatus: EReleaseStatus.SUBMITTED,
                currentStep: EReleaseStep.RELEASE_SETTINGS,
                submittedAt: new Date()
            })

            // Populate step1
            if (step1) {
                if (step1.coverArt) {
                    release.step1.coverArt = step1.coverArt
                }
                if (step1.releaseInfo) {
                    release.step1.releaseInfo = step1.releaseInfo
                }
                release.step1.isCompleted = true
                release.step1.completedAt = new Date()
            }

            // Populate step2
            if (step2 && step2.tracks) {
                release.step2.tracks = step2.tracks
                release.step2.isCompleted = true
                release.step2.completedAt = new Date()
            }

            // Populate step3
            if (step3) {
                if (step3.releaseDate) release.step3.releaseDate = step3.releaseDate
                if (step3.territorialRights) release.step3.territorialRights = step3.territorialRights
                if (step3.partnerSelection) release.step3.partnerSelection = step3.partnerSelection
                if (step3.copyrights) release.step3.copyrights = step3.copyrights
                release.step3.isCompleted = true
                release.step3.completedAt = new Date()
            }

            release.completedSteps = 3
            release.adminReview.reviewedBy = adminId
            release.adminReview.reviewedAt = new Date()

            await release.save()

            return httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('Release created for user successfully'),
                {
                    releaseId: release.releaseId,
                    userId: user._id,
                    userName: `${user.firstName} ${user.lastName}`,
                    trackType: release.trackType,
                    releaseStatus: release.releaseStatus,
                    createdAt: release.createdAt
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
};