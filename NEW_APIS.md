# New APIs

| API Name | Method | Route |
|----------|--------|-------|
| Update Profile | PATCH | `/v1/auth/profile` |
| Update Social Media | PATCH | `/v1/auth/social-media` |
| Get Sessions | GET | `/v1/auth/sessions` |
| Revoke Session | DELETE | `/v1/auth/sessions/:sessionId` |
| Revoke All Other Sessions | POST | `/v1/auth/sessions/revoke-all` |
| Edit Release (Admin) | PATCH | `/v1/admin/releases/:releaseId/edit` |
| Admin Create Basic Release for User | POST | `/v1/admin/releases/create-for-user` |
| Admin Create Advanced Release for User | POST | `/v1/admin/advanced-releases/create-for-user` |
| User Dashboard | GET | `/v1/dashboard/user` |
| Admin Dashboard | GET | `/v1/dashboard/admin` |

---

# Release Status Flow - Complete Documentation

## All Statuses

| Status | Meaning |
|--------|---------|
| `draft` | User is editing, release not yet submitted |
| `submitted` | User submitted for admin review |
| `under_review` | Admin approved and is reviewing |
| `processing` | Admin is processing the release |
| `published` | Release published to stores |
| `live` | Release is currently live on stores |
| `rejected` | Admin rejected the release |
| `update_request` | User requested to edit a live/published release |
| `take_down` | User requested takedown |

---

## Flow 1: Normal Release Lifecycle (Start to End)

```
User Creates Release
        |
        v
     [DRAFT]  ← User edits Step 1, Step 2, Step 3
        |
        | User calls POST /:releaseId/submit
        v
   [SUBMITTED]  ← Admin sees in pending-reviews
        |
        | Admin calls POST /:releaseId/approve
        v
  [UNDER_REVIEW]
        |
        | Admin calls POST /:releaseId/start-processing
        v
   [PROCESSING]
        |
        | Admin calls POST /:releaseId/publish
        v
   [PUBLISHED]
        |
        | Admin calls POST /:releaseId/go-live
        v
      [LIVE]  ← Release is active on stores
```

### APIs Used (User Side - Basic):
| Step | API | Method |
|------|-----|--------|
| Create Release | `/v1/releases/create` | POST |
| Update Step 1 (Cover Art & Info) | `/v1/releases/:releaseId/step1` | PATCH |
| Update Step 2 (Tracks & Audio) | `/v1/releases/:releaseId/step2` | PATCH |
| Update Step 3 (Release Settings) | `/v1/releases/:releaseId/step3` | PATCH |
| Submit for Review | `/v1/releases/:releaseId/submit` | POST |
| View My Releases | `/v1/releases/my-releases` | GET |
| View Release Detail | `/v1/releases/:releaseId` | GET |
| Delete Release | `/v1/releases/:releaseId` | DELETE |

### APIs Used (Admin Side - Basic):
| Step | API | Method |
|------|-----|--------|
| View All Releases | `/v1/admin/releases` | GET |
| Pending Reviews | `/v1/admin/releases/pending-reviews` | GET |
| View Release Detail | `/v1/admin/releases/:releaseId` | GET |
| Approve for Review | `/v1/admin/releases/:releaseId/approve` | POST |
| Start Processing | `/v1/admin/releases/:releaseId/start-processing` | POST |
| Publish | `/v1/admin/releases/:releaseId/publish` | POST |
| Go Live | `/v1/admin/releases/:releaseId/go-live` | POST |
| Reject | `/v1/admin/releases/:releaseId/reject` | POST |
| Release Stats | `/v1/admin/releases/stats` | GET |

---

## Flow 2: Edit Request (User wants to edit a LIVE/PUBLISHED release)

```
      [LIVE] or [PUBLISHED]
        |
        | User calls POST /:releaseId/request-update  (with reason & changes)
        v
  [UPDATE_REQUEST]  ← Admin sees in edit-requests
        |
        |--- Admin APPROVES edit request
        |         |
        |         | POST /admin/releases/:releaseId/approve-edit
        |         v
        |      [DRAFT]  ← Status goes back to DRAFT
        |         |
        |         | User edits Step 1, 2, 3 again
        |         | User re-submits: POST /:releaseId/submit
        |         v
        |    [SUBMITTED]  ← Goes through full approval again
        |         |
        |         v
        |    (Same flow as Flow 1: UNDER_REVIEW → PROCESSING → PUBLISHED → LIVE)
        |
        |--- Admin REJECTS edit request
                  |
                  | POST /admin/releases/:releaseId/reject-edit  (with reason)
                  v
               [LIVE]  ← Reverts back to LIVE, nothing changes
```

### APIs Used:
| Step | API | Method | Who |
|------|-----|--------|-----|
| Request Edit | `/v1/releases/:releaseId/request-update` | POST | User |
| View Edit Requests | `/v1/admin/releases/edit-requests` | GET | Admin |
| Approve Edit | `/v1/admin/releases/:releaseId/approve-edit` | POST | Admin |
| Reject Edit | `/v1/admin/releases/:releaseId/reject-edit` | POST | Admin |

---

## Flow 3: Takedown Request

```
      [LIVE] or [PUBLISHED]
        |
        | User calls POST /:releaseId/request-takedown  (with reason)
        v
    [TAKE_DOWN]  ← Admin sees takedown request
        |
        | Admin calls POST /admin/releases/:releaseId/process-takedown
        v
    isActive = false  ← Release is deactivated
```

### APIs Used:
| Step | API | Method | Who |
|------|-----|--------|-----|
| Request Takedown | `/v1/releases/:releaseId/request-takedown` | POST | User |
| Process Takedown | `/v1/admin/releases/:releaseId/process-takedown` | POST | Admin |

---

## Flow 4: Rejection

```
   [SUBMITTED] or [UNDER_REVIEW] or [PROCESSING]
        |
        | Admin calls POST /admin/releases/:releaseId/reject  (with reason)
        v
    [REJECTED]
```

---

## Flow 5: Admin Direct Edit (Any status)

Admin can edit any release directly without changing its status:

```
PATCH /v1/admin/releases/:releaseId/edit
Body: { step1: {...}, step2: {...}, step3: {...}, trackType: "..." }
```

---

## Flow 6: Admin Creates Release for User (CSV Upload)

Admin creates a release on behalf of a user. Frontend parses CSV, sends one release at a time.

```
Admin calls POST /v1/admin/releases/create-for-user
Body: { userId, trackType, step1, step2, step3 }

Release is created with:
  - All 3 steps completed
  - Status: SUBMITTED (ready for admin approval flow)
  - submittedAt: set automatically
```

Same for Advanced: `POST /v1/admin/advanced-releases/create-for-user`

---

## Audio Footprinting

Admin can save audio plagiarism check results for any release:

| API | Method |
|-----|--------|
| `/v1/admin/releases/:releaseId/audio-footprinting` | POST |
| `/v1/admin/advanced-releases/:releaseId/audio-footprinting` | POST |

---

## Advanced Release - Extra Admin APIs

| API | Method | Purpose |
|-----|--------|---------|
| `/v1/admin/advanced-releases/:releaseId/provide-upc` | POST | Admin provides UPC code |
| `/v1/admin/advanced-releases/:releaseId/provide-isrc` | POST | Admin provides ISRC for a track |
