# Subscription Plans — Complete Documentation

> For frontend developers. Covers plans, payment, aggregator subscription, and email verification.

---

## What Changed (Summary)

| What | Before | Now |
|------|--------|-----|
| Plan IDs | Hardcoded enum (10 fixed IDs) | Free string — admin can create any plan with any ID |
| Plan targeting | No targeting | Each plan has `targetType`: `everyone / artist / label` |
| Showcase features | Not available | `showcaseFeatures` array — what to show on pricing cards |
| Aggregator subscription | Not implemented | Admin sets `startDate` / `endDate` per aggregator |
| Payment gateway | Razorpay only | Config-driven — Razorpay or Paytm based on env |

---

## Plans in the Database

### For Artists (`targetType: artist`)

| planId | Name | Price | Original | Badge |
|--------|------|-------|----------|-------|
| `artist_standard` | Standard | ₹499/yr | ₹699 | — |
| `artist_popular` | Popular | ₹899/yr | ₹1299 | Most Popular |
| `artist_best_value` | Best Value | ₹1499/yr | ₹1999 | Best Value |

### For Labels (`targetType: label`)

| planId | Name | Price | Original | Badge |
|--------|------|-------|----------|-------|
| `label_standard` | Standard | ₹1499/yr | ₹2999 | — |
| `label_popular` | Popular | ₹2499/yr | ₹3999 | Most Popular |
| `label_best_value` | Best Value | ₹3499/yr | ₹4999 | Best Value |

### For Everyone (`targetType: everyone`)

| planId | Name | Price | Original | Badge |
|--------|------|-------|----------|-------|
| `one_song` | One Song | ₹199/yr | ₹299 | — |
| `one_album` | One Album | ₹499/yr | ₹799 | — |

> Aggregators do NOT purchase plans. Their subscription is managed by admin.

---

## Plan Object Shape

Every plan API returns this shape:

```json
{
  "planId": "artist_popular",
  "name": "Popular",
  "description": "Level up with more revenue and premium distribution features.",
  "targetType": "artist",
  "price": {
    "current": 899,
    "original": 1299
  },
  "currency": "INR",
  "interval": "year",
  "intervalCount": 1,
  "discountedPrice": 899,
  "isPopular": true,
  "isBestValue": false,
  "showcaseFeatures": [
    { "text": "Unlimited Releases", "included": true },
    { "text": "80% of Net Revenue", "included": true },
    { "text": "YouTube OAC", "included": true },
    { "text": "Dolby Atmos Distribution", "included": true },
    { "text": "Spotify Discovery Mode", "included": false }
  ],
  "features": { ...all boolean access flags... },
  "limits": {
    "maxUploads": -1,
    "maxCollaborators": 10,
    "maxDistributionChannels": 150
  },
  "trial": { "enabled": false, "days": 0 },
  "discount": { "enabled": false, "percentage": 0, "validUntil": null }
}
```

**Key fields for frontend:**
- `showcaseFeatures` — use this for the plan card feature list (not `features`)
- `discountedPrice` — final price to show (already has discount applied)
- `price.original` — show as strikethrough if `> price.current`
- `isPopular` — show "Most Popular" badge
- `isBestValue` — show "Best Value" badge
- `features` — use for actual access control checks (not display)

---

## Public Plan APIs

### Get All Plans
```
GET /v1/subscription/plans
GET /v1/subscription/plans?targetType=artist
GET /v1/subscription/plans?targetType=label
GET /v1/subscription/plans?targetType=everyone
Auth: Not required
```

Returns only active plans sorted by `displayOrder`.

**Usage by page:**
- `/pricing/for-artists` → `?targetType=artist`
- `/pricing/for-labels` → `?targetType=label`
- `/pricing/everyone` → `?targetType=everyone`
- Signup flow (artist) → `?targetType=artist`
- Signup flow (label) → `?targetType=label`
- App plans page → filter by logged-in user's `userType`

