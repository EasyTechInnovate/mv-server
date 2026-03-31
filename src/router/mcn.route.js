import { Router } from 'express'
import userMCNController from '../controller/MCN/user-mcn.controller.js'
import adminMCNController from '../controller/MCN/admin-mcn.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import mcnSchemas from '../schema/mcn.schema.js'
import { EUserRole } from '../constant/application.js'

const router = Router()

router.route('/self')
    .get(
        authentication,
        userMCNController.self
    )

router.route('/request')
    .post(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(mcnSchemas.createMCNRequestSchema),
        userMCNController.submitMCNRequest
    )

router.route('/my-requests')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(mcnSchemas.getMCNRequestsSchema),
        userMCNController.getMyRequests
    )

router.route('/my-requests/:requestId')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(mcnSchemas.mcnRequestParamsSchema),
        userMCNController.getRequestById
    )

router.route('/my-channels')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(mcnSchemas.getMCNChannelsSchema),
        userMCNController.getMyChannels
    )

router.route('/my-channels/:channelId')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(mcnSchemas.mcnChannelParamsSchema),
        userMCNController.getChannelById
    )

router.route('/my-requests/:requestId/request-removal')
    .post(
        authentication,
        authorization([EUserRole.USER]),
        validateRequest(mcnSchemas.requestRemovalSchema),
        userMCNController.requestRemoval
    )

router.route('/my-stats')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        userMCNController.getMyStats
    )

router.route('/admin/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminMCNController.self
    )

router.route('/admin/requests')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.getMCNRequestsSchema),
        adminMCNController.getAllRequests
    )

router.route('/admin/requests/pending')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.getMCNRequestsSchema),
        adminMCNController.getPendingRequests
    )

router.route('/admin/requests/:requestId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.mcnRequestParamsSchema),
        adminMCNController.getRequestById
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(mcnSchemas.mcnRequestParamsSchema),
        adminMCNController.deleteRequest
    )

router.route('/admin/requests/bulk-delete')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(mcnSchemas.bulkDeleteMCNRequestsSchema),
        adminMCNController.bulkDeleteRequests
    )

router.route('/admin/requests/:requestId/review')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.reviewMCNRequestSchema),
        adminMCNController.reviewRequest
    )

router.route('/admin/requests/:requestId/create-channel')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.createMCNChannelSchema),
        adminMCNController.createMCNChannel
    )

router.route('/admin/requests/:requestId/process-removal')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.mcnRequestParamsSchema),
        adminMCNController.processRemovalRequest
    )

router.route('/admin/channels')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.getMCNChannelsSchema),
        adminMCNController.getAllChannels
    )

router.route('/admin/channels/:channelId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.mcnChannelParamsSchema),
        adminMCNController.getChannelById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.updateMCNChannelSchema),
        adminMCNController.updateChannel
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(mcnSchemas.mcnChannelParamsSchema),
        adminMCNController.deleteChannel
    )

router.route('/admin/channels/:channelId/status')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        validateRequest(mcnSchemas.updateChannelStatusSchema),
        adminMCNController.updateChannelStatus
    )

router.route('/admin/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminMCNController.getStats
    )

export default router