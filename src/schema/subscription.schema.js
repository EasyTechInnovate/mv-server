import { z } from 'zod'
import { ESubscriptionPlan } from '../constant/application.js'

const subscriptionSchemas = {
    createPaymentIntent: z.object({
        body: z.object({
            planId: z.enum(Object.values(ESubscriptionPlan), {
                required_error: 'Plan ID is required',
                invalid_type_error: 'Invalid plan ID'
            })
        })
    }),

    verifyPayment: z.object({
        body: z.object({
            // Razorpay fields
            razorpayPaymentId: z.string().min(1).optional(),
            razorpayOrderId: z.string().min(1).optional(),
            razorpaySignature: z.string().min(1).optional(),
            // Paytm fields
            paytmOrderId: z.string().min(1).optional(),
            paytmTxnId: z.string().min(1).optional(),
            paytmChecksum: z.string().min(1).optional(),
            planId: z.enum(Object.values(ESubscriptionPlan))
        })
    }),

    mockVerifyPayment: z.object({
        body: z.object({
            planId: z.enum(Object.values(ESubscriptionPlan)),
            mockPaymentId: z.string().min(1, 'Mock payment ID is required').optional().default('mock_payment_123'),
            amount: z.number().min(1, 'Amount must be greater than 0')
        })
    }),

    paymentFailed: z.object({
        body: z.object({
            razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
            razorpayPaymentId: z.string().optional(),
            reason: z.string().optional()
        })
    }),

    paymentStatus: z.object({
        params: z.object({
            razorpayOrderId: z.string().min(1, 'Razorpay order ID is required')
        })
    })
}

export default subscriptionSchemas