### Get Single Plan
```
GET /v1/subscription/plans/:planId
Auth: Not required
```

---

## User Subscription APIs

### My Subscription
```
GET /v1/subscription/my-subscription
Auth: Required
```

**Response for Artist / Label:**
```json
{
  "hasSubscription": true,
  "subscription": {
    "planId": "artist_popular",
    "planName": "Popular",
    "status": "active",
    "validFrom": "2026-03-28T...",
    "validUntil": "2027-03-28T...",
    "isActive": true,
    "autoRenewal": false,
    "lastPaymentDate": "2026-03-28T...",
    "nextPaymentDate": null
  },
  "featureAccess": {
    "canUploadMusic": true,
    "canAccessAnalytics": true,
    "canManageDistribution": true
  },
  "plan": {
    "name": "Popular",
    "targetType": "artist",
    "price": { "current": 899, "original": 1299 },
    "discountedPrice": 899,
    "features": { ... },
    "showcaseFeatures": [ ... ],
    "limits": { ... }
  }
}
```

**Response for Aggregator:**
```json
{
  "userType": "aggregator",
  "hasSubscription": true,
  "aggregatorSubscription": {
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-12-31T23:59:59.000Z",
    "isActive": true,
    "daysRemaining": 278
  }
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

### Cancel Subscription
```
POST /v1/subscription/cancel-subscription
Auth: Required
```

---

## Payment Flow

Full payment docs: `SUBSCRIPTION_PAYMENT_DOC.md`

**Quick summary:**

```
1. POST /v1/subscription/create-payment-intent  →  { gateway, orderId/razorpayOrderId, txnToken/keyId }
2. Open Razorpay or Paytm checkout (check gateway field)
3a. Success  →  POST /v1/subscription/verify-payment
3b. Failure  →  POST /v1/subscription/payment-failed
3c. Unsure   →  GET  /v1/subscription/payment-status/:orderId
```

---

## Aggregator Subscription

Aggregators do NOT buy plans. Admin sets their subscription dates manually.

### Admin — Set Aggregator Subscription
```
PATCH /v1/admin/users/:userId/aggregator-subscription
Auth: Admin only
```

**Request:**
```json
{
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.000Z",
  "notes": "Annual subscription - invoice #123"
}
```

**Response:**
```json
{
  "userId": "...",
  "accountId": "AGG-000001",
  "aggregatorSubscription": {
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-12-31T23:59:59.000Z",
    "notes": "Annual subscription - invoice #123",
    "managedBy": "<adminId>"
  },
  "isCurrentlyActive": true
}
```

**Rules:**
- Only works for users with `userType === aggregator`
- `endDate` must be after `startDate`
- Admin can update anytime — simply call same endpoint again with new dates

### Where to show in Admin UI

User Management → aggregator user → 3-dot menu → **"Manage Subscription"** modal:
- Start Date picker
- End Date picker
- Notes (optional)
- Save button → calls `PATCH /v1/admin/users/:userId/aggregator-subscription`

### Where to show in App (Aggregator side)

Instead of plan cards, show a status card:
```
Your Subscription
─────────────────────────────────
Status:       Active  ●
Started:      1 Jan 2026
Expires:      31 Dec 2026
Days Left:    278

