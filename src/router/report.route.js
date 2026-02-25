import { Router } from 'express'
import userReportController from '../controller/Reports/user-report.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import reportSchemas from '../schema/report.schema.js'
import { getAnalyticsDashboardSchema } from '../schema/analytics.schema.js'
import royaltySchemas from '../schema/royalty.schema.js'
import { EUserRole } from '../constant/application.js'

const router = Router()

router.route('/available')
    .get(
        authentication,
        validateRequest(reportSchemas.getAvailableReportsSchema),
        userReportController.getAvailableReports
    )

router.route('/type/:reportType')
    .get(
        authentication,
        validateRequest(reportSchemas.getReportsByTypeSchema),
        userReportController.getReportsByType
    )

router.route('/month/:monthId')
    .get(
        authentication,
        validateRequest(reportSchemas.getReportsByMonthSchema),
        userReportController.getReportsByMonth
    )

router.route('/:id/summary')
    .get(
        authentication,
        validateRequest(reportSchemas.reportParamsSchema),
        userReportController.getReportSummary
    )

router.route('/:id/data')
    .get(
        authentication,
        validateRequest(reportSchemas.getReportDataSchema),
        userReportController.getReportData
    )

router.route('/:id/search')
    .get(
        authentication,
        validateRequest(reportSchemas.searchReportDataSchema),
        userReportController.searchReportData
    )

// Analytics dashboard - comprehensive data in one endpoint
router.route('/analytics/dashboard')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        validateRequest(getAnalyticsDashboardSchema),
        userReportController.getAnalyticsDashboard
    )

router.route('/analytics/export')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        userReportController.exportUserAnalytics
    )

router.route('/export')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        userReportController.exportUserRoyalty
    )

// Royalty Management Routes

// Royalty dashboard - comprehensive data in one endpoint (following analytics pattern)
router.route('/royalty/dashboard')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        validateRequest(royaltySchemas.royaltyDashboardQuery),
        userReportController.getRoyaltyDashboard
    )

// MCN dashboard - comprehensive MCN royalty data in one endpoint
router.route('/mcn/dashboard')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        validateRequest(royaltySchemas.royaltyDashboardQuery),
        userReportController.getMCNDashboard
    )

export default router