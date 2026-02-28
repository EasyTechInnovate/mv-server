import AdvancedRelease from '../../model/advanced-release.model.js'
import User from '../../model/user.model.js'
import Sublabel from '../../model/sublabel.model.js'
import { EReleaseStatus, EAdvancedReleaseStep, EAdvancedReleaseType } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import quicker from '../../util/quicker.js'
import { getUserDefaultSublabel, getUserActiveSublabels } from '../../util/sublabelHelper.js'

const getNextStepInfo = (release) => {
    if (!release.step1.isCompleted) {
        return {
            nextStep: 'step1',
            nextStepTitle: 'Cover Art & Release Information',
            nextStepDescription: 'Upload cover art and provide comprehensive release details including artists, genres, and pricing',
            canProceedToNextStep: false,
            requiredFields: ['coverArt.imageUrl', 'releaseInfo.releaseName', 'releaseInfo.releaseType', 'releaseInfo.primaryArtists', 'releaseInfo.primaryGenre', 'releaseInfo.labelName']
        }
    }
    
    if (!release.step2.isCompleted) {
        return {
            nextStep: 'step2',
            nextStepTitle: 'Tracks & Audio Files',
            nextStepDescription: 'Upload audio tracks with detailed metadata and contributor information',
            canProceedToNextStep: true,
            requiredFields: ['tracks']
        }
    }
    
    if (!release.step3.isCompleted) {
        return {
            nextStep: 'step3',
            nextStepTitle: 'Delivery & Rights Management',
            nextStepDescription: 'Configure delivery dates, territorial rights, and copyright information',
            canProceedToNextStep: true,
            requiredFields: ['deliveryDetails', 'territorialRights', 'distributionPartners']
        }
    }
    
    if (release.isReadyForSubmission && release.releaseStatus === EReleaseStatus.DRAFT) {
        return {
            nextStep: 'submit',
            nextStepTitle: 'Submit for Review',
            nextStepDescription: 'All steps completed! Submit your advanced release for admin review and processing',
            canProceedToNextStep: true,
            requiredFields: []
        }
    }
    
    return {
        nextStep: null,
        nextStepTitle: 'Release Complete',
        nextStepDescription: 'Your advanced release has been submitted and is being processed',
        canProceedToNextStep: false,
        requiredFields: []
    }
}

const getStepSummary = (release) => {
    return {
        step1: {
            title: 'Cover Art & Release Info',
            isCompleted: release.step1.isCompleted,
            completedAt: release.step1.completedAt,
            hasData: !!(release.step1.coverArt?.imageUrl || release.step1.releaseInfo?.releaseName)
        },
        step2: {
            title: 'Tracks & Audio Files',
            isCompleted: release.step2.isCompleted,
            completedAt: release.step2.completedAt,
            hasData: !!(release.step2.tracks && release.step2.tracks.length > 0),
            trackCount: release.trackCount
        },
        step3: {
            title: 'Delivery & Rights',
            isCompleted: release.step3.isCompleted,
            completedAt: release.step3.completedAt,
            hasData: !!(release.step3.deliveryDetails || release.step3.territorialRights || release.step3.distributionPartners?.length > 0)
        }
    }
}

