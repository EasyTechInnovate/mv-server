import { Router } from 'express'
import adminController from '../controller/Admin/admin.controller.js'
import adminReleasesController from '../controller/Admin/admin-releases.controller.js'
import adminAdvanceReleaseController from '../controller/Admin/admin-advance-release.controller.js'
import adminSublabelsController from '../controller/Admin/admin-sublabels.controller.js'
import adminMonthManagementController from '../controller/Months/admin-month-management.controller.js'
import adminReportController from '../controller/Reports/admin-report.controller.js'
import adminFAQController from '../controller/FAQ/admin-faq.controller.js'
import adminTestimonialController from '../controller/Testimonial/admin-testimonial.controller.js'
import adminTrendingLabelController from '../controller/TrendingLabel/admin-trending-label.controller.js'
import adminAnalyticsController from '../controller/Admin/admin-analytics.controller.js'
import adminCompanySettingsController from '../controller/CompanySettings/admin-company-settings.controller.js'
import adminTeamMemberController from '../controller/TeamMember/admin-team-member.controller.js'
import adminSupportTicketController from '../controller/SupportTicket/admin-support-ticket.controller.js'
import adminPayoutController from '../controller/Admin/admin-payout.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import moduleAuthorization from '../middleware/moduleAuthorization.js'
import adminSchemas from '../schema/admin.schema.js'
import aggregatorSchemas from '../schema/aggregator.schema.js'
import releaseSchemas from '../schema/release.schema.js'
import advancedReleaseSchemas from '../schema/advanced-release.schema.js'
import sublabelSchemas from '../schema/sublabel.schema.js'
import { EUserRole } from '../constant/application.js'
import monthManagementSchemas from '../schema/month-management.schema.js'
import reportSchemas from '../schema/report.schema.js'
import faqSchemas from '../schema/faq.schema.js'
import testimonialSchemas from '../schema/testimonial.schema.js'
import trendingLabelSchemas from '../schema/trending-label.schema.js'
import companySettingsSchemas from '../schema/company-settings.schema.js'
import teamMemberSchemas from '../schema/team-member.schema.js'
import {
    getTicketsSchema,
    getTicketByIdSchema,
    updateTicketSchema,
    addResponseSchema,
    addInternalNoteSchema,
    assignTicketSchema,
    updateTicketStatusSchema,
    updateTicketPrioritySchema,
    escalateTicketSchema,
    getTicketStatsSchema,
    bulkUpdateTicketsSchema
} from '../schema/support-ticket.schema.js'
import { uploadFiles } from '../middleware/multerHandler.js'

const router = Router()

router.route('/self').get(adminController.self)

router.route('/plans')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        adminController.getAllPlans
    )
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(adminSchemas.createPlan),
        adminController.createPlan
    )

router.route('/plans/:planId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        adminController.getPlanById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(adminSchemas.updatePlan),
        adminController.updatePlan
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        adminController.deletePlan
    )

router.route('/plans/:planId/activate')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        adminController.activatePlan
    )

router.route('/plans/:planId/deactivate')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        adminController.deactivatePlan
    )

router.route('/revenue/summary')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        adminController.getRevenueSummary
    )

router.route('/users/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminController.getUserStats
    )

router.route('/subscriptions/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminController.getSubscriptionStats
    )

router.route('/aggregator/applications')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('MCN Management'),
        adminController.getAllAggregatorApplications
    )

router.route('/aggregator/applications/:applicationId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('MCN Management'),
        adminController.getAggregatorApplication
    )

router.route('/aggregator/applications/:applicationId/review')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('MCN Management'),
        validateRequest(aggregatorSchemas.reviewApplication),
        adminController.reviewAggregatorApplication
    )

router.route('/aggregator/applications/:applicationId/create-account')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('MCN Management'),
        validateRequest(aggregatorSchemas.createAggregatorAccount),
        adminController.createAggregatorAccount
    )

router.route('/releases/self').get(adminReleasesController.self)

router.route('/releases')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
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
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.publishRelease
    )

router.route('/releases/:releaseId/go-live')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.goLive
    )

router.route('/releases/:releaseId/reject')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(releaseSchemas.releaseIdParam),
        validateRequest(releaseSchemas.rejectRelease),
        adminReleasesController.rejectRelease
    )

router.route('/releases/:releaseId/process-takedown')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.processTakeDown
    )

router.route('/releases/:releaseId/audio-footprinting')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.saveAudioFootprinting
    )

