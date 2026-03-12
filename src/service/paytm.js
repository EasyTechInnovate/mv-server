import crypto from 'crypto'

// Paytm checksum utility (Paytm's own algorithm without external SDK dependency)
function _generateChecksum(params, merchantKey) {
    const salt = crypto.randomBytes(4).toString('hex')
    const sortedValues = Object.keys(params)
        .sort()
        .map(k => (params[k] === null || params[k] === undefined ? '' : String(params[k])))
        .join('|')
    const hashStr = sortedValues + '|' + salt
    const hash = crypto.createHash('sha256').update(hashStr).digest('hex')
    return hash + '###' + salt
}

function _verifyChecksum(params, merchantKey, checksum) {
    try {
        const parts = checksum.split('###')
        if (parts.length !== 2) return false
        const [hash, salt] = parts
        const sortedValues = Object.keys(params)
            .sort()
            .map(k => (params[k] === null || params[k] === undefined ? '' : String(params[k])))
            .join('|')
        const hashStr = sortedValues + '|' + salt
        const expectedHash = crypto.createHash('sha256').update(hashStr).digest('hex')
        return expectedHash === hash
    } catch {
        return false
    }
}

export class PaytmService {
    constructor(merchantId, merchantKey, website, channelId, industryType, callbackUrl) {
        this.merchantId = merchantId
        this.merchantKey = merchantKey
        this.website = website
        this.channelId = channelId
        this.industryType = industryType
        this.callbackUrl = callbackUrl
        this.baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://securegw.paytm.in'
            : 'https://securegw-stage.paytm.in'
    }

    async createOrder(params) {
        try {
            const orderId = params.receipt || `ORDER_${Date.now()}`

            const body = {
                requestType: 'Payment',
                mid: this.merchantId,
                websiteName: this.website,
                orderId,
                txnAmount: {
                    value: String(params.amount.toFixed(2)),
                    currency: params.currency || 'INR'
                },
                userInfo: {
                    custId: (params.notes && params.notes.userId) ? String(params.notes.userId) : 'CUST_001'
                },
                ...(this.callbackUrl ? { callbackUrl: this.callbackUrl } : {})
            }

            const checksum = _generateChecksum({ ...body, mid: this.merchantId }, this.merchantKey)

            const response = await fetch(
                `${this.baseUrl}/theia/api/v1/initiateTransaction?mid=${this.merchantId}&orderId=${orderId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        body,
                        head: { signature: checksum }
                    })
                }
            )

            const result = await response.json()

            if (result.body && result.body.resultInfo && result.body.resultInfo.resultStatus === 'S') {
                return {
                    success: true,
                    order: {
                        id: orderId,                         // maps to razorpayOrderId field in DB
                        txnToken: result.body.txnToken,
                        amount: params.amount,
                        currency: params.currency || 'INR'
                    },
                    error: null
                }
            }

            const errorMsg = result.body?.resultInfo?.resultMsg || 'Paytm order creation failed'
            return { success: false, order: null, error: errorMsg }
        } catch (error) {
            return {
                success: false,
                order: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    // params: { paytmOrderId, paytmTxnId, paytmChecksum, ...otherParams }
    verifyPaymentSignature(params) {
        try {
            const { paytmChecksum, ...verifyParams } = params
            if (!paytmChecksum) {
                return { success: false, valid: false, error: 'Missing Paytm checksum' }
            }
            const isValid = _verifyChecksum(verifyParams, this.merchantKey, paytmChecksum)
            return { success: true, valid: isValid, error: null }
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
            const body = { mid: this.merchantId, orderId }
            const checksum = _generateChecksum(body, this.merchantKey)

            const response = await fetch(`${this.baseUrl}/v3/order/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    body,
                    head: { signature: checksum }
                })
            })

            const result = await response.json()
            const orderBody = result.body || {}
            const resultStatus = orderBody.resultInfo?.resultStatus

            return {
                success: true,
                order: {
                    id: orderId,
                    status: resultStatus === 'TXN_SUCCESS' ? 'paid' : resultStatus?.toLowerCase() || 'pending',
                    amount: orderBody.txnAmount,
                    txnId: orderBody.txnId,
                    raw: orderBody
                },
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

    async getPaymentDetails(txnId) {
        // Paytm uses orderId for lookups; txnId lookup not standard — use getOrderDetails
        return { success: false, payment: null, error: 'Use getOrderDetails with orderId for Paytm' }
    }

    async refundPayment(txnId, amount, notes) {
        try {
            const refundId = `REFUND_${Date.now()}`
            const body = {
                mid: this.merchantId,
                txnType: 'REFUND',
                orderId: notes?.orderId || '',
                txnId,
                refId: refundId,
                refundAmount: String(amount.toFixed(2))
            }
            const checksum = _generateChecksum(body, this.merchantKey)

            const response = await fetch(`${this.baseUrl}/v2/refund/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    body,
                    head: { signature: checksum }
                })
            })

            const result = await response.json()
            const refundBody = result.body || {}

            if (refundBody.resultInfo?.resultStatus === 'TXN_SUCCESS') {
                return { success: true, refund: refundBody, error: null }
            }

            return {
                success: false,
                refund: null,
                error: refundBody.resultInfo?.resultMsg || 'Refund failed'
            }
        } catch (error) {
            return {
                success: false,
                refund: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }
}
