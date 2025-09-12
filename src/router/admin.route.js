import { Router } from 'express'
import adminController from '../controller/Admin/admin.controller.js'
import adminReleasesController from '../controller/Admin/admin-releases.controller.js'
import adminSublabelsController from '../controller/Admin/admin-sublabels.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import adminSchemas from '../schema/admin.schema.js'
import aggregatorSchemas from '../schema/aggregator.schema.js'
import releaseSchemas from '../schema/release.schema.js'
import sublabelSchemas from '../schema/sublabel.schema.js'
import { EUserRole } from '../constant/application.js'

const router = Router()

router.route('/self').get(adminController.self)

router.route('/plans')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.getAllPlans
    )
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(adminSchemas.createPlan),
        adminController.createPlan
    )

router.route('/plans/:planId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.getPlanById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(adminSchemas.updatePlan),
        adminController.updatePlan
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.deletePlan
    )

router.route('/plans/:planId/activate')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.activatePlan
    )

router.route('/plans/:planId/deactivate')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.deactivatePlan
    )

router.route('/revenue/summary')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.getRevenueSummary
    )

router.route('/users/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.getUserStats
    )

router.route('/subscriptions/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.getSubscriptionStats
    )

router.route('/aggregator/applications')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.getAllAggregatorApplications
    )

router.route('/aggregator/applications/:applicationId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminController.getAggregatorApplication
    )

router.route('/aggregator/applications/:applicationId/review')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(aggregatorSchemas.reviewApplication),
        adminController.reviewAggregatorApplication
    )

router.route('/aggregator/applications/:applicationId/create-account')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(aggregatorSchemas.createAggregatorAccount),
        adminController.createAggregatorAccount
    )

router.route('/releases/self').get(adminReleasesController.self)

router.route('/releases')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.getReleases),
        adminReleasesController.getAllReleases
    )

router.route('/releases/pending-reviews')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.getReleases),
        adminReleasesController.getPendingReviews
    )

router.route('/releases/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminReleasesController.getReleaseStats
    )

router.route('/releases/:releaseId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.getReleaseDetails
    )

router.route('/releases/:releaseId/approve')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.releaseIdParam),
        validateRequest(releaseSchemas.adminNotes),
        adminReleasesController.approveForReview
    )

router.route('/releases/:releaseId/start-processing')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.startProcessing
    )

router.route('/releases/:releaseId/publish')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.publishRelease
    )

router.route('/releases/:releaseId/go-live')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.goLive
    )

router.route('/releases/:releaseId/reject')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.releaseIdParam),
        validateRequest(releaseSchemas.rejectRelease),
        adminReleasesController.rejectRelease
    )

router.route('/releases/:releaseId/process-takedown')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.processTakeDown
    )

router.route('/sublabels')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.createSublabel),
        adminSublabelsController.createSublabel
    )
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.getSublabels),
        adminSublabelsController.getSublabels
    )

router.route('/sublabels/:id')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.getSublabel),
        adminSublabelsController.getSublabel
    )
    .patch(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.updateSublabel),
        adminSublabelsController.updateSublabel
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.deleteSublabel),
        adminSublabelsController.deleteSublabel
    )

router.route('/sublabels/:id/assign-user')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.assignSublabelToUser),
        adminSublabelsController.assignSublabelToUser
    )

router.route('/sublabels/:id/remove-user')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.removeSublabelFromUser),
        adminSublabelsController.removeSublabelFromUser
    )

router.route('/users/:userId/sublabels')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.getUserSublabels),
        adminSublabelsController.getUserSublabels
    )
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(sublabelSchemas.toggleUserSublabels),
        adminSublabelsController.toggleUserSublabels
    )

export default router