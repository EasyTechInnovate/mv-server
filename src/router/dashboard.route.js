import { Router } from 'express'
import dashboardController from '../controller/dashboard.controller.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import moduleAuthorization from '../middleware/moduleAuthorization.js'
import { EUserRole } from '../constant/application.js'

const router = Router()

router.route('/user')
    .get(
        authentication,
        authorization([EUserRole.USER]),
        dashboardController.userDashboard
    )

router.route('/admin')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        dashboardController.adminDashboard
    )

export default router
