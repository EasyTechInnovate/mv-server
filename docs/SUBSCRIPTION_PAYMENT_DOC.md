# Subscription & Payment Flow — Frontend Documentation

---

## Overview

Payment gateway is **config-driven** — backend decides which gateway is active (`razorpay` or `paytm`). Frontend checks the `gateway` field in the `create-payment-intent` response and opens the correct checkout.

```
1. Create Payment Intent  →  Backend creates order on active gateway
2. Open Checkout          →  Frontend opens Razorpay or Paytm checkout
3a. Success               →  call verify-payment
3b. Failure / Cancel      →  call payment-failed
3c. Unsure                →  call payment-status
```

---

## Step 1 — Create Payment Intent

```
POST /v1/subscription/create-payment-intent
Auth: Required (User token)
```

**Request:**
```json
{
  "planId": "maheshwari_standard"
}
```

**Response when gateway = `razorpay`:**
```json
{
  "transactionId": "TXN_1709123456_ABC123",
  "planId": "maheshwari_standard",
  "planName": "Maheshwari Standard",
  "gateway": "razorpay",
  "razorpayOrderId": "order_PqR1234567890",
  "keyId": "rzp_live_xxxxxxxxxx",
  "amount": 999,
  "currency": "INR"
}
```

**Response when gateway = `paytm`:**
```json
{
  "transactionId": "TXN_1709123456_ABC123",
  "planId": "maheshwari_standard",
  "planName": "Maheshwari Standard",
  "gateway": "paytm",
  "orderId": "TXN_1709123456_ABC123",
  "txnToken": "xxxxxxxxxxxxxxxxxxxxxxxx",
  "merchantId": "MERCHANT_MID",
  "amount": 999,
  "currency": "INR"
}
```

---

## Step 2 — Open Checkout (Frontend)

Check `response.gateway` and open the correct checkout:

### If `gateway === "razorpay"`

Load script: `https://checkout.razorpay.com/v1/checkout.js`

```js
const options = {
  key: response.keyId,
  amount: response.amount * 100,        // paise mein
  currency: response.currency,
  order_id: response.razorpayOrderId,
  name: "Maheshwari Visuals",
  description: response.planName,
  handler: function (paymentResponse) {
    // SUCCESS — Step 3a
    verifyPayment({
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature,
      planId: response.planId
    })
  },
  modal: {
    ondismiss: function () {
      // User ne checkout band kiya — Step 3b
      markPaymentFailed(response.razorpayOrderId, 'User dismissed checkout')
    }
  }
}

const rzp = new Razorpay(options)
rzp.on('payment.failed', function (failureResponse) {
  markPaymentFailed(
    response.razorpayOrderId,
    failureResponse.error.description,
    failureResponse.error.metadata?.payment_id
  )
})
rzp.open()
```

---

### If `gateway === "paytm"`

Load script: `https://securegw.paytm.in/theia/paytmScriptTags.js` (prod)
or `https://securegw-stage.paytm.in/theia/paytmScriptTags.js` (staging)

```js
var config = {
  root: '',
  flow: 'DEFAULT',
  data: {
    orderId: response.orderId,
    token: response.txnToken,
    tokenType: 'TXN_TOKEN',
    amount: String(response.amount)
  },
  merchant: {
    mid: response.merchantId,
    redirect: false
  },
  handler: {
    notifyMerchant: function (eventName, data) {
      if (eventName === 'APP_CLOSED') {
        markPaymentFailed(response.orderId, 'User closed Paytm checkout')
      }
    },
    transactionStatus: function (paymentStatus) {
      if (paymentStatus.STATUS === 'TXN_SUCCESS') {
        // SUCCESS — Step 3a
        verifyPayment({
          paytmOrderId: paymentStatus.ORDERID,
          paytmTxnId: paymentStatus.TXNID,
          paytmChecksum: paymentStatus.CHECKSUMHASH,
          planId: response.planId
        })
      } else {
        // FAILURE — Step 3b
        markPaymentFailed(response.orderId, paymentStatus.RESPMSG)
      }
    }
  }
}

window.Paytm.CheckoutJS.init(config).then(() => {
  window.Paytm.CheckoutJS.invoke()
})
```

---

