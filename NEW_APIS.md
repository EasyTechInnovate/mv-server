# New APIs

| API Name | Method | Route |
|----------|--------|-------|
| Update Profile | PATCH | `/v1/auth/profile` |
| Update Social Media | PATCH | `/v1/auth/social-media` |
| Get Sessions | GET | `/v1/auth/sessions` |
| Revoke Session | DELETE | `/v1/auth/sessions/:sessionId` |
| Revoke All Other Sessions | POST | `/v1/auth/sessions/revoke-all` |
| Edit Release (Admin) | PATCH | `/v1/admin/releases/:releaseId/edit` |
