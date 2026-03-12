import Razorpay from 'razorpay'
import crypto from 'crypto'

export class RazorpayService {
    constructor(keyId, keySecret) {
        this.keyId = keyId
        this.keySecret = keySecret
        this.razorpay = new Razorpay({
            key_id: this.keyId,
            key_secret: this.keySecret
        })
    }
    async createOrder(params) {
        try {
            const options = {
                amount: params.amount * 100,
                currency: params.currency || 'INR',
                receipt: params.receipt || `receipt_${new Date().getTime()}`,
                notes: params.notes || {}
            }

            const order = await this.razorpay.orders.create(options)

            return {
                success: true,
                order,
                error: null
            }
        } catch (error) {
            return {
                success: false,
                order: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    verifyPaymentSignature(params) {
        try {
            const body = params.razorpayOrderId + '|' + params.razorpayPaymentId

            const expectedSignature = crypto.createHmac('sha256', this.keySecret).update(body).digest('hex')

            const isValid = expectedSignature === params.razorpaySignature

            return {
                success: true,
                valid: isValid,
                error: null
            }
        } catch (error) {
            return {
                success: false,
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    async getOrderDetails(orderId) {
        try {
            const order = await this.razorpay.orders.fetch(orderId)
            return {
                success: true,
                order,
                error: null
            }
        } catch (error) {
            return {
                success: false,
                order: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    async getPaymentDetails(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId)
            return {
                success: true,
                payment,
                error: null
            }
        } catch (error) {
            return {
                success: false,
                payment: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    async refundPayment(paymentId, amount, notes) {
        try {
            const refundOptions = {}
            if (amount) refundOptions.amount = amount
            if (notes) refundOptions.notes = notes

            const refund = await this.razorpay.payments.refund(paymentId, refundOptions)
            return {
                success: true,
                refund,
                error: null
            }
        } catch (error) {
            return {
                success: false,
                refund: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    async listPayments(params = {}) {
        try {
            const payments = await this.razorpay.payments.all(params)
            return {
                success: true,
                payments,
                error: null
            }
        } catch (error) {
            return {
                success: false,
                payments: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }
}