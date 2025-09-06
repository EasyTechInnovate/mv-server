import { z } from 'zod'
import { ESubscriptionPlan } from '../constant/application.js'

const subscriptionSchemas = {
    createPaymentIntent: z.object({
        planId: z.enum(Object.values(ESubscriptionPlan), {
            required_error: 'Plan ID is required',
            invalid_type_error: 'Invalid plan ID'
        })
    }),

    verifyPayment: z.object({
        razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
        razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
        razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
        planId: z.enum(Object.values(ESubscriptionPlan))
    }),

    mockVerifyPayment: z.object({
        planId: z.enum(Object.values(ESubscriptionPlan)),
        mockPaymentId: z.string().min(1, 'Mock payment ID is required').optional().default('mock_payment_123'),
        amount: z.number().min(1, 'Amount must be greater than 0')
    })
}

export default subscriptionSchemas