export default {
    async self(req, res, next) {
        try {
            return httpResponse(req, res, 200, responseMessage.SERVICE('Advanced Release'))
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async createRelease(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseType } = req.body
            
            const user = await User.findById(userId)
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('User')),
                    req,
                    404
                )
            }

            const releaseId = await quicker.generateReleaseId('advance',releaseType, AdvancedRelease)
            
            const release = new AdvancedRelease({
                releaseId,
                userId,
                accountId: user.accountId,
                releaseType,
                releaseStatus: EReleaseStatus.DRAFT,
                currentStep: EAdvancedReleaseStep.COVER_ART_AND_RELEASE_INFO
            })
            await release.save()

            const nextStepInfo = getNextStepInfo(release)
            const stepSummary = getStepSummary(release)

            return httpResponse(
                req,
                res,
                201,
                responseMessage.CREATED,
                {
                    releaseId: release.releaseId,
                    releaseType: release.releaseType,
                    currentStep: release.currentStep,
                    releaseStatus: release.releaseStatus,
                    completionPercentage: release.completionPercentage,
                    nextStep: nextStepInfo,
                    stepSummary,
                    message: 'Advanced release created successfully! Start with uploading cover art and release information.'
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async updateStep1(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseId } = req.params
            const { coverArt, releaseInfo } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, userId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (![EReleaseStatus.DRAFT, EReleaseStatus.REJECTED].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only draft or rejected releases can be edited')),
                    req,
                    400
                )
            }

            if (coverArt) {
                release.step1.coverArt = {
                    imageUrl: coverArt.imageUrl,
                    imageSize: coverArt.imageSize || null,
                    imageFormat: coverArt.imageFormat || null
                }
            }

            if (releaseInfo) {
                // Handle labelName - if not provided or is a string, use user's default sublabel
                let labelNameId = releaseInfo.labelName

                if (!labelNameId || typeof labelNameId === 'string') {
                    // Try to get user's default sublabel
                    const defaultSublabel = await getUserDefaultSublabel(userId)

                    if (defaultSublabel) {
                        labelNameId = defaultSublabel.id
                    } else {
                        // Fallback to the global default sublabel
                        const maheshwariSublabel = await Sublabel.findOne({ name: 'Maheshwari Visual', isActive: true })
                        if (maheshwariSublabel) {
                            labelNameId = maheshwariSublabel._id
                        }
                    }
                }

                release.step1.releaseInfo = {
                    releaseName: releaseInfo.releaseName,
                    releaseVersion: releaseInfo.releaseVersion,
                    catalog: releaseInfo.catalog,
                    releaseType: releaseInfo.releaseType,
                    primaryArtists: releaseInfo.primaryArtists,
                    variousArtists: releaseInfo.variousArtists,
                    featuringArtists: releaseInfo.featuringArtists,
                    needsUPC: releaseInfo.needsUPC,
                    upcCode: releaseInfo.upcCode,
                    primaryGenre: releaseInfo.primaryGenre,
                    secondaryGenre: releaseInfo.secondaryGenre,
                    labelName: labelNameId,
                    cLine: releaseInfo.cLine,
                    pLine: releaseInfo.pLine,
                    releasePricingTier: releaseInfo.releasePricingTier
                }
            }

            const isStepComplete = release.step1.coverArt.imageUrl && 
                                   release.step1.releaseInfo.releaseName &&
                                   release.step1.releaseInfo.releaseType &&
                                   release.step1.releaseInfo.primaryArtists?.length > 0 &&
                                   release.step1.releaseInfo.primaryGenre &&
                                   release.step1.releaseInfo.labelName

            if (isStepComplete && !release.step1.isCompleted) {
                release.completeStep(1)
            }

            await release.save()

            const nextStepInfo = getNextStepInfo(release)
            const stepSummary = getStepSummary(release)

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
                    stepSummary,
                    message: release.step1.isCompleted ? 'Step 1 completed! Proceed to upload tracks and audio files.' : 'Step 1 updated. Please complete all required fields.'
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async updateStep2(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseId } = req.params
            const { tracks } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, userId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (![EReleaseStatus.DRAFT, EReleaseStatus.REJECTED].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only draft or rejected releases can be edited')),
                    req,
                    400
                )
            }

            if (!release.step1.isCompleted) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Please complete Step 1 before proceeding to Step 2')),
                    req,
                    400
                )
            }

            // Validate track count based on release type
            const isSingleTrack = [EAdvancedReleaseType.SINGLE, EAdvancedReleaseType.RINGTONE_RELEASE].includes(release.releaseType)
            if (isSingleTrack && tracks.length > 1) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Single and Ringtone releases can only have one track')),
                    req,
                    400
                )
            }

            if (tracks && tracks.length > 0) {
                release.step2.tracks = tracks
            }

            const isStepComplete = release.step2.tracks && release.step2.tracks.length > 0 &&
                                   release.step2.tracks.every(track => 
                                       track.trackName && 
                                       track.primaryArtists?.length > 0 && track.primaryGenre)

            if (isStepComplete && !release.step2.isCompleted) {
                release.completeStep(2)
            }

            await release.save()

            const nextStepInfo = getNextStepInfo(release)
            const stepSummary = getStepSummary(release)

            return httpResponse(
                req,
                res,
                200,
                responseMessage.UPDATED,
                {
                    releaseId: release.releaseId,
                    currentStep: release.currentStep,
                    step2Completed: release.step2.isCompleted,
                    trackCount: release.trackCount,
                    completionPercentage: release.completionPercentage,
                    nextStep: nextStepInfo,
                    stepSummary,
                    message: release.step2.isCompleted ? 'Step 2 completed! Proceed to delivery and rights configuration.' : 'Step 2 updated. Please complete all track information.'
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async updateStep3(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseId } = req.params
            const { deliveryDetails, territorialRights, distributionPartners, copyrightOptions } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, userId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (![EReleaseStatus.DRAFT, EReleaseStatus.REJECTED].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only draft or rejected releases can be edited')),
                    req,
                    400
                )
            }

            if (!release.step1.isCompleted || !release.step2.isCompleted) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Please complete Steps 1 and 2 before proceeding to Step 3')),
                    req,
                    400
                )
            }

            if (deliveryDetails) {
                release.step3.deliveryDetails = {
                    releaseDate: deliveryDetails.releaseDate ? new Date(deliveryDetails.releaseDate) : null
                }
            }

            if (territorialRights) {
                release.step3.territorialRights = territorialRights
            }

            if (distributionPartners) {
                release.step3.distributionPartners = distributionPartners
            }

            if (copyrightOptions) {
                release.step3.copyrightOptions = copyrightOptions
            }

            const isStepComplete = release.step3.territorialRights && 
                                   release.step3.distributionPartners?.length > 0

            if (isStepComplete && !release.step3.isCompleted) {
                release.completeStep(3)
            }

            await release.save()

            const nextStepInfo = getNextStepInfo(release)
            const stepSummary = getStepSummary(release)

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
                    stepSummary,
                    message: release.step3.isCompleted ? 'Step 3 completed! All steps done. Ready to submit for review.' : 'Step 3 updated. Please complete all required fields.'
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async submitRelease(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseId } = req.params

            const release = await AdvancedRelease.findOne({ releaseId, userId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (!release.isReadyForSubmission) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Please complete all steps before submitting')),
                    req,
                    400
                )
            }

            if (![EReleaseStatus.DRAFT, EReleaseStatus.REJECTED].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only draft or rejected releases can be submitted')),
                    req,
                    409
                )
            }

            release.submitForReview()
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Release submitted successfully for admin review'),
                {
                    releaseId: release.releaseId,
                    releaseStatus: release.releaseStatus,
                    submittedAt: release.submittedAt,
                    completionPercentage: release.completionPercentage,
                    message: 'Your advanced release has been submitted for review. You will be notified once it is processed.'
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getMyReleases(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { page = 1, limit = 10, status, releaseType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

            const filter = { userId, isActive: true }
            if (status) filter.releaseStatus = status
            if (releaseType) filter.releaseType = releaseType

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
                    .populate('step1.releaseInfo.labelName', 'name')
                    .lean(),
                AdvancedRelease.countDocuments(filter)
            ])

            const releasesWithNextStep = releases.map(release => {
                const trackCount = release.step2?.tracks?.length || 0
                const releaseWithTrackCount = { ...release, trackCount }
                const nextStepInfo = getNextStepInfo(releaseWithTrackCount)
                const stepSummary = getStepSummary(releaseWithTrackCount)

                return {
                    ...release,
                    trackCount,
                    completionPercentage: Math.round((release.completedSteps / release.totalSteps) * 100),
                    nextStep: nextStepInfo,
                    stepSummary
                }
            })

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    releases: releasesWithNextStep,
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

    async getReleaseById(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseId } = req.params

            const release = await AdvancedRelease.findOne({ releaseId, userId, isActive: true })
                .populate('step1.releaseInfo.labelName', 'name')
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

            const nextStepInfo = getNextStepInfo(release)
            const stepSummary = getStepSummary(release)

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    ...release.toObject(),
                    completionPercentage: release.completionPercentage,
                    nextStep: nextStepInfo,
                    stepSummary
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async deleteRelease(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseId } = req.params

            const release = await AdvancedRelease.findOne({ releaseId, userId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (release.releaseStatus === EReleaseStatus.LIVE) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Live releases cannot be deleted')),
                    req,
                    400
                )
            }

            release.isActive = false
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.DELETED
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async requestUpdate(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseId } = req.params
            const { reason, changes } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, userId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (![EReleaseStatus.LIVE, EReleaseStatus.PUBLISHED].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only live or published releases can request updates')),
                    req,
                    400
                )
            }

            release.requestUpdate(reason, changes)
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Update request submitted successfully'),
                {
                    releaseId: release.releaseId,
                    updateRequest: release.updateRequest
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async requestTakedown(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { releaseId } = req.params
            const { reason } = req.body

            const release = await AdvancedRelease.findOne({ releaseId, userId, isActive: true })
            if (!release) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Release')),
                    req,
                    404
                )
            }

            if (![EReleaseStatus.LIVE, EReleaseStatus.PUBLISHED].includes(release.releaseStatus)) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Only live or published releases can be taken down')),
                    req,
                    400
                )
            }

            release.requestTakedown(reason)
            await release.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Takedown request submitted successfully'),
                {
                    releaseId: release.releaseId,
                    takeDown: release.takeDown
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getUserSublabels(req, res, next) {
        try {
            const userId = req.authenticatedUser._id

            const sublabels = await getUserActiveSublabels(userId)

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    sublabels
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}