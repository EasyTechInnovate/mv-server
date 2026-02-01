import { Router } from 'express'
import authController from '../controller/Authentication/auth.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import authSchemas from '../schema/auth.schema.js'

const router = Router()

router.route('/self').get(authController.self)

router.route('/register')
    .post(
        validateRequest(authSchemas.register),
        authController.register
    )

router.route('/login')
    .post(
        validateRequest(authSchemas.login),
        authController.login
    )

router.route('/refresh-token')
    .post(
        validateRequest(authSchemas.refreshToken),
        authController.refreshToken
    )

router.route('/logout')
    .post(
        authentication,
        authController.logout
    )

router.route('/logout-all')
    .post(
        authentication,
        authController.logoutAll
    )

router.route('/forgot-password')
    .post(
        validateRequest(authSchemas.forgotPassword),
        authController.forgotPassword
    )

router.route('/reset-password')
    .post(
        validateRequest(authSchemas.resetPassword),
        authController.resetPassword
    )

router.route('/change-password')
    .patch(
        authentication,
        validateRequest(authSchemas.changePassword),
        authController.changePassword
    )

router.route('/profile')
    .get(
        authentication,
        authController.getProfile
    )

router.route('/verify-email')
    .post(
        validateRequest(authSchemas.verifyEmail),
        authController.verifyEmail
    )

router.route('/resend-verification')
    .post(
        validateRequest(authSchemas.resendVerification),
        authController.resendVerification
    )

router.route('/admin/create')
    .post(
        validateRequest(authSchemas.createAdmin),
        authController.createAdmin
    )

router.route('/verify-kyc')
  .post(
    authentication,
    validateRequest(authSchemas.kycSubmit),
    authController.verifyKYC
  );

// Profile Management
router.route('/profile')
    .patch(
        authentication,
        authController.updateProfile
    )

// Social Media
router.route('/social-media')
    .patch(
        authentication,
        authController.updateSocialMedia
    )

// Sessions Management
router.route('/sessions')
    .get(
        authentication,
        authController.getSessions
    )

router.route('/sessions/:sessionId')
    .delete(
        authentication,
        authController.revokeSession
    )

router.route('/sessions/revoke-all')
    .post(
        authentication,
        authController.revokeAllOtherSessions
    )

export default router
