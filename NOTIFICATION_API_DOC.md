# Notification System — API Documentation

---

## Overview

Notification system 2 types ka hai:

1. **System Notifications** — Backend events pe auto-trigger hoti hain (royalty credited, release live, etc.)
2. **Custom Notifications** — Admin manually send karta hai (specific user, all artists, all labels, ya sabko)

---

## Notification Object Structure

```json
{
  "notificationId": "NOTIF-000001",
  "type": "system",
  "category": "royalty_update",
  "title": "Royalty Credited",
  "message": "Your royalty earnings for January-26 have been updated. Amount: ₹12,500.00",
  "status": true,
  "targetType": "specific_user",
  "targetUser": "<userId>",
  "readBy": [],
  "readCount": 0,
  "metadata": {
    "releaseId": "RE-B-S-001",
    "releaseName": "My Album",
    "reportType": "royalty",
    "monthName": "January-26"
  },
  "createdBy": null,
  "isRead": false,
  "createdAt": "2026-02-01T10:00:00Z"
}
```

---

## Enums

### `type`
| Value | Description |
|-------|-------------|
| `system` | Auto-triggered by backend |
| `custom` | Admin ne manually banaya |

### `category`
| Value | Trigger |
|-------|---------|
| `royalty_update` | Royalty CSV upload ke baad |
| `bonus_royalty_update` | Bonus royalty CSV upload ke baad |
| `mcn_update` | MCN CSV upload ke baad |
| `analytics_update` | Analytics CSV upload ke baad |
| `catalog_live` | Release LIVE ho jaye |
| `catalog_takedown` | Release TAKEN_DOWN ho jaye |
| `custom` | Admin custom notification |

### `targetType`
| Value | Targets |
|-------|---------|
| `specific_user` | Ek specific user |
| `all_artists` | Sab users jinka userType === `artist` |
| `all_labels` | Sab users jinka userType === `label` |
| `all_users` | Sabhi users |

---

## User APIs

### 1. Get My Notifications

```
GET /v1/notifications
```

**Auth:** User / Admin

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |

**Response:**
```json
{
  "notifications": [
    {
      "notificationId": "NOTIF-000003",
      "type": "system",
      "category": "catalog_live",
      "title": "Your Release is Now Live!",
      "message": "\"My Album\" is now live on all platforms.",
      "status": true,
      "targetType": "specific_user",
      "isRead": false,
      "metadata": {
        "releaseId": "RE-B-S-001",
        "releaseName": "My Album"
      },
      "createdAt": "2026-02-15T09:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 35,
    "itemsPerPage": 20
  }
}
```

> **Note:** `isRead: true/false` har notification mein aayega — isi se frontend bell badge aur read/unread UI banao.

---

### 2. Get Unread Count

```
GET /v1/notifications/count
```

**Auth:** User / Admin

**Response:**
```json
{
  "unreadCount": 5
}
```

> Bell icon badge ke liye yahi use karo. Poll karte raho ya page load pe call karo.

---

### 3. Mark Single Notification as Read

```
PATCH /v1/notifications/:notificationId/read
```

**Auth:** User / Admin

**Response:**
```json
{
  "notificationId": "NOTIF-000003",
  "readCount": 1
}
```

> Idempotent hai — ek baar read karne ke baad dobara call karo toh kuch nahi badlega.

---

### 4. Mark All as Read

```
PATCH /v1/notifications/read-all
```

**Auth:** User / Admin

**Response:**
```json
{
  "markedCount": 5
}
```

> `markedCount` = kitni notifications abhi mark hui. Agar sab pehle se read thi toh `0` aayega.

---

## Admin APIs

### 1. Create Custom Notification

```
POST /v1/admin/notifications
```

**Auth:** Admin only

**Request Body:**
```json
{
  "title": "System Maintenance",
  "message": "Platform will be under maintenance on 5th March from 2 AM to 4 AM.",
  "targetType": "all_users"
}
```

