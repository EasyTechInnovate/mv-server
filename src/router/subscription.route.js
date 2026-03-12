import { Router } from 'express'
import subscriptionController from '../controller/Subscription/subscription.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import subscriptionSchemas from '../schema/subscription.schema.js'

const router = Router()

router.route('/self').get(subscriptionController.self)

router.route('/plans').get(subscriptionController.getPlans)

router.route('/plans/:planId').get(subscriptionController.getPlanById)

router.route('/create-payment-intent')
    .post(
        authentication,
        validateRequest(subscriptionSchemas.createPaymentIntent),
        subscriptionController.createPaymentIntent
    )

router.route('/verify-payment')
    .post(
        authentication,
        validateRequest(subscriptionSchemas.verifyPayment),
        subscriptionController.verifyPayment
    )

router.route('/mock-verify-payment')
    .post(
        authentication,
        validateRequest(subscriptionSchemas.mockVerifyPayment),
        subscriptionController.mockVerifyPayment
    )

router.route('/payment-failed')
    .post(
        authentication,
        validateRequest(subscriptionSchemas.paymentFailed),
        subscriptionController.paymentFailed
    )

router.route('/payment-status/:razorpayOrderId')
    .get(
        authentication,
        validateRequest(subscriptionSchemas.paymentStatus),
        subscriptionController.checkPaymentStatus
    )

// Payment gateway webhooks — no auth middleware, verified via signature
router.route('/webhook/razorpay')
    .post(subscriptionController.razorpayWebhook)

router.route('/webhook/paytm')
    .post(subscriptionController.paytmWebhook)

router.route('/my-subscription')
    .get(
        authentication,
        subscriptionController.getMySubscription
    )

router.route('/payment-history')
    .get(
        authentication,
        subscriptionController.getPaymentHistory
    )

router.route('/cancel-subscription')
    .post(
        authentication,
        subscriptionController.cancelSubscription
    )

export default router