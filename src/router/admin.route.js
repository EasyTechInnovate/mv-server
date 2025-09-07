import { Router } from 'express'
import adminController from '../controller/Admin/admin.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import adminSchemas from '../schema/admin.schema.js'
import aggregatorSchemas from '../schema/aggregator.schema.js'
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

export default router