router.route('/releases/edit-requests')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        adminReleasesController.getEditRequests
    )

router.route('/releases/:releaseId/approve-edit')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.approveEditRequest
    )

router.route('/releases/:releaseId/reject-edit')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.rejectEditRequest
    )

router.route('/releases/:releaseId/edit')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(releaseSchemas.releaseIdParam),
        adminReleasesController.editRelease
    )

router.route('/advanced-releases')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.adminGetReleases, 'query'),
        adminAdvanceReleaseController.getAllReleases
    )

router.route('/advanced-releases/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        adminAdvanceReleaseController.self
    )

router.route('/advanced-releases/pending-reviews')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        adminAdvanceReleaseController.getPendingReviews
    )

router.route('/advanced-releases/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminAdvanceReleaseController.getReleaseStats
    )

router.route('/advanced-releases/:releaseId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.getReleaseById
    )

router.route('/advanced-releases/:releaseId/approve')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        validateRequest(advancedReleaseSchemas.adminNotes),
        adminAdvanceReleaseController.approveForReview
    )

router.route('/advanced-releases/:releaseId/start-processing')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.startProcessing
    )

router.route('/advanced-releases/:releaseId/publish')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.publishRelease
    )

router.route('/advanced-releases/:releaseId/go-live')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.goLive
    )

router.route('/advanced-releases/:releaseId/reject')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.rejectRelease),
        adminAdvanceReleaseController.rejectRelease
    )

router.route('/advanced-releases/:releaseId/process-takedown')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.processTakeDown
    )

router.route('/advanced-releases/:releaseId/provide-upc')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.provideUPC),
        adminAdvanceReleaseController.provideUPC
    )

router.route('/advanced-releases/:releaseId/provide-isrc')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.provideISRC),
        adminAdvanceReleaseController.provideISRC
    )

router.route('/advanced-releases/:releaseId/audio-footprinting')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.saveAudioFootprinting
    )

router.route('/advanced-releases/edit-requests')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        adminAdvanceReleaseController.getEditRequests
    )

router.route('/advanced-releases/:releaseId/approve-edit')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.approveEditRequest
    )

router.route('/advanced-releases/:releaseId/reject-edit')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.rejectEditRequest
    )
 
 router.route('/advanced-releases/:releaseId/edit')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Release Management'),
        validateRequest(advancedReleaseSchemas.getReleaseById),
        adminAdvanceReleaseController.editRelease
    )

router.route('/sublabels')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(sublabelSchemas.createSublabel),
        adminSublabelsController.createSublabel
    )
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(sublabelSchemas.getSublabels),
        adminSublabelsController.getSublabels
    )

router.route('/sublabels/:id')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(sublabelSchemas.getSublabel),
        adminSublabelsController.getSublabel
    )
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(sublabelSchemas.updateSublabel),
        adminSublabelsController.updateSublabel
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(sublabelSchemas.deleteSublabel),
        adminSublabelsController.deleteSublabel
    )

router.route('/sublabels/:id/assign-user')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('User Management'),
        validateRequest(sublabelSchemas.assignSublabelToUser),
        adminSublabelsController.assignSublabelToUser
    )

router.route('/sublabels/:id/remove-user')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('User Management'),
        validateRequest(sublabelSchemas.removeSublabelFromUser),
        adminSublabelsController.removeSublabelFromUser
    )

router.route('/users/:userId/sublabels')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('User Management'),
        validateRequest(sublabelSchemas.getUserSublabels),
        adminSublabelsController.getUserSublabels
    )
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('User Management'),
        validateRequest(sublabelSchemas.toggleUserSublabels),
        adminSublabelsController.toggleUserSublabels
    )

// Month Management Routes
router.route('/months')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(monthManagementSchemas.createMonthSchema),
        adminMonthManagementController.createMonth
    )
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(monthManagementSchemas.getAllMonthsSchema),
        adminMonthManagementController.getAllMonths
    )

router.route('/months/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminMonthManagementController.getMonthStats
    )

router.route('/months/type/:type')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(monthManagementSchemas.getMonthsByTypeSchema),
        adminMonthManagementController.getMonthsByType
    )

router.route('/months/:id')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(monthManagementSchemas.monthParamsSchema),
        adminMonthManagementController.getMonthById
    )
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(monthManagementSchemas.updateMonthSchema),
        adminMonthManagementController.updateMonth
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(monthManagementSchemas.monthParamsSchema),
        adminMonthManagementController.deleteMonth
    )