Contact support to renew your subscription.
─────────────────────────────────
```

Use `GET /v1/subscription/my-subscription` → `aggregatorSubscription` object.

---

## Admin Plan Management APIs

```
GET    /v1/admin/plans                       — All plans (active + inactive)
GET    /v1/admin/plans?targetType=artist     — Filter by targetType
GET    /v1/admin/plans?includeInactive=true  — Include deactivated plans
POST   /v1/admin/plans                       — Create new plan
GET    /v1/admin/plans/:planId               — Plan detail + subscriber count + revenue
PUT    /v1/admin/plans/:planId               — Update plan
DELETE /v1/admin/plans/:planId               — Delete (blocked if active subscribers exist)
PATCH  /v1/admin/plans/:planId/activate      — Activate plan
PATCH  /v1/admin/plans/:planId/deactivate    — Deactivate plan
GET    /v1/admin/subscribers                 — All active subscribers list
```

### Create Plan — Body
```json
{
  "planId": "artist_pro",
  "name": "Pro",
  "description": "Description here",
  "targetType": "artist",
  "price": { "current": 1299, "original": 1999 },
  "currency": "INR",
  "interval": "year",
  "intervalCount": 1,
  "displayOrder": 2,
  "isPopular": true,
  "isBestValue": false,
  "showcaseFeatures": [
    { "text": "Unlimited Releases", "included": true },
    { "text": "80% Revenue Share", "included": true },
    { "text": "Dolby Atmos", "included": false }
  ],
  "features": {
    "unlimitedReleases": true,
    "youtubeContentId": true,
    "revenueShare": { "percentage": 80 }
  },
  "trial": { "enabled": false, "days": 0 },
  "discount": { "enabled": false, "percentage": 0 }
}
```

**`planId` rules:** lowercase letters, numbers, underscores only. e.g. `artist_pro`, `label_gold_2026`

**`targetType` values:** `everyone` | `artist` | `label`

**`showcaseFeatures`:** what shows on the pricing card. `included: false` renders as a crossed-out / greyed-out feature. Admin controls this list entirely.

### Get Subscribers
```
GET /v1/admin/subscribers?page=1&limit=20&planId=artist_popular&search=john
Auth: Admin + Team
```

**Response:**
```json
{
  "subscribers": [
    {
      "_id": "...",
      "accountId": "ART-000042",
      "name": "John Doe",
      "emailAddress": "john@example.com",
      "userType": "artist",
      "subscription": {
        "planId": "artist_popular",
        "status": "active",
        "validFrom": "2026-03-01T...",
        "validUntil": "2027-03-01T...",
        "autoRenewal": false
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalSubscribers": 5,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

## Admin Subscription Plans Page — Tab Structure

```
/admin/subscription-plans

Tab 1: For Everyone  →  GET /v1/admin/plans?targetType=everyone
Tab 2: For Artists   →  GET /v1/admin/plans?targetType=artist
Tab 3: For Labels    →  GET /v1/admin/plans?targetType=label
Tab 4: Subscribers   →  GET /v1/admin/subscribers
```

Each plan card in tabs 1-3 shows:
- Name, description, price, targetType badge
- `isPopular` / `isBestValue` toggle
- `showcaseFeatures` list (editable)
- Activate / Deactivate button
- Edit button

---

## Email Verification

Already fully implemented in backend. Frontend just needs to wire it.

### Flow
```
1. User registers  →  backend sends email with 6-digit code
2. Frontend shows "Enter the code from your email" screen
3. POST /v1/auth/verify-email  →  email verified
```

### Register Response
Registration returns `isEmailVerified: false`. Frontend should redirect to the verify-email screen immediately after signup.

### Verify Email
```
POST /v1/auth/verify-email
Auth: Not required
```

**Request:**
```json
{
  "token": "abc123def456...",
  "code": "847291"
}
```

> `token` comes from the URL query param: `?token=xxx` (in the verification email link)
> `code` is the 6-digit number the user enters manually

**Response (success):**
```json
{
  "user": {
    "_id": "...",
    "accountId": "ART-000001",
    "emailAddress": "user@example.com",
    "isEmailVerified": true
  }
}
```

**Errors:**
```json
{ "message": "Invalid or expired verification token" }   // 400 — token wrong or expired (24hr TTL)
{ "message": "Invalid verification code" }               // 400 — code mismatch
```

### Resend Verification Code
```
POST /v1/auth/resend-verification
Auth: Not required
```

**Request:**
```json
{ "emailAddress": "user@example.com" }
```

> Always returns 200 (even if email not found — security)

### Where to add in signup flow

```
Step 1: Account type (artist / label)
Step 2: Form fill
Step 3: Plan select (fetch plans by userType)   ← NEW
Step 4: Verify email (code entry screen)         ← ADD THIS
Step 5: Payment
```

**Signup flow note for aggregators:** No plan selection step. After email verify, show a "Your account is under review" screen. Admin will set subscription dates manually.

---

## Feature Flags Reference

These are the `features` boolean flags used for access control (not for display — use `showcaseFeatures` for display):

| Flag | Meaning |
|------|---------|
| `unlimitedReleases` | No cap on number of releases |
| `unlimitedArtists` | Multiple artist profiles (label plans) |
| `singleLabel` | One label profile |
| `ownership100` | 100% ownership retained |
| `artistProfile` | Can create artist profile |
| `collaborateWithOthers` | Can add collaborators |
| `revenueShare.percentage` | Revenue % (70 / 80 / 95 / 90) |
| `youtubeContentId` | YouTube Content ID |
| `metaContentId` | Meta/Instagram Content ID |
| `tiktokContentId` | TikTok Content ID |
| `youtubeOac` | YouTube Official Artist Channel |
| `analyticsCenter` | Full analytics dashboard |
| `dolbyAtmos` | Dolby Atmos distribution |
| `spotifyDiscoveryMode` | Spotify Discovery Mode |
| `available150Stores` | Distribution to 150+ stores |
| `worldwideAvailability` | Global distribution |
| `freeUpcCode` | Free UPC code per release |
| `freeIsrcCode` | Free ISRC code per track |
| `lifetimeAvailability` | Music stays on platforms forever |
| `supportHours` | `24_hours` / `48_hours` / `72_hours` |
| `liveSupport` | Live chat support |
| `royaltyClaimCentre` | Royalty claim feature |
| `playlistPitching` | Playlist pitching access |
| `mahiAi` | Mahi AI feature |
| `youtubeMcnAccess` | YouTube MCN access |

---

## Complete API Reference

### User-Facing
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/v1/subscription/plans` | ❌ | All active plans |
| GET | `/v1/subscription/plans?targetType=artist` | ❌ | Filter by type |
| GET | `/v1/subscription/plans/:planId` | ❌ | Single plan detail |
| POST | `/v1/subscription/create-payment-intent` | ✅ | Start payment |
| POST | `/v1/subscription/verify-payment` | ✅ | Verify + activate |
| POST | `/v1/subscription/payment-failed` | ✅ | Record failure |
| GET | `/v1/subscription/payment-status/:orderId` | ✅ | Check status |
| GET | `/v1/subscription/my-subscription` | ✅ | My plan + aggregator dates |
| GET | `/v1/subscription/payment-history` | ✅ | Payment history |
| POST | `/v1/subscription/cancel-subscription` | ✅ | Cancel |
| POST | `/v1/auth/verify-email` | ❌ | Verify email (token + code) |
| POST | `/v1/auth/resend-verification` | ❌ | Resend code |

### Admin-Facing
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/v1/admin/plans` | Admin + Team | All plans |
| POST | `/v1/admin/plans` | Admin + Team | Create plan |
| GET | `/v1/admin/plans/:planId` | Admin + Team | Plan detail + analytics |
| PUT | `/v1/admin/plans/:planId` | Admin + Team | Update plan |
| DELETE | `/v1/admin/plans/:planId` | Admin + Team | Delete plan |
| PATCH | `/v1/admin/plans/:planId/activate` | Admin + Team | Activate |
| PATCH | `/v1/admin/plans/:planId/deactivate` | Admin + Team | Deactivate |
| GET | `/v1/admin/subscribers` | Admin + Team | Active subscribers |
| PATCH | `/v1/admin/users/:userId/aggregator-subscription` | Admin only | Set aggregator dates |
