import dayjs from 'dayjs'
import SubscriptionPlan from '../../model/subscriptionPlan.model.js'
import PaymentTransaction from '../../model/paymentTransaction.model.js'
import User from '../../model/user.model.js'
import { ESubscriptionStatus, EPaymentStatus, EUserType } from '../../constant/application.js'
import { paymentGateway } from '../../config/initPayment.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import quicker from '../../util/quicker.js'
import { createLabelSublabel } from '../../util/sublabelHelper.js'
import config from '../../config/config.js'

export default {
    async self (req, res, next) {
      try {
        httpResponse(req, res, 200, responseMessage.SERVICE('Subscription'));
      } catch (err) {
        httpError(next, err, req, 500);
      }
    },
    async getPlans(req, res, next) {
        try {
            const plans = await SubscriptionPlan.getActivePlans()
            
            const formattedPlans = plans.map(plan => ({
                planId: plan.planId,
                name: plan.name,
                description: plan.description,
                price: {
                    current: plan.price.current,
                    original: plan.price.original
                },
                currency: plan.currency,
                interval: plan.interval,
                features: plan.features,
                isPopular: plan.isPopular,
                isBestValue: plan.isBestValue,
                discountedPrice: plan.discountedPrice
            }))

            return httpResponse(req, res, 200, responseMessage.SUCCESS, formattedPlans)
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getPlanById(req, res, next) {
        try {
            const { planId } = req.params
            
            const plan = await SubscriptionPlan.getPlanByPlanId(planId)
            if (!plan) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Plan')), req, 404)
            }

            const formattedPlan = {
                planId: plan.planId,
                name: plan.name,
                description: plan.description,
                price: {
                    current: plan.price.current,
                    original: plan.price.original
                },
                currency: plan.currency,
                interval: plan.interval,
                features: plan.features,
                isPopular: plan.isPopular,
                isBestValue: plan.isBestValue,
                discountedPrice: plan.discountedPrice,
                limits: plan.limits,
                trial: plan.trial
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, formattedPlan)
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async createPaymentIntent(req, res, next) {
        try {
            const { planId } = req.body
            const userId = req.authenticatedUser._id

            const plan = await SubscriptionPlan.getPlanByPlanId(planId)
            if (!plan) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Plan')), req, 404)
            }

            const amount = plan.getEffectivePrice()
            const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

            // Create order via configured payment gateway
            const orderResult = await paymentGateway.createOrder({
                amount,
                currency: plan.currency || 'INR',
                receipt: transactionId,
                notes: { planId, userId: userId.toString() }
            })

            if (!orderResult.success) {
                return httpError(next, new Error(`Payment order creation failed: ${orderResult.error}`), req, 502)
            }

            const gatewayOrder = orderResult.order
            const activeGateway = config.payment.gateway

            const transaction = new PaymentTransaction({
                userId,
                transactionId,
                amount,
                currency: plan.currency || 'INR',
                planId,
                description: `Subscription to ${plan.name}`,
                status: EPaymentStatus.PENDING,
                gateway: activeGateway,
                razorpayOrderId: gatewayOrder.id,   // stores gateway order ID regardless of provider
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    source: 'web'
                }
            })

            await transaction.save()

            // Build gateway-specific checkout data for the frontend
            const gatewayCheckoutData = activeGateway === 'paytm'
                ? {
                    gateway: 'paytm',
                    orderId: gatewayOrder.id,
                    txnToken: gatewayOrder.txnToken,
                    merchantId: config.payment.paytm_merchant_id,
                    amount,
                    currency: plan.currency || 'INR'
                }
                : {
                    gateway: 'razorpay',
                    razorpayOrderId: gatewayOrder.id,
                    razorpayKeyId: config.payment.razorpay_key_id,
                    amount,
                    currency: gatewayOrder.currency
                }

            return httpResponse(req, res, 200, responseMessage.CREATED, {
                transactionId,
                planId,
                planName: plan.name,
                ...gatewayCheckoutData
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async verifyPayment(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const activeGateway = config.payment.gateway

            // Extract gateway-specific fields
            let orderId, paymentId, signature, signatureParams
            if (activeGateway === 'paytm') {
                orderId = req.body.paytmOrderId
                paymentId = req.body.paytmTxnId
                signature = req.body.paytmChecksum
                signatureParams = {
                    paytmOrderId: orderId,
                    paytmTxnId: paymentId,
                    paytmChecksum: signature
                }
            } else {
                orderId = req.body.razorpayOrderId
                paymentId = req.body.razorpayPaymentId
                signature = req.body.razorpaySignature
                signatureParams = {
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature
                }
            }

            if (!orderId || !paymentId || !signature) {
                return httpError(next, new Error('Missing required payment verification fields'), req, 400)
            }

            // 1. Find pending transaction by gateway order ID
            const transaction = await PaymentTransaction.findOne({
                razorpayOrderId: orderId,
                userId,
                status: EPaymentStatus.PENDING
            })

            if (!transaction) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payment transaction')), req, 404)
            }

            // 2. Verify payment signature
            const signatureResult = paymentGateway.verifyPaymentSignature(signatureParams)

            if (!signatureResult.success || !signatureResult.valid) {
                return httpError(next, new Error('Payment verification failed: invalid signature'), req, 400)
            }

            const plan = await SubscriptionPlan.getPlanByPlanId(transaction.planId)
            if (!plan) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Plan')), req, 404)
            }

            // 3. Mark transaction complete
            transaction.razorpayPaymentId = paymentId
            transaction.razorpaySignature = signature
            transaction.razorpayResponse = signatureParams
            await transaction.markAsCompleted()

            // 4. Activate subscription
            const user = await User.findById(userId)
            const validUntil = dayjs().add(plan.intervalCount, plan.interval).toDate()

            user.activateSubscription(transaction.planId, validUntil, `razorpay_sub_${Date.now()}`)
            user.addNotification(
                'Subscription Activated',
                `Your ${plan.name} subscription has been activated successfully!`,
                'success'
            )
            await user.save()

            if (user.userType === EUserType.LABEL) {
                try {
                    await createLabelSublabel(user._id, user.subscription.validFrom, user.subscription.validUntil)
                } catch (error) {
                    console.error('Failed to create label sublabel:', error)
                }
            }

            return httpResponse(req, res, 200, responseMessage.customMessage('Payment verified and subscription activated'), {
                subscription: {
                    planId: user.subscription.planId,
                    status: user.subscription.status,
                    validUntil: user.subscription.validUntil,
                    planName: plan.name
                },
                transaction: {
                    transactionId: transaction.transactionId,
                    amount: transaction.amount,
                    status: transaction.status
                }
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async mockVerifyPayment(req, res, next) {
        try {
            const { planId, mockPaymentId, amount } = req.body
            const userId = req.authenticatedUser._id

            const plan = await SubscriptionPlan.getPlanByPlanId(planId)
            if (!plan) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Plan')), req, 404)
            }

            if (amount !== plan.getEffectivePrice()) {
                return httpError(next, new Error(responseMessage.customMessage('Invalid amount for the selected plan')), req, 422)
            }

            const transactionId = `TXN_MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`

            const transaction = new PaymentTransaction({
                userId,
                transactionId,
                amount,
                currency: plan.currency,
                planId,
                description: `Mock payment for ${plan.name}`,
                status: EPaymentStatus.COMPLETED,
                gateway: 'mock',
                razorpayPaymentId: mockPaymentId,
                razorpayOrderId: `mock_order_${Date.now()}`,
                razorpayResponse: {
                    mock_payment_id: mockPaymentId,
                    mock_order_id: `mock_order_${Date.now()}`,
                    mock_signature: 'mock_signature_verified'
                },
                completedAt: new Date(),
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    source: 'web'
                }
            })

            await transaction.save()

            const user = await User.findById(userId)
            const validUntil = dayjs().add(plan.intervalCount, plan.interval).toDate()
            
            user.activateSubscription(planId, validUntil, `mock_sub_${Date.now()}`)
            user.addNotification(
                'Subscription Activated',
                `Your ${plan.name} subscription has been activated successfully! (Mock Payment)`,
                'success'
            )
            
            await user.save()

            if (user.userType === EUserType.LABEL) {
                try {
                    await createLabelSublabel(user._id, user.subscription.validFrom, user.subscription.validUntil)
                } catch (error) {
                    console.error('Failed to create label sublabel:', error)
                }
            }

            return httpResponse(req, res, 200, responseMessage.customMessage('Mock payment verified and subscription activated'), {
                subscription: {
                    planId: user.subscription.planId,
                    status: user.subscription.status,
                    validUntil: user.subscription.validUntil,
                    planName: plan.name
                },
                transaction: {
                    transactionId: transaction.transactionId,
                    amount: transaction.amount,
                    status: transaction.status,
                    isMockPayment: true
                }
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async paymentFailed(req, res, next) {
        try {
            const { razorpayOrderId, razorpayPaymentId, reason } = req.body
            const userId = req.authenticatedUser._id

            const transaction = await PaymentTransaction.findOne({
                razorpayOrderId,
                userId,
                status: EPaymentStatus.PENDING
            })

            if (!transaction) {
                // Already processed or not found — not an error, just acknowledge
                return httpResponse(req, res, 200, responseMessage.customMessage('Payment status noted'), null)
            }

            if (razorpayPaymentId) transaction.razorpayPaymentId = razorpayPaymentId
            await transaction.markAsFailed(reason || 'Payment failed or cancelled by user')

            return httpResponse(req, res, 200, responseMessage.customMessage('Payment failure recorded'), {
                transactionId: transaction.transactionId,
                status: transaction.status,
                failureReason: transaction.failureReason
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async checkPaymentStatus(req, res, next) {
        try {
            const { razorpayOrderId } = req.params
            const userId = req.authenticatedUser._id

            const transaction = await PaymentTransaction.findOne({
                razorpayOrderId,
                userId
            }).sort({ createdAt: -1 })

            if (!transaction) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payment transaction')), req, 404)
            }

            // If still pending, verify with payment gateway directly
            if (transaction.status === EPaymentStatus.PENDING) {
                const orderResult = await paymentGateway.getOrderDetails(razorpayOrderId)
                if (orderResult.success && orderResult.order.status === 'paid') {
                    // Order is paid on Razorpay but we haven't processed it yet
                    return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                        transactionId: transaction.transactionId,
                        status: 'pending_verification',
                        message: 'Payment received but not yet verified. Please call verify-payment endpoint.',
                        razorpayOrderStatus: orderResult.order.status
                    })
                }
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                transactionId: transaction.transactionId,
                status: transaction.status,
                amount: transaction.amount,
                currency: transaction.currency,
                planId: transaction.planId,
                failureReason: transaction.failureReason || null,
                completedAt: transaction.completedAt || null,
                createdAt: transaction.createdAt
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    // Razorpay webhook — no auth, verified via Razorpay signature header
    async razorpayWebhook(req, res, next) {
        try {
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
            const signature = req.headers['x-razorpay-signature']

            if (webhookSecret && signature) {
                const crypto = (await import('crypto')).default
                const expectedSignature = crypto
                    .createHmac('sha256', webhookSecret)
                    .update(JSON.stringify(req.body))
                    .digest('hex')

                if (expectedSignature !== signature) {
                    return httpError(next, new Error('Invalid webhook signature'), req, 400)
                }
            }

            const event = req.body.event
            const payload = req.body.payload

            if (event === 'payment.captured') {
                const payment = payload.payment.entity
                const transaction = await PaymentTransaction.findOne({
                    razorpayOrderId: payment.order_id,
                    status: EPaymentStatus.PENDING
                })

                if (transaction) {
                    const plan = await SubscriptionPlan.getPlanByPlanId(transaction.planId)

                    transaction.razorpayPaymentId = payment.id
                    transaction.razorpayResponse = payment
                    await transaction.markAsCompleted()

                    if (plan) {
                        const user = await User.findById(transaction.userId)
                        if (user && !user.hasActiveSubscription) {
                            const validUntil = dayjs().add(plan.intervalCount, plan.interval).toDate()
                            user.activateSubscription(transaction.planId, validUntil, `razorpay_sub_${Date.now()}`)
                            await user.save()
                        }
                    }
                }
            }

            if (event === 'payment.failed') {
                const payment = payload.payment.entity
                const transaction = await PaymentTransaction.findOne({
                    razorpayOrderId: payment.order_id,
                    status: EPaymentStatus.PENDING
                })

                if (transaction) {
                    transaction.razorpayPaymentId = payment.id
                    transaction.razorpayResponse = payment
                    await transaction.markAsFailed(
                        payment.error_description || 'Payment failed',
                        payment.error_code || null
                    )
                }
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS)
        } catch (err) {
            // Still return 200 so Razorpay doesn't retry
            console.error('Webhook processing error:', err)
            return httpResponse(req, res, 200, responseMessage.SUCCESS)
        }
    },

    // Paytm webhook — no auth, verified via checksum
    async paytmWebhook(req, res, next) {
        try {
            const body = req.body
            const { CHECKSUMHASH, ...params } = body

            // Verify checksum if provided
            if (CHECKSUMHASH) {
                const isValid = paymentGateway.verifyPaymentSignature
                    ? paymentGateway.verifyPaymentSignature({ ...params, paytmChecksum: CHECKSUMHASH })
                    : { valid: true }

                if (!isValid.valid) {
                    return httpResponse(req, res, 200, responseMessage.SUCCESS)
                }
            }

            const txnStatus = body.STATUS
            const orderId = body.ORDERID
            const txnId = body.TXNID

            if (txnStatus === 'TXN_SUCCESS') {
                const transaction = await PaymentTransaction.findOne({
                    razorpayOrderId: orderId,
                    status: EPaymentStatus.PENDING
                })

                if (transaction) {
                    const plan = await SubscriptionPlan.getPlanByPlanId(transaction.planId)

                    transaction.razorpayPaymentId = txnId
                    transaction.razorpayResponse = body
                    await transaction.markAsCompleted()

                    if (plan) {
                        const user = await User.findById(transaction.userId)
                        if (user && !user.hasActiveSubscription) {
                            const validUntil = dayjs().add(plan.intervalCount, plan.interval).toDate()
                            user.activateSubscription(transaction.planId, validUntil, `paytm_sub_${Date.now()}`)
                            await user.save()
                        }
                    }
                }
            }

            if (txnStatus === 'TXN_FAILURE') {
                const transaction = await PaymentTransaction.findOne({
                    razorpayOrderId: orderId,
                    status: EPaymentStatus.PENDING
                })

                if (transaction) {
                    transaction.razorpayPaymentId = txnId || null
                    transaction.razorpayResponse = body
                    await transaction.markAsFailed(body.RESPMSG || 'Payment failed', body.RESPCODE || null)
                }
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS)
        } catch (err) {
            console.error('Paytm webhook processing error:', err)
            return httpResponse(req, res, 200, responseMessage.SUCCESS)
        }
    },

    async getMySubscription(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            
            const user = await User.findById(userId)
            if (!user.subscription.planId) {
                return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                    hasSubscription: false,
                    subscription: null
                })
            }

            const plan = await SubscriptionPlan.getPlanByPlanId(user.subscription.planId)
            
            const subscriptionData = {
                hasSubscription: true,
                subscription: {
                    planId: user.subscription.planId,
                    planName: plan?.name || 'Unknown Plan',
                    status: user.subscription.status,
                    validFrom: user.subscription.validFrom,
                    validUntil: user.subscription.validUntil,
                    isActive: user.hasActiveSubscription,
                    autoRenewal: user.subscription.autoRenewal,
                    lastPaymentDate: user.subscription.lastPaymentDate,
                    nextPaymentDate: user.subscription.nextPaymentDate
                },
                featureAccess: user.featureAccess,
                plan: plan ? {
                    name: plan.name,
                    price: plan.price,
                    features: plan.features,
                    limits: plan.limits
                } : null
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, subscriptionData)
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getPaymentHistory(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { page = 1, limit = 10 } = req.query

            const skip = (parseInt(page) - 1) * parseInt(limit)
            
            const transactions = await PaymentTransaction.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'firstName lastName emailAddress')

            const total = await PaymentTransaction.countDocuments({ userId })

            const formattedTransactions = transactions.map(transaction => ({
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                currency: transaction.currency,
                planId: transaction.planId,
                description: transaction.description,
                status: transaction.status,
                paymentMethod: transaction.paymentMethod,
                gateway: transaction.gateway,
                createdAt: transaction.createdAt,
                completedAt: transaction.completedAt,
                isMockPayment: transaction.gateway === 'mock'
            }))

            const responseData = {
                transactions: formattedTransactions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalTransactions: total,
                    hasNextPage: skip + parseInt(limit) < total,
                    hasPreviousPage: parseInt(page) > 1
                }
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, responseData)
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async cancelSubscription(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            
            const user = await User.findById(userId)
            if (!user.hasActiveSubscription) {
                return httpError(next, new Error(responseMessage.customMessage('No active subscription found')), req, 404)
            }

            user.subscription.status = ESubscriptionStatus.CANCELLED
            user.subscription.autoRenewal = false
            user.featureAccess.canUploadMusic = false
            user.featureAccess.canAccessAnalytics = false
            user.featureAccess.canManageDistribution = false

            user.addNotification(
                'Subscription Cancelled',
                'Your subscription has been cancelled. You can still use the features until the current period ends.',
                'info'
            )

            await user.save()

            const responseData = {
                subscription: {
                    planId: user.subscription.planId,
                    status: user.subscription.status,
                    validUntil: user.subscription.validUntil,
                    autoRenewal: user.subscription.autoRenewal
                }
            }

            return httpResponse(req, res, 200, responseMessage.customMessage('Subscription cancelled successfully'), responseData)
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}