router.route('/months/:id/toggle-status')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(monthManagementSchemas.monthParamsSchema),
        adminMonthManagementController.toggleMonthStatus
    )

// Report Management Routes
router.route('/reports/upload')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        uploadFiles,
        validateRequest(reportSchemas.uploadReportSchema),
        adminReportController.uploadReport
    )

router.route('/reports')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(reportSchemas.getReportsSchema),
        adminReportController.getReports
    )

router.route('/reports/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminReportController.getReportStats
    )

router.route('/reports/month/:monthId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(reportSchemas.getReportsByMonthSchema),
        adminReportController.getReportsByMonth
    )

router.route('/reports/:id')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(reportSchemas.reportParamsSchema),
        adminReportController.getReportById
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(reportSchemas.reportParamsSchema),
        adminReportController.deleteReport
    )

router.route('/reports/:id/data')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Financial Reports'),
        validateRequest(reportSchemas.getReportDataSchema),
        adminReportController.getReportData
    )

// FAQ Management Routes
router.route('/faqs')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(faqSchemas.createFAQSchema),
        adminFAQController.createFAQ
    )
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(faqSchemas.getFAQsSchema, 'query'),
        adminFAQController.getAllFAQs
    )

router.route('/faqs/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        adminFAQController.self
    )

router.route('/faqs/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminFAQController.getFAQStats
    )

router.route('/faqs/:faqId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(faqSchemas.getFAQByIdSchema),
        adminFAQController.getFAQById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(faqSchemas.updateFAQSchema),
        adminFAQController.updateFAQ
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(faqSchemas.deleteFAQSchema),
        adminFAQController.deleteFAQ
    )

// Testimonial Management Routes
router.route('/testimonials')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(testimonialSchemas.createTestimonialSchema),
        adminTestimonialController.createTestimonial
    )
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(testimonialSchemas.getTestimonialsSchema, 'query'),
        adminTestimonialController.getAllTestimonials
    )

router.route('/testimonials/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        adminTestimonialController.self
    )

router.route('/testimonials/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminTestimonialController.getTestimonialStats
    )

router.route('/testimonials/:testimonialId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(testimonialSchemas.getTestimonialByIdSchema),
        adminTestimonialController.getTestimonialById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(testimonialSchemas.updateTestimonialSchema),
        adminTestimonialController.updateTestimonial
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(testimonialSchemas.deleteTestimonialSchema),
        adminTestimonialController.deleteTestimonial
    )

// Trending Label Management Routes
router.route('/trending-labels')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(trendingLabelSchemas.createTrendingLabelSchema),
        adminTrendingLabelController.createTrendingLabel
    )
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(trendingLabelSchemas.getTrendingLabelsSchema, 'query'),
        adminTrendingLabelController.getAllTrendingLabels
    )

router.route('/trending-labels/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        adminTrendingLabelController.self
    )

router.route('/trending-labels/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminTrendingLabelController.getTrendingLabelStats
    )

router.route('/trending-labels/:labelId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(trendingLabelSchemas.getTrendingLabelByIdSchema),
        adminTrendingLabelController.getTrendingLabelById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(trendingLabelSchemas.updateTrendingLabelSchema),
        adminTrendingLabelController.updateTrendingLabel
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Content Management'),
        validateRequest(trendingLabelSchemas.deleteTrendingLabelSchema),
        adminTrendingLabelController.deleteTrendingLabel
    )

// User Management Routes
router.route('/users')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('User Management'),
        adminAnalyticsController.getAllUsers
    )

router.route('/analytics/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        adminAnalyticsController.self
    )

// Company Settings Management Routes
router.route('/company-settings')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(companySettingsSchemas.createCompanySettingsSchema),
        adminCompanySettingsController.createCompanySettings
    )
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(companySettingsSchemas.getCompanySettingsSchema, 'query'),
        adminCompanySettingsController.getCompanySettings
    )

router.route('/company-settings/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        adminCompanySettingsController.self
    )

router.route('/company-settings/setup-status')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        adminCompanySettingsController.getSetupStatus
    )

router.route('/company-settings/:settingsId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(companySettingsSchemas.getCompanySettingsByIdSchema),
        adminCompanySettingsController.getCompanySettingsById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(companySettingsSchemas.updateCompanySettingsSchema),
        adminCompanySettingsController.updateCompanySettings
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(companySettingsSchemas.deleteCompanySettingsSchema),
        adminCompanySettingsController.deleteCompanySettings
    )

