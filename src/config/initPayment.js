import config from './config.js'
import { RazorpayService } from '../service/razorpay.js'
import { PaytmService } from '../service/paytm.js'

const { gateway } = config.payment

let paymentGateway

if (gateway === 'paytm') {
    if (!config.payment.paytm_merchant_id || !config.payment.paytm_merchant_key) {
        console.warn('Paytm credentials not configured. Payment functionality will be limited.')
    }
    paymentGateway = new PaytmService(
        config.payment.paytm_merchant_id,
        config.payment.paytm_merchant_key,
        config.payment.paytm_website,
        config.payment.paytm_channel_id,
        config.payment.paytm_industry_type,
        config.payment.paytm_callback_url
    )
} else {
    if (!config.payment.razorpay_key_id || !config.payment.razorpay_key_secret) {
        console.warn('Razorpay credentials not configured. Payment functionality will be limited.')
    }
    paymentGateway = new RazorpayService(
        config.payment.razorpay_key_id,
        config.payment.razorpay_key_secret
    )
}

export { paymentGateway }
