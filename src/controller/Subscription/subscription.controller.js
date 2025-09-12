import dayjs from 'dayjs'
import SubscriptionPlan from '../../model/subscriptionPlan.model.js'
import PaymentTransaction from '../../model/paymentTransaction.model.js'
import User from '../../model/user.model.js'
import { ESubscriptionStatus, EPaymentStatus, EUserType } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import quicker from '../../util/quicker.js'
import { createLabelSublabel } from '../../util/sublabelHelper.js'

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

            const transaction = new PaymentTransaction({
                userId,
                transactionId,
                amount,
                currency: plan.currency,
                planId,
                description: `Subscription to ${plan.name}`,
                status: EPaymentStatus.PENDING,
                gateway: 'razorpay',
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    source: 'web'
                }
            })

            await transaction.save()

            const paymentData = {
                transactionId,
                orderId: `order_${transactionId}`,
                amount,
                currency: plan.currency,
                planId,
                planName: plan.name,
                razorpayOrderId: `razorpay_order_${Date.now()}`
            }

            return httpResponse(req, res, 200, responseMessage.CREATED, paymentData)
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async verifyPayment(req, res, next) {
        try {
            const { razorpayPaymentId, razorpayOrderId, razorpaySignature, planId } = req.body
            const userId = req.authenticatedUser._id

            const transaction = await PaymentTransaction.findOne({
                userId,
                planId,
                status: EPaymentStatus.PENDING
            }).sort({ createdAt: -1 })

            if (!transaction) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Payment transaction')), req, 404)
            }

            const plan = await SubscriptionPlan.getPlanByPlanId(planId)
            if (!plan) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Plan')), req, 404)
            }

            transaction.razorpayPaymentId = razorpayPaymentId
            transaction.razorpayOrderId = razorpayOrderId
            transaction.razorpaySignature = razorpaySignature
            transaction.razorpayResponse = {
                razorpay_payment_id: razorpayPaymentId,
                razorpay_order_id: razorpayOrderId,
                razorpay_signature: razorpaySignature
            }
            
            await transaction.markAsCompleted()

            const user = await User.findById(userId)
            const validUntil = dayjs().add(plan.intervalCount, plan.interval).toDate()
            
            user.activateSubscription(planId, validUntil, `razorpay_sub_${Date.now()}`)
            user.addNotification(
                'Subscription Activated',
                `Your ${plan.name} subscription has been activated successfully!`,
                'success'
            )
            
            await user.save()

            if (user.userType === EUserType.LABELS) {
                try {
                    await createLabelSublabel(user._id, user.subscription.validFrom, user.subscription.validUntil)
                } catch (error) {
                    console.error('Failed to create label sublabel:', error)
                }
            }

            const responseData = {
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
            }

            return httpResponse(req, res, 200, responseMessage.customMessage('Payment verified and subscription activated'), responseData)
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

            if (user.userType === EUserType.LABELS) {
                try {
                    await createLabelSublabel(user._id, user.subscription.validFrom, user.subscription.validUntil)
                } catch (error) {
                    console.error('Failed to create label sublabel:', error)
                }
            }

            const responseData = {
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
            }

            return httpResponse(req, res, 200, responseMessage.customMessage('Mock payment verified and subscription activated'), responseData)
        } catch (err) {
            return httpError(next, err, req, 500)
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