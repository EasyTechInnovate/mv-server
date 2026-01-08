import { Router } from 'express'
import userMarketingController from '../controller/Marketing/user-marketing.controller.js'
import adminMarketingController from '../controller/Marketing/admin-marketing.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import marketingSchemas from '../schema/marketing.schema.js'
import { EUserRole } from '../constant/application.js'

const router = Router()

router.route('/self')
    .get(
        authentication,
        userMarketingController.self
    )

router.route('/sync/submit')
    .post(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(marketingSchemas.createSyncSubmissionSchema),
        userMarketingController.submitSyncRequest
    )

router.route('/playlist-pitching/submit')
    .post(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(marketingSchemas.createPlaylistPitchingSchema),
        userMarketingController.submitPlaylistPitchingRequest
    )

router.route('/sync/my-submissions')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(marketingSchemas.getMarketingSubmissionsSchema),
        userMarketingController.getMySyncSubmissions
    )

router.route('/playlist-pitching/my-submissions')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(marketingSchemas.getMarketingSubmissionsSchema),
        userMarketingController.getMyPlaylistPitchingSubmissions
    )

router.route('/sync/my-submissions/:submissionId')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(marketingSchemas.marketingSubmissionParamsSchema),
        userMarketingController.getSyncSubmissionById
    )

router.route('/playlist-pitching/my-submissions/:submissionId')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(marketingSchemas.marketingSubmissionParamsSchema),
        userMarketingController.getPlaylistPitchingSubmissionById
    )

router.route('/my-stats')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(marketingSchemas.marketingStatsSchema),
        userMarketingController.getMyMarketingStats
    )

router.route('/admin/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminMarketingController.self
    )

router.route('/admin/sync/submissions')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.getMarketingSubmissionsSchema),
        adminMarketingController.getAllSyncSubmissions
    )

router.route('/admin/playlist-pitching/submissions')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.getMarketingSubmissionsSchema),
        adminMarketingController.getAllPlaylistPitchingSubmissions
    )

router.route('/admin/sync/submissions/pending')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.getMarketingSubmissionsSchema),
        adminMarketingController.getPendingSyncSubmissions
    )

router.route('/admin/playlist-pitching/submissions/pending')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.getMarketingSubmissionsSchema),
        adminMarketingController.getPendingPlaylistPitchingSubmissions
    )

router.route('/admin/sync/submissions/:submissionId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.marketingSubmissionParamsSchema),
        adminMarketingController.getSyncSubmissionById
    )

router.route('/admin/playlist-pitching/submissions/:submissionId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.marketingSubmissionParamsSchema),
        adminMarketingController.getPlaylistPitchingSubmissionById
    )

router.route('/admin/sync/submissions/:submissionId/review')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.reviewMarketingSubmissionSchema),
        adminMarketingController.reviewSyncSubmission
    )

router.route('/admin/playlist-pitching/submissions/:submissionId/review')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.reviewMarketingSubmissionSchema),
        adminMarketingController.reviewPlaylistPitchingSubmission
    )

router.route('/admin/playlist-pitching/submissions/store/:store')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.getPlaylistPitchingByStoreSchema),
        adminMarketingController.getPlaylistPitchingByStore
    )

router.route('/admin/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.marketingStatsSchema),
        adminMarketingController.getMarketingStats
    )

router.route('/admin/playlist-pitching/submissions/:submissionId')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.marketingSubmissionParamsSchema),
        adminMarketingController.updatePlaylistPitchingSubmission
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.marketingSubmissionParamsSchema),
        adminMarketingController.deletePlaylistPitchingSubmission
    )

router.route('/admin/sync/submissions/:submissionId')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.marketingSubmissionParamsSchema),
        adminMarketingController.updateSyncSubmission
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(marketingSchemas.marketingSubmissionParamsSchema),
        adminMarketingController.deleteSyncSubmission
    )

export default router