## Step 3a — Verify Payment (Success)

```
POST /v1/subscription/verify-payment
Auth: Required (User token)
```

**Request for Razorpay:**
```json
{
  "razorpayOrderId": "order_PqR1234567890",
  "razorpayPaymentId": "pay_PqR9876543210",
  "razorpaySignature": "abc123def456...",
  "planId": "maheshwari_standard"
}
```

**Request for Paytm:**
```json
{
  "paytmOrderId": "TXN_1709123456_ABC123",
  "paytmTxnId": "20260310111122333444",
  "paytmChecksum": "xxxxxx###salt",
  "planId": "maheshwari_standard"
}
```

**Response (Success):**
```json
{
  "subscription": {
    "planId": "maheshwari_standard",
    "status": "active",
    "validUntil": "2027-03-10T00:00:00.000Z",
    "planName": "Maheshwari Standard"
  },
  "transaction": {
    "transactionId": "TXN_1709123456_ABC123",
    "amount": 999,
    "status": "completed"
  }
}
```

**Response (Invalid Signature — 400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Payment verification failed: invalid signature"
}
```

---

## Step 3b — Payment Failed / Cancelled

```
POST /v1/subscription/payment-failed
Auth: Required (User token)
```

**Request:**
```json
{
  "razorpayOrderId": "order_PqR1234567890",
  "razorpayPaymentId": "pay_PqR9876543210",
  "reason": "User cancelled the payment"
}
```

> `razorpayPaymentId` optional hai. `razorpayOrderId` for both gateways — for Paytm, pass `orderId` in this field.

**Response:**
```json
{
  "transactionId": "TXN_1709123456_ABC123",
  "status": "failed",
  "failureReason": "User cancelled the payment"
}
```

---

## Step 3c — Check Payment Status (Fallback)

Agar frontend unsure ho (network error, page refresh):

```
GET /v1/subscription/payment-status/:orderId
Auth: Required (User token)
```

**Response:**
```json
{
  "transactionId": "TXN_1709123456_ABC123",
  "status": "pending",
  "amount": 999,
  "currency": "INR",
  "planId": "maheshwari_standard",
  "failureReason": null,
  "completedAt": null,
  "createdAt": "2026-03-10T10:00:00.000Z"
}
```

**`status` values:**

| Value | Meaning |
|-------|---------|
| `pending` | Payment start hua, complete nahi hua |
| `pending_verification` | Gateway pe paid hai, verify-payment call karo |
| `completed` | Payment successful, subscription active |
| `failed` | Payment fail ya cancel hua |
| `refunded` | Refund process hua |

If `status === "pending_verification"`:
```json
{
  "status": "pending_verification",
  "message": "Payment received but not yet verified. Please call verify-payment endpoint."
}
```
→ Immediately `verify-payment` call karo.

---

## Other APIs

### Get All Plans
```
GET /v1/subscription/plans
Auth: Not required
```

### Get Single Plan
```
GET /v1/subscription/plans/:planId
Auth: Not required
```

### My Subscription
```
GET /v1/subscription/my-subscription
Auth: Required
```

**Response (active):**
```json
{
  "hasSubscription": true,
  "subscription": {
    "planId": "maheshwari_standard",
    "planName": "Maheshwari Standard",
    "status": "active",
    "validFrom": "2026-03-10T...",
    "validUntil": "2027-03-10T...",
    "isActive": true,
    "autoRenewal": false
  },
  "featureAccess": {
    "canUploadMusic": true,
    "canAccessAnalytics": true,
    "canManageDistribution": true
  },
  "plan": { }
}
```

**Response (no subscription):**
```json
{
  "hasSubscription": false,
  "subscription": null
}
```

### Payment History
```
GET /v1/subscription/payment-history?page=1&limit=10
Auth: Required
```

**Response:**
```json
{
  "transactions": [
    {
      "transactionId": "TXN_1709123456_ABC123",
      "amount": 999,
      "currency": "INR",
      "planId": "maheshwari_standard",
      "status": "completed",
      "gateway": "razorpay",
      "createdAt": "2026-03-10T...",
      "completedAt": "2026-03-10T...",
      "isMockPayment": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalTransactions": 15,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Cancel Subscription
```
POST /v1/subscription/cancel-subscription
Auth: Required
```

> Subscription cancel hoti hai lekin `validUntil` tak access rehta hai.

---

## Plan IDs

| Plan ID | Name |
|---------|------|
| `maheshwari_standard` | Maheshwari Standard |
| `maheshwari_best_value` | Maheshwari Best Value |
| `maheshwari_popular` | Maheshwari Popular |
| `maheshwari_premium` | Maheshwari Premium |

---

## Complete API Reference

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/v1/subscription/plans` | ❌ | All plans list |
| GET | `/v1/subscription/plans/:planId` | ❌ | Single plan detail |
| POST | `/v1/subscription/create-payment-intent` | ✅ | Create gateway order |
| POST | `/v1/subscription/verify-payment` | ✅ | Verify payment + activate subscription |
| POST | `/v1/subscription/payment-failed` | ✅ | Mark payment as failed |
| GET | `/v1/subscription/payment-status/:orderId` | ✅ | Check payment status |
| GET | `/v1/subscription/my-subscription` | ✅ | My subscription details |
| GET | `/v1/subscription/payment-history` | ✅ | Payment history |
| POST | `/v1/subscription/cancel-subscription` | ✅ | Cancel subscription |
| POST | `/v1/subscription/mock-verify-payment` | ✅ | Dev-only mock payment |
| POST | `/v1/subscription/webhook/razorpay` | ❌ | Razorpay webhook (backend only) |
| POST | `/v1/subscription/webhook/paytm` | ❌ | Paytm webhook (backend only) |

---

## Error Codes

| HTTP | When |
|------|------|
| `400` | Invalid signature — payment data tampered or wrong fields sent |
| `400` | Missing required payment verification fields |
| `404` | Transaction not found — wrong orderId or userId mismatch |
| `422` | Invalid amount for selected plan (mock payment) |
| `502` | Gateway API down — retry after some time |

---

## Frontend Flow

```
User clicks "Buy Plan"
        |
        v
POST /create-payment-intent
        |
        |── gateway === "razorpay"  →  Open Razorpay Checkout
        |── gateway === "paytm"    →  Open Paytm CheckoutJS
        |
        |── User pays successfully
        |        |
        |        v
        |   POST /verify-payment  (with razorpay OR paytm fields)
        |        |
        |        |── signature valid   → subscription active ✅
        |        |── signature invalid → show error ❌
        |
        |── User cancels / payment fails
        |        |
        |        v
        |   POST /payment-failed
        |        |
        |        v
        |   Show retry option
        |
        |── Network error / page refresh
                 |
                 v
        GET /payment-status/:orderId
                 |
                 |── completed              → show success ✅
                 |── pending_verification   → call verify-payment immediately
                 |── failed                → show retry ❌
                 |── pending               → show loading / poll again
```

---

## Important Notes

1. **`gateway` field** — always check this in `create-payment-intent` response before opening checkout.

2. **`orderId` (save karo)** — jaise hi `create-payment-intent` response milta hai, `orderId`/`razorpayOrderId` save kar lo. Yeh `payment-failed` aur `payment-status` dono mein kaam aata hai.

3. **Webhooks** — Gateway backend ko directly bhi call karta hai. Production mein webhook URL set karo:
   - Razorpay: dashboard → Webhooks → `https://yourdomain.com/v1/subscription/webhook/razorpay`
   - Paytm: dashboard → Webhooks → `https://yourdomain.com/v1/subscription/webhook/paytm`

4. **Env variables needed:**
   ```
   PAYMENT_GATEWAY=razorpay           # or paytm

   # Razorpay
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=xxxx
   RAZORPAY_WEBHOOK_SECRET=xxxx

   # Paytm
   PAYTM_MERCHANT_ID=xxxx
   PAYTM_MERCHANT_KEY=xxxx
   PAYTM_WEBSITE=DEFAULT              # WEBSTAGING for staging
   PAYTM_CALLBACK_URL=https://yourdomain.com/payment-callback
   ```

5. **Mock Payment** (dev only) — real payment ke bina testing ke liye:
   ```
   POST /v1/subscription/mock-verify-payment
   { "planId": "maheshwari_standard", "amount": 999 }
   ```
