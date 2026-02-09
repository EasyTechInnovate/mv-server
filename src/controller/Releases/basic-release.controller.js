import BasicRelease from '../../model/basic-release.model.js'
import User from '../../model/user.model.js'
import { EReleaseStatus, EReleaseStep } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import quicker from '../../util/quicker.js'

const getNextStepInfo = (release) => {
    if (!release.step1.isCompleted) {
        return {
            nextStep: 'step1',
            nextStepTitle: 'Cover Art & Release Information',
            nextStepDescription: 'Upload cover art and provide release details like name, genre, and label information',
            canProceedToNextStep: false,
            requiredFields: ['coverArt.imageUrl', 'releaseInfo.releaseName', 'releaseInfo.genre']
        };
    }
    
    if (!release.step2.isCompleted) {
        return {
            nextStep: 'step2',
            nextStepTitle: 'Audio Files & Track Information',
            nextStepDescription: 'Upload audio files and provide track details like composer, lyricist, and singer information',
            canProceedToNextStep: true,
            requiredFields: ['tracks[].trackName', 'tracks[].genre', 'tracks[].audioFiles[]']
        };
    }
    
    if (!release.step3.isCompleted) {
        return {
            nextStep: 'step3',
            nextStepTitle: 'Release Settings',
            nextStepDescription: 'Set release date, select territories, distribution partners, and provide copyright information',
            canProceedToNextStep: true,
            requiredFields: ['releaseDate', 'territorialRights', 'partnerSelection', 'copyrights']
        };
    }
    
    if (release.isReadyForSubmission && release.releaseStatus === EReleaseStatus.DRAFT) {
        return {
            nextStep: 'submit',
            nextStepTitle: 'Submit for Review',
            nextStepDescription: 'All steps completed! Submit your release for admin review and processing',
            canProceedToNextStep: true,
            requiredFields: []
        };
    }
    
    return {
        nextStep: null,
        nextStepTitle: 'Release Complete',
        nextStepDescription: 'Your release has been submitted and is being processed',
        canProceedToNextStep: false,
        requiredFields: []
    };
};

