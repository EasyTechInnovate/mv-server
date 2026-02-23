# Wallet & Transaction Flow — Frontend Documentation

---

## Overview

Wallet ka poora flow 3 parts mein hai:

1. **Auto Earnings** — Admin CSV upload karta hai → Royalty calculate hoti hai → Wallet automatically update
2. **User Payout Request** — User apni wallet se withdrawal request karta hai → Admin approve/reject/mark-paid karta hai
3. **Admin Manual Adjustment** — Admin directly credit/debit kar sakta hai kisi bhi user ki wallet mein (with reason)

---

## Part 1 — Wallet Structure (User ke liye kya dikhega)

```
GET /v1/wallet/my-wallet        → Summary card ke liye
GET /v1/wallet/my-wallet/details → Detailed breakdown ke liye
```

### `/v1/wallet/my-wallet` Response:
```json
{
  "accountId": "MV-1001",
  "totalEarnings": 50000,
  "regularRoyalty": 35000,
  "bonusRoyalty": 15000,
  "totalCommission": 5000,
  "availableBalance": 45000,
  "pendingPayout": 10000,
  "totalPaidOut": 20000,
  "withdrawableBalance": 15000,
  "lastCalculatedAt": "2026-01-31T...",
  "lastCalculatedMonth": "January 2026",
  "hasBalance": true,
  "canWithdraw": true
}
```

### Balance Formula (auto-calculated):
```
totalEarnings      = regularRoyalty + bonusRoyalty
availableBalance   = totalEarnings - totalCommission
withdrawableBalance = availableBalance - pendingPayout - totalPaidOut
```

> **Note:** Admin manual credit/debit directly `availableBalance` aur `withdrawableBalance` ko affect karta hai. Formula bypass hota hai intentionally.

---

## Part 2 — Payout Request Flow (User → Admin)

### User Side APIs:
```
POST /v1/payout/request          → New withdrawal request create karo
GET  /v1/payout/my-requests      → Apne saare requests dekho
GET  /v1/payout/my-requests/:id  → Single request detail
```

### Admin Side APIs:
```
GET   /v1/admin/payout-requests           → All requests (filterable)
GET   /v1/admin/payout-requests/pending   → Only pending (badge count ke liye)
GET   /v1/admin/payout-requests/stats     → Stats summary
GET   /v1/admin/payout-requests/:requestId → Single request + user wallet snapshot
PATCH /v1/admin/payout-requests/:requestId/approve    → Approve
PATCH /v1/admin/payout-requests/:requestId/reject     → Reject (reason required)
PATCH /v1/admin/payout-requests/:requestId/mark-paid  → Mark as Paid (transaction ref optional)
```

### Status Flow:
```
User creates request
        |
        v
    [PENDING]  ← Admin dekh sakta hai pending tab mein
        |
        |--- Admin APPROVES
        |        |
        |        v
        |    [APPROVED]  ← Payment processing
        |        |
        |        | Admin marks paid (after bank transfer)
        |        v
        |      [PAID]  ← Final state, wallet updates
        |
        |--- Admin REJECTS (reason required)
                 |
                 v
           [REJECTED]  ← Amount wallet mein wapas available
```

### What happens to wallet on each action:
| Action | Wallet Effect |
|--------|--------------|
| User creates request | `pendingPayout += amount`, `withdrawableBalance -= amount` |
| Admin approves | No wallet change (just status update) |
| Admin marks paid | `pendingPayout -= amount`, `totalPaidOut += amount` |
| Admin rejects | `pendingPayout -= amount` (amount wapas available ho jaata hai) |

---

## Part 3 — Admin Manual Wallet Adjustment

**Yahi hai jo Piyush tha pooch raha.** Admin kisi bhi user ki wallet mein directly credit ya debit kar sakta hai ek reason ke saath. Har adjustment ka full audit trail rehta hai.

### APIs:
```
GET  /v1/admin/wallets/:userId         → User ki wallet + poora adjustment history
POST /v1/admin/wallets/:userId/adjust  → Credit ya debit karo
```

### POST `/v1/admin/wallets/:userId/adjust` Body:
```json
{
  "type": "credit",
  "amount": 5000,
  "reason": "Bonus for top performer - January 2026"
}
```

```json
{
  "type": "debit",
  "amount": 2000,
  "reason": "Correction - excess amount credited by mistake"
}
```

### Validations:
- `type` must be `"credit"` or `"debit"`
- `amount` must be > 0
- `reason` is required (cannot be empty)
- For **debit**: if amount > availableBalance → error return hoga "Insufficient balance"

### Response:
```json
{
  "userId": "...",
  "userName": "Rahul Sharma",
  "adjustment": {
    "type": "credit",
    "amount": 5000,
    "reason": "Bonus for top performer",
    "balanceBefore": 15000,
    "balanceAfter": 20000
  },
  "wallet": {
    "availableBalance": 20000,
    "withdrawableBalance": 17000,
    "totalEarnings": 50000,
    "pendingPayout": 3000,
    "totalPaidOut": 0
  }
}
```

### GET `/v1/admin/wallets/:userId` Response (includes full history):
```json
{
  "user": {
    "id": "...",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "accountId": "MV-1001"
  },
  "wallet": {
    "totalEarnings": 50000,
    "regularRoyalty": 35000,
    "bonusRoyalty": 15000,
    "mcnRoyalty": 0,
    "totalCommission": 5000,
    "availableBalance": 20000,
    "pendingPayout": 3000,
    "totalPaidOut": 0,
    "withdrawableBalance": 17000,
    "lastCalculatedAt": "2026-01-31T...",
    "lastCalculatedMonth": "January 2026"
  },
  "adminAdjustments": [
    {
      "type": "credit",
      "amount": 5000,
      "reason": "Bonus for top performer",
      "adjustedBy": {
        "firstName": "Admin",
        "lastName": "User",
        "emailAddress": "admin@mv.com"
      },
      "balanceBefore": 15000,
      "balanceAfter": 20000,
      "adjustedAt": "2026-02-23T10:30:00Z"
    }
  ]
}
```

---

## UI Suggestion for Piyush

### Where to put "Adjust Wallet" button:
Piyush ne sahi socha — **User Management mein user pe modal deke**. Recommended flow:

```
Admin Panel → User Management → [User List]
                                     |
                                     | Click on user → User Detail Page/Drawer
                                     |
                                     | Tabs: Overview | Releases | Wallet | KYC
                                     |
                                     | [Wallet Tab]
                                     |    → Current Balance card
                                     |    → [+ Add Credit] button  → Modal
                                     |    → [- Debit] button       → Modal
                                     |    → Adjustment History table (neeche)
```

**OR simpler approach:** User list mein 3-dot menu → "Manage Wallet" option → Opens wallet modal with adjustment history + adjust button.

### Adjustment Modal fields:
```
Type:    [Credit ●]  [Debit ○]
Amount:  [_______]  INR
Reason:  [_________________________]
         (required, will be saved for audit)

[Cancel]  [Apply Adjustment]
```

### Adjustment History Table columns:
| Date & Time | Type | Amount | Balance Before | Balance After | Reason | Done By |
|-------------|------|--------|---------------|--------------|--------|---------|
| 23 Feb 2026, 10:30 AM | Credit 🟢 | ₹5,000 | ₹15,000 | ₹20,000 | Bonus payment | Admin Name |
| 20 Feb 2026, 3:15 PM | Debit 🔴 | ₹2,000 | ₹20,000 | ₹18,000 | Correction | Admin Name |

---

## Complete API Reference Summary

### User-facing Wallet APIs:
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/v1/wallet/my-wallet` | Summary card |
| GET | `/v1/wallet/my-wallet/details` | Detailed breakdown |

### User-facing Payout APIs:
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/v1/payout/request` | Create withdrawal request |
| GET | `/v1/payout/my-requests` | My request history |
| GET | `/v1/payout/my-requests/:requestId` | Single request detail |

### Admin Wallet & Payout APIs:
| Method | Route | Purpose | Who |
|--------|-------|---------|-----|
| GET | `/v1/admin/wallets/:userId` | View wallet + adjustment history | Admin + Team |
| POST | `/v1/admin/wallets/:userId/adjust` | Credit / Debit wallet | **Admin only** |
| GET | `/v1/admin/payout-requests` | All payout requests | Admin + Team |
| GET | `/v1/admin/payout-requests/pending` | Pending only | Admin + Team |
| GET | `/v1/admin/payout-requests/stats` | Stats | Admin + Team |
| GET | `/v1/admin/payout-requests/:requestId` | Single request + wallet snapshot | Admin + Team |
| PATCH | `/v1/admin/payout-requests/:requestId/approve` | Approve request | Admin + Team |
| PATCH | `/v1/admin/payout-requests/:requestId/reject` | Reject (reason required) | Admin + Team |
| PATCH | `/v1/admin/payout-requests/:requestId/mark-paid` | Mark as paid | Admin + Team |

---

## Important Notes for Frontend

1. **`withdrawableBalance`** is the only amount a user can actually request payout for — show this as the main "Available to Withdraw" number.

2. **`availableBalance`** = total earnings minus commission — useful for showing gross balance.

3. **Admin adjustment does NOT affect `totalEarnings`** — it only adjusts `availableBalance` directly. So after a credit adjustment, `availableBalance` may be higher than `totalEarnings - totalCommission`. This is by design (bonus payments, corrections etc).

4. **Debit guard**: Backend will reject if debit amount > availableBalance. Show the current balance in the modal so admin knows the limit.

5. **Audit trail**: Every adjustment has `adjustedBy` (admin name), `balanceBefore`, `balanceAfter`, `reason`, and `adjustedAt` — show this in the history table.