**For specific user:**
```json
{
  "title": "Your KYC is Approved",
  "message": "Congratulations! Your KYC verification is complete.",
  "targetType": "specific_user",
  "targetUser": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

**`targetType` options:**
- `specific_user` — `targetUser` (userId) required
- `all_artists` — userType === artist
- `all_labels` — userType === label
- `all_users` — sabhi users

**Response:**
```json
{
  "notification": {
    "notificationId": "NOTIF-000007",
    "type": "custom",
    "category": "custom",
    "title": "System Maintenance",
    "message": "Platform will be under maintenance...",
    "status": true,
    "targetType": "all_users",
    "readCount": 0,
    "createdAt": "2026-03-03T10:00:00Z"
  }
}
```

---

### 2. Get All Notifications (Admin List)

```
GET /v1/admin/notifications
```

**Auth:** Admin + Team Member

**Query Params:**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `type` | string | `system` | Filter: `system` or `custom` |
| `category` | string | `royalty_update` | Filter by category |
| `status` | boolean | `true` | Filter: `true` (active) or `false` (disabled) |

**Response:**
```json
{
  "notifications": [
    {
      "notificationId": "NOTIF-000001",
      "type": "custom",
      "category": "custom",
      "title": "Welcome Update",
      "message": "New features are now available.",
      "status": true,
      "targetType": "all_artists",
      "readCount": 42,
      "createdBy": {
        "firstName": "Manish",
        "lastName": "Admin",
        "emailAddress": "admin@mv.com"
      },
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 50,
    "itemsPerPage": 20
  }
}
```

> `readCount` se admin dekh sakta hai kitne users ne notification padhi.

---

### 3. Get Single Notification

```
GET /v1/admin/notifications/:notificationId
```

**Auth:** Admin + Team Member

**Response:** Full notification object with `createdBy` and `targetUser` populated.

---

### 4. Toggle Notification Status

```
PATCH /v1/admin/notifications/:notificationId/status
```

**Auth:** Admin only

**Request Body:**
```json
{
  "status": false
}
```

> `status: false` karne se notification users ko dikhna band ho jaayegi.
> `status: true` karne se wapas dikhne lagegi.

**Response:**
```json
{
  "notificationId": "NOTIF-000001",
  "status": false
}
```

---

## Auto-Triggered System Notifications

Yeh notifications automatically create hoti hain — koi API call nahi karni admin ko.

| Event | Title | Message |
|-------|-------|---------|
| Royalty CSV processed | `Royalty Credited` | `Your royalty earnings for {month} have been updated. Amount: ₹{X}` |
| Bonus Royalty CSV processed | `Bonus Royalty Credited` | `Your bonus royalty earnings for {month} have been updated. Amount: ₹{X}` |
| MCN CSV processed | `MCN Royalty Credited` | `Your MCN earnings for {month} have been updated. Amount: ₹{X}` |
| Analytics CSV processed | `Analytics Updated` | `Your analytics data for {month} has been updated.` |
| Release → LIVE | `Your Release is Now Live!` | `"{releaseName}" is now live on all platforms.` |
| Release → TAKEN_DOWN | `Release Taken Down` | `"{releaseName}" has been taken down from all platforms.` |

All auto-triggered notifications are `targetType: specific_user` — only the affected user sees them.

---

## Complete API Reference

### User APIs
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/v1/notifications` | User / Admin | My notifications (paginated) |
| GET | `/v1/notifications/count` | User / Admin | Unread count for bell badge |
| PATCH | `/v1/notifications/:notificationId/read` | User / Admin | Mark single as read |
| PATCH | `/v1/notifications/read-all` | User / Admin | Mark all as read |

### Admin APIs
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/v1/admin/notifications` | Admin only | Create custom notification |
| GET | `/v1/admin/notifications` | Admin + Team | List all notifications |
| GET | `/v1/admin/notifications/:notificationId` | Admin + Team | Single notification detail |
| PATCH | `/v1/admin/notifications/:notificationId/status` | Admin only | Toggle active/inactive |

---

## UI Suggestions for Piyush

### Bell Icon (Header)
```
[🔔 5]  ← GET /v1/notifications/count on page load
```

### Notification Dropdown / Page
```
┌─────────────────────────────────────────────────┐
│  Notifications                    [Mark All Read]│
├─────────────────────────────────────────────────┤
│  🟢 Your Release is Now Live!          2 hrs ago │
│     "My Album" is now live on all platforms      │
├─────────────────────────────────────────────────┤
│  🟢 Royalty Credited                   1 day ago │
│     Your royalty for January-26: ₹12,500         │
├─────────────────────────────────────────────────┤
│  ⚪ Analytics Updated              (read) 3d ago │
│     Your analytics data for January-26 updated   │
└─────────────────────────────────────────────────┘
```

### Admin — Create Notification Page
```
Target:  [All Users ▼]  or  [Specific User → search box]
Title:   [_________________________________]
Message: [_________________________________]
         [_________________________________]

         [Send Notification]
```

### Admin — Notification List Table columns:
| # | Title | Category | Target | Read Count | Status | Date | Actions |
|---|-------|----------|--------|------------|--------|------|---------|
| NOTIF-001 | Royalty Credited | royalty_update | specific_user | 1 | Active | 01 Feb | Toggle |
| NOTIF-002 | System Update | custom | all_users | 145 | Active | 03 Mar | Toggle |
