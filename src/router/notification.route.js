import { Router } from 'express'
import notificationController from '../controller/notification.controller.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import { EUserRole } from '../constant/application.js'

const router = Router()

router.route('/count')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        notificationController.getUnreadCount
    )

router.route('/read-all')
    .patch(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        notificationController.markAllAsRead
    )

router.route('/:notificationId/read')
    .patch(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        notificationController.markAsRead
    )

router.route('/')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        notificationController.getMyNotifications
    )

export default router