router.route('/company-settings/:settingsId/youtube-links')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(companySettingsSchemas.addYoutubeLinkSchema),
        adminCompanySettingsController.addYoutubeLink
    )

router.route('/company-settings/:settingsId/youtube-links/:linkIndex')
    .delete(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('System Settings'),
        validateRequest(companySettingsSchemas.removeYoutubeLinkSchema),
        adminCompanySettingsController.removeYoutubeLink
    )

router.route('/team-members')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(teamMemberSchemas.inviteTeamMemberSchema),
        adminTeamMemberController.inviteTeamMember
    )
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(teamMemberSchemas.getAllTeamMembersSchema, 'query'),
        adminTeamMemberController.getAllTeamMembers
    )

router.route('/team-members/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminTeamMemberController.self
    )

router.route('/team-members/statistics')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        adminTeamMemberController.getTeamStatistics
    )

router.route('/team-members/:teamMemberId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(teamMemberSchemas.getTeamMemberByIdSchema),
        adminTeamMemberController.getTeamMemberById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(teamMemberSchemas.updateTeamMemberSchema),
        adminTeamMemberController.updateTeamMember
    )
    .delete(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(teamMemberSchemas.getTeamMemberByIdSchema),
        adminTeamMemberController.deleteTeamMember
    )

router.route('/team-members/:teamMemberId/status')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(teamMemberSchemas.updateTeamMemberStatusSchema),
        adminTeamMemberController.updateTeamMemberStatus
    )

router.route('/team-members/:teamMemberId/resend-invitation')
    .post(
        authentication,
        authorization([EUserRole.ADMIN]),
        validateRequest(teamMemberSchemas.resendInvitationSchema),
        adminTeamMemberController.resendInvitation
    )

// Support Ticket Management Routes
router.route('/support-tickets')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(getTicketsSchema),
        adminSupportTicketController.getAllTickets
    )

router.route('/support-tickets/self')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        adminSupportTicketController.self
    )

router.route('/support-tickets/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Analytics'),
        validateRequest(getTicketStatsSchema),
        adminSupportTicketController.getTicketStats
    )

router.route('/support-tickets/my-assigned')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(getTicketsSchema),
        adminSupportTicketController.getMyAssignedTickets
    )

router.route('/support-tickets/bulk-update')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(bulkUpdateTicketsSchema),
        adminSupportTicketController.bulkUpdateTickets
    )

router.route('/support-tickets/:ticketId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(getTicketByIdSchema),
        adminSupportTicketController.getTicketById
    )
    .put(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(updateTicketSchema),
        adminSupportTicketController.updateTicket
    )

router.route('/support-tickets/:ticketId/assign')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(assignTicketSchema),
        adminSupportTicketController.assignTicket
    )

router.route('/support-tickets/:ticketId/status')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(updateTicketStatusSchema),
        adminSupportTicketController.updateTicketStatus
    )

router.route('/support-tickets/:ticketId/priority')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(updateTicketPrioritySchema),
        adminSupportTicketController.updateTicketPriority
    )

router.route('/support-tickets/:ticketId/response')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(addResponseSchema),
        adminSupportTicketController.addResponse
    )

router.route('/support-tickets/:ticketId/internal-note')
    .post(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(addInternalNoteSchema),
        adminSupportTicketController.addInternalNote
    )

router.route('/support-tickets/:ticketId/escalate')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        moduleAuthorization('Support Tickets'),
        validateRequest(escalateTicketSchema),
        adminSupportTicketController.escalateTicket
    )

router.route('/payout-requests')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminPayoutController.getAllPayoutRequests
    )

router.route('/payout-requests/pending')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminPayoutController.getPendingPayoutRequests
    )

router.route('/payout-requests/stats')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminPayoutController.getPayoutStats
    )

router.route('/payout-requests/:requestId')
    .get(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminPayoutController.getPayoutRequestById
    )

router.route('/payout-requests/:requestId/approve')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminPayoutController.approvePayoutRequest
    )

router.route('/payout-requests/:requestId/reject')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminPayoutController.rejectPayoutRequest
    )

router.route('/payout-requests/:requestId/mark-paid')
    .patch(
        authentication,
        authorization([EUserRole.ADMIN, EUserRole.TEAM_MEMBER]),
        adminPayoutController.markPayoutAsPaid
    )

export default router