const getStepSummary = (release) => {
    return {
        step1: {
            title: 'Cover Art & Release Info',
            isCompleted: release.step1.isCompleted,
            completedAt: release.step1.completedAt,
            hasData: !!(release.step1.coverArt?.imageUrl && release.step1.releaseInfo?.releaseName)
        },
        step2: {
            title: 'Audio Files & Tracks',
            isCompleted: release.step2.isCompleted,
            completedAt: release.step2.completedAt,
            hasData: release.step2.tracks?.length > 0,
            trackCount: release.step2.tracks?.length || 0
        },
        step3: {
            title: 'Release Settings',
            isCompleted: release.step3.isCompleted,
            completedAt: release.step3.completedAt,
            hasData: !!(release.step3.releaseDate && release.step3.territorialRights && release.step3.partnerSelection)
        }
    };
};

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Basic Release'));
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async createRelease(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { trackType } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('User')),
                    req,
                    404
                );
            }

            if (!user.hasActiveSubscription) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Active subscription required to create releases')),
                    req,
                    403
                );
            }

            const releaseId = await quicker.generateReleaseId('basic', trackType, BasicRelease);

            const release = new BasicRelease({
                userId,
                releaseId,
                trackType,
                releaseStatus: EReleaseStatus.DRAFT,
                currentStep: EReleaseStep.COVER_ART_AND_INFO
            });

            await release.save();

            const nextStepInfo = getNextStepInfo(release);
            const stepSummary = getStepSummary(release);

            return httpResponse(
                req,
                res,
                201,
                responseMessage.CREATED,
                {
                    releaseId: release.releaseId,
                    trackType: release.trackType,
                    currentStep: release.currentStep,
                    releaseStatus: release.releaseStatus,
                    completionPercentage: release.completionPercentage,
                    nextStep: nextStepInfo,
                    stepSummary: stepSummary,
                    message: 'Release created successfully! Start by uploading cover art and providing release information.'
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async updateStep1(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { releaseId } = req.params;
            const { coverArt, releaseInfo } = req.body;

            const release = await BasicRelease.findOne({ releaseId, userId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus !== EReleaseStatus.DRAFT) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only draft releases can be edited')),
                    req,
                    400
                );
            }

            if (coverArt) {
                release.step1.coverArt = {
                    imageUrl: coverArt.imageUrl,
                    imageSize: coverArt.imageSize,
                    imageFormat: coverArt.imageFormat
                };
            }

            if (releaseInfo) {
                release.step1.releaseInfo = {
                    releaseName: releaseInfo.releaseName,
                    genre: releaseInfo.genre,
                    labelName: releaseInfo.labelName,
                    upc: releaseInfo.upc
                };
            }

            const isStepComplete = release.step1.coverArt.imageUrl && 
                                   release.step1.releaseInfo.releaseName &&
                                   release.step1.releaseInfo.genre;

            if (isStepComplete && !release.step1.isCompleted) {
                release.completeStep(1);
                release.currentStep = EReleaseStep.AUDIO_FILES_AND_TRACKS;
            }

            await release.save();

            const nextStepInfo = getNextStepInfo(release);
            const stepSummary = getStepSummary(release);

            return httpResponse(
                req,
                res,
                200,
                responseMessage.UPDATED,
                {
                    releaseId: release.releaseId,
                    currentStep: release.currentStep,
                    step1Completed: release.step1.isCompleted,
                    completionPercentage: release.completionPercentage,
                    nextStep: nextStepInfo,
                    stepSummary: stepSummary,
                    message: release.step1.isCompleted ? 
                        'Step 1 completed! Ready to proceed to step 2.' : 
                        'Step 1 updated. Please complete remaining required fields.'
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async updateStep2(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { releaseId } = req.params;
            const { tracks } = req.body;

            const release = await BasicRelease.findOne({ releaseId, userId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus !== EReleaseStatus.DRAFT) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only draft releases can be edited')),
                    req,
                    400
                );
            }

            if (!release.step1.isCompleted) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Please complete step 1 first')),
                    req,
                    400
                );
            }

            if (tracks && tracks.length > 0) {
                release.step2.tracks = tracks.map(track => ({
                    trackName: track.trackName,
                    genre: track.genre,
                    composerName: track.composerName,
                    lyricistName: track.lyricistName,
                    singerName: track.singerName,
                    producerName: track.producerName,
                    isrc: track.isrc,
                    audioFiles: track.audioFiles,
                    previewTiming: track.previewTiming || { startTime: 0, endTime: 30 },
                    callerTuneTiming: track.callerTuneTiming || { startTime: 0, endTime: 30 },
                    language: track.language
                }));
            }

            const hasValidTracks = release.step2.tracks.length > 0 && 
                                   release.step2.tracks.every(track => 
                                       track.trackName && track.genre && track.audioFiles.length > 0
                                   );

            if (hasValidTracks && !release.step2.isCompleted) {
                release.completeStep(2);
                release.currentStep = EReleaseStep.RELEASE_SETTINGS;
            }

            await release.save();

            const nextStepInfo = getNextStepInfo(release);
            const stepSummary = getStepSummary(release);

            return httpResponse(
                req,
                res,
                200,
                responseMessage.UPDATED,
                {
                    releaseId: release.releaseId,
                    currentStep: release.currentStep,
                    step2Completed: release.step2.isCompleted,
                    tracksCount: release.step2.tracks.length,
                    completionPercentage: release.completionPercentage,
                    nextStep: nextStepInfo,
                    stepSummary: stepSummary,
                    message: release.step2.isCompleted ? 
                        'Step 2 completed! Ready to proceed to step 3.' : 
                        'Step 2 updated. Please add valid tracks with audio files.'
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async updateStep3(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { releaseId } = req.params;
            const { releaseDate, territorialRights, partnerSelection, copyrights } = req.body;

            const release = await BasicRelease.findOne({ releaseId, userId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus !== EReleaseStatus.DRAFT) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only draft releases can be edited')),
                    req,
                    400
                );
            }

            if (!release.step1.isCompleted || !release.step2.isCompleted) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Please complete previous steps first')),
                    req,
                    400
                );
            }

            if (releaseDate) {
                release.step3.releaseDate = new Date(releaseDate);
            }

            if (territorialRights) {
                release.step3.territorialRights = {
                    hasRights: territorialRights.hasRights,
                    territories: territorialRights.territories || []
                };
            }

            if (partnerSelection) {
                release.step3.partnerSelection = {
                    hasPartners: partnerSelection.hasPartners,
                    partners: partnerSelection.partners || []
                };
            }

            if (copyrights) {
                release.step3.copyrights = {
                    ownsCopyright: copyrights.ownsCopyright,
                    copyrightDocuments: copyrights.copyrightDocuments || []
                };
            }

            const isStepComplete = release.step3.releaseDate && 
                                   release.step3.territorialRights.hasRights !== undefined &&
                                   release.step3.partnerSelection.hasPartners !== undefined &&
                                   release.step3.copyrights.ownsCopyright !== undefined;

            if (isStepComplete && !release.step3.isCompleted) {
                release.completeStep(3);
            }

            await release.save();

            const nextStepInfo = getNextStepInfo(release);
            const stepSummary = getStepSummary(release);

            return httpResponse(
                req,
                res,
                200,
                responseMessage.UPDATED,
                {
                    releaseId: release.releaseId,
                    currentStep: release.currentStep,
                    step3Completed: release.step3.isCompleted,
                    readyForSubmission: release.isReadyForSubmission,
                    completionPercentage: release.completionPercentage,
                    nextStep: nextStepInfo,
                    stepSummary: stepSummary,
                    message: release.step3.isCompleted ? 
                        'Step 3 completed! All steps done. Ready to submit for review.' : 
                        'Step 3 updated. Please complete remaining release settings.'
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async submitRelease(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { releaseId } = req.params;

            const user = await User.findById(userId);
            if (!user.hasActiveSubscription) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Active subscription required to submit releases')),
                    req,
                    403
                );
            }

            const release = await BasicRelease.findOne({ releaseId, userId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (!release.isReadyForSubmission) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('All steps must be completed before submission')),
                    req,
                    400
                );
            }

            if (release.releaseStatus !== EReleaseStatus.DRAFT) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only draft releases can be submitted')),
                    req,
                    400
                );
            }

            release.submitForReview();
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release submitted for review successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    submittedAt: release.submittedAt
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getMyReleases(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { page = 1, limit = 10, status } = req.query;

            const query = { userId, isActive: true };
            if (status) {
                query.releaseStatus = status;
            }

            let queryBuilder = BasicRelease.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            if (req.query.isExport !== 'true') {
                 queryBuilder = queryBuilder.select('releaseId step1.releaseInfo.releaseName step2.tracks trackType releaseStatus completedSteps totalSteps createdAt submittedAt');
            }

            const releases = await queryBuilder;

            const total = await BasicRelease.countDocuments(query);

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    releases: req.query.isExport === 'true' ? releases : releases.map(release => {
                        const nextStepInfo = getNextStepInfo(release);
                        return {
                            releaseId: release.releaseId,
                            releaseName: release.releaseTitle,
                            trackType: release.trackType,
                            trackCount: release.step2?.tracks?.length || 0,
                            releaseStatus: release.releaseStatus,
                            completionPercentage: release.completionPercentage,
                            currentStep: release.currentStep,
                            nextStep: {
                                step: nextStepInfo.nextStep,
                                title: nextStepInfo.nextStepTitle,
                                canProceed: nextStepInfo.canProceedToNextStep
                            },
                            stepsCompleted: `${release.completedSteps}/${release.totalSteps}`,
                            isReadyForSubmission: release.isReadyForSubmission,
                            createdAt: release.createdAt,
                            submittedAt: release.submittedAt
                        };
                    }),
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
            const userId = req.authenticatedUser._id;
            const { releaseId } = req.params;

            const release = await BasicRelease.findOne({ releaseId, userId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            const nextStepInfo = getNextStepInfo(release);
            const stepSummary = getStepSummary(release);

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
                    isReadyForSubmission: release.isReadyForSubmission,
                    nextStep: nextStepInfo,
                    stepSummary: stepSummary,
                    step1: release.step1,
                    step2: release.step2,
                    step3: release.step3,
                    createdAt: release.createdAt,
                    updatedAt: release.updatedAt,
                    submittedAt: release.submittedAt
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async deleteRelease(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { releaseId } = req.params;

            const release = await BasicRelease.findOne({ releaseId, userId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (release.releaseStatus === EReleaseStatus.LIVE) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Live releases cannot be deleted')),
                    req,
                    400
                );
            }

            release.isActive = false;
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.DELETED,
                {
                    releaseId: release.releaseId
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async requestUpdate(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { releaseId } = req.params;
            const { reason, changes } = req.body;

            const release = await BasicRelease.findOne({ releaseId, userId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (![EReleaseStatus.LIVE, EReleaseStatus.PUBLISHED].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only live or published releases can request updates')),
                    req,
                    400
                );
            }

            release.requestUpdate(reason, changes);
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Update request submitted successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    updateRequest: release.updateRequest
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async requestTakeDown(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { releaseId } = req.params;
            const { reason } = req.body;

            const release = await BasicRelease.findOne({ releaseId, userId, isActive: true });
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                );
            }

            if (![EReleaseStatus.LIVE, EReleaseStatus.PUBLISHED].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only live or published releases can be taken down')),
                    req,
                    400
                );
            }

            release.requestTakeDown(reason);
            await release.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Take down request submitted successfully'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    takeDown: release.takeDown
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    }
};