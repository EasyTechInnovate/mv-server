import { z } from 'zod'

const planId = z.string().min(1, 'Plan ID is required')

const subscriptionSchemas = {
    createPaymentIntent: z.object({
        body: z.object({
            planId
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
            planId
        })
    }),

    mockVerifyPayment: z.object({
        body: z.object({
            planId,
            mockPaymentId: z.string().min(1).optional().default('mock_payment_123'),
            amount: z.number().min(1, 'Amount must be greater than 0')
        })
    }),

    paymentFailed: z.object({
        body: z.object({
            razorpayOrderId: z.string().min(1, 'Order ID is required'),
            razorpayPaymentId: z.string().optional(),
            reason: z.string().optional()
        })
    }),

    paymentStatus: z.object({
        params: z.object({
            razorpayOrderId: z.string().min(1, 'Order ID is required')
        })
    })
}

export default subscriptionSchemas
