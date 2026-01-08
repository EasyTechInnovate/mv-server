import express from 'express'
import payoutRequestController from '../controller/payout-request.controller.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import { EUserRole } from '../constant/application.js'

const router = express.Router()

router.route('/create')
    .post(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        payoutRequestController.createPayoutRequest
    )

router.route('/my-requests')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        payoutRequestController.getMyPayoutRequests
    )

router.route('/:requestId')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        payoutRequestController.getPayoutRequestById
    )

router.route('/:requestId/cancel')
    .patch(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        payoutRequestController.cancelPayoutRequest
    )

export default router
