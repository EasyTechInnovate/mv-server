const apiData = [
  {
    name: "Health Check",
    url: "/v1/health",
    description: "General server health and root checks",
    endpoints: [
      { method: "GET", path: "/v1/health", description: "Check server health status" },
      { method: "GET", path: "/v1/self", description: "Server self-check endpoint" },
      { method: "GET", path: "/", description: "API Root - welcome message and available APIs list" }
    ]
  },
  {
    name: "Authentication",
    url: "/v1/auth",
    description: "User registration, login, profile, password and KYC verification",
    endpoints: [
      { method: "GET", path: "/self", description: "Authentication service health check" },
      { method: "POST", path: "/register", description: "Register new user/label account" },
      { method: "POST", path: "/login", description: "Login with email and password" },
      { method: "POST", path: "/refresh-token", description: "Refresh access token" },
      { method: "GET", path: "/profile", description: "Get authenticated user profile" },
      { method: "PATCH", path: "/change-password", description: "Change user password" },
      { method: "POST", path: "/forgot-password", description: "Request password reset email" },
      { method: "POST", path: "/reset-password", description: "Reset password using token" },
      { method: "POST", path: "/logout", description: "Logout from current session" },
      { method: "POST", path: "/logout-all", description: "Logout from all devices" },
      { method: "POST", path: "/verify-email", description: "Verify email with token and code" },
      { method: "POST", path: "/resend-verification", description: "Resend verification email" },
      { method: "POST", path: "/admin/create", description: "Create admin user (public)" },
      { method: "POST", path: "/verify-kyc", description: "Submit KYC documents and bank details" }
    ]
  },
  {
    name: "Aggregator Management",
    url: "/v1/aggregator",
    description: "Aggregator application workflow",
    endpoints: [
      { method: "POST", path: "/apply", description: "Submit aggregator application" }
    ]
  },
  {
    name: "Basic Releases",
    url: "/v1/releases",
    description: "Release creation workflow including cover art, audio, settings and submission",
    endpoints: [
      { method: "GET", path: "/self", description: "Release service health check" },
      { method: "POST", path: "/create", description: "Create new release (single/album)" },
      { method: "PATCH", path: "/:releaseId/step1", description: "Update step 1 - cover art & release info" },
      { method: "PATCH", path: "/:releaseId/step2", description: "Update step 2 - audio files & track info" },
      { method: "PATCH", path: "/:releaseId/step3", description: "Update step 3 - release settings" },
      { method: "POST", path: "/:releaseId/submit", description: "Submit release for admin review" },
      { method: "GET", path: "/my-releases", description: "Get my releases (paginated)" },
      { method: "GET", path: "/:releaseId", description: "Get release details" },
      { method: "POST", path: "/:releaseId/request-update", description: "Request update for live release" },
      { method: "POST", path: "/:releaseId/request-takedown", description: "Request takedown of live release" },
      { method: "DELETE", path: "/:releaseId", description: "Delete release (not for live)" }
    ]
  },
  {
    name: "Subscription Management",
    url: "/v1/subscription",
    description: "Plans, payments and subscriptions",
    endpoints: [
      { method: "GET", path: "/plans", description: "Get all subscription plans" },
      { method: "GET", path: "/plans/:planId", description: "Get plan by ID" },
      { method: "POST", path: "/create-payment-intent", description: "Create payment intent" },
      { method: "POST", path: "/verify-payment", description: "Verify Razorpay payment" },
      { method: "POST", path: "/mock-verify-payment", description: "Mock payment verification (testing)" },
      { method: "GET", path: "/my-subscription", description: "Get my subscription details" },
      { method: "GET", path: "/payment-history", description: "Get payment history (paginated)" },
      { method: "POST", path: "/cancel-subscription", description: "Cancel subscription" }
    ]
  },
  {
    name: "Admin - Plan Management",
    url: "/v1/admin/plans",
    description: "Admin-only subscription plan CRUD and activation",
    endpoints: [
      { method: "GET", path: "/", description: "Get all plans (with inactive)" },
      { method: "POST", path: "/", description: "Create new plan" },
      { method: "GET", path: "/:planId", description: "Get plan details (with analytics)" },
      { method: "PUT", path: "/:planId", description: "Update existing plan" },
      { method: "DELETE", path: "/:planId", description: "Delete plan (if no active subscribers)" },
      { method: "PATCH", path: "/:planId/activate", description: "Activate plan" },
      { method: "PATCH", path: "/:planId/deactivate", description: "Deactivate plan" }
    ]
  },
  {
    name: "Admin - Analytics",
    url: "/v1/admin",
    description: "Admin revenue, user and subscription analytics",
    endpoints: [
      { method: "GET", path: "/revenue/summary", description: "Revenue summary & analytics" },
      { method: "GET", path: "/users/stats", description: "User statistics & demographics" },
      { method: "GET", path: "/subscriptions/stats", description: "Subscription statistics & growth" }
    ]
  },
  {
    name: "Admin - Aggregator Management",
    url: "/v1/admin/aggregator",
    description: "Manage aggregator applications",
    endpoints: [
      { method: "GET", path: "/applications", description: "Get all aggregator applications" },
      { method: "GET", path: "/applications/:applicationId", description: "Get application details" },
      { method: "PATCH", path: "/applications/:applicationId/review", description: "Review application" },
      { method: "POST", path: "/applications/:applicationId/create-account", description: "Create aggregator account" }
    ]
  },
  {
    name: "Admin - Release Management",
    url: "/v1/admin/releases",
    description: "Manage all user releases",
    endpoints: [
      { method: "GET", path: "/self", description: "Release service health check (admin)" },
      { method: "GET", path: "/", description: "Get all releases with filters" },
      { method: "GET", path: "/pending-reviews", description: "Get releases pending review" },
      { method: "GET", path: "/stats", description: "Release statistics by status" },
      { method: "GET", path: "/:releaseId", description: "Get release details (admin)" },
      { method: "POST", path: "/:releaseId/approve", description: "Approve release" },
      { method: "POST", path: "/:releaseId/start-processing", description: "Start processing release" },
      { method: "POST", path: "/:releaseId/publish", description: "Publish release" },
      { method: "POST", path: "/:releaseId/go-live", description: "Make release live" },
      { method: "POST", path: "/:releaseId/reject", description: "Reject release with reason" },
      { method: "POST", path: "/:releaseId/process-takedown", description: "Process takedown request" }
    ]
  },
  {
    name: "Advanced Releases",
    url: "/v1/advance-releases",
    description: "Advanced release management with comprehensive metadata",
    endpoints: [
      { method: "GET", path: "/self", description: "Advanced release service health check" },
      { method: "GET", path: "/sublabels", description: "Get user's available sublabels for label selection" },
      { method: "POST", path: "/create", description: "Create new advanced release (single, album, mini_album, ringtone_release)" },
      { method: "PATCH", path: "/:releaseId/step1", description: "Update step 1 - Cover art & release info" },
      { method: "PATCH", path: "/:releaseId/step2", description: "Update step 2 - Tracks & audio files" },
      { method: "PATCH", path: "/:releaseId/step3", description: "Update step 3 - Delivery & rights" },
      { method: "POST", path: "/:releaseId/submit", description: "Submit release for review" },
      { method: "GET", path: "/my-releases", description: "Get user's advanced releases with pagination and filters" },
      { method: "GET", path: "/:releaseId", description: "Get advanced release details" },
      { method: "DELETE", path: "/:releaseId", description: "Delete advanced release (soft delete)" },
      { method: "POST", path: "/:releaseId/request-update", description: "Request release update" },
      { method: "POST", path: "/:releaseId/request-takedown", description: "Request release takedown" }
    ]
  },
  {
    name: "Admin - Advanced Release Management",
    url: "/v1/admin/advanced-releases",
    description: "Admin management for advanced releases",
    endpoints: [
      { method: "GET", path: "/self", description: "Advanced release admin service health check" },
      { method: "GET", path: "/", description: "Get all advanced releases with filters" },
      { method: "GET", path: "/pending-reviews", description: "Get advanced releases pending review" },
      { method: "GET", path: "/stats", description: "Advanced release statistics" },
      { method: "GET", path: "/:releaseId", description: "Get advanced release details (admin)" },
      { method: "POST", path: "/:releaseId/approve", description: "Approve advanced release" },
      { method: "POST", path: "/:releaseId/start-processing", description: "Start processing advanced release" },
      { method: "POST", path: "/:releaseId/publish", description: "Publish advanced release" },
      { method: "POST", path: "/:releaseId/go-live", description: "Make advanced release live" },
      { method: "POST", path: "/:releaseId/reject", description: "Reject advanced release" },
      { method: "POST", path: "/:releaseId/process-takedown", description: "Process takedown request" },
      { method: "POST", path: "/:releaseId/provide-upc", description: "Provide UPC code for release" },
      { method: "POST", path: "/:releaseId/provide-isrc", description: "Provide ISRC code for track" }
    ]
  },
  {
    name: "Admin - Sublabels Management",
    url: "/v1/admin/sublabels",
    description: "Manage sublabels and user assignments",
    endpoints: [
      { method: "POST", path: "/", description: "Create new sublabel" },
      { method: "GET", path: "/", description: "Get all sublabels with pagination & filters" },
      { method: "GET", path: "/:id", description: "Get sublabel details with assigned users" },
      { method: "PATCH", path: "/:id", description: "Update sublabel information" },
      { method: "DELETE", path: "/:id", description: "Delete sublabel (if no users assigned)" },
      { method: "POST", path: "/:id/assign-user", description: "Assign sublabel to user" },
      { method: "POST", path: "/:id/remove-user", description: "Remove sublabel from user" },
      { method: "GET", path: "/users/:userId/sublabels", description: "Get user's assigned sublabels" },
      { method: "POST", path: "/users/:userId/sublabels", description: "Toggle user sublabels assignment" }
    ]
  },
  {
    name: "Admin - Month Management",
    url: "/v1/admin/months",
    description: "Manage months for analytics, royalty, and bonus reporting",
    endpoints: [
      { method: "POST", path: "/", description: "Create new month for specific type" },
      { method: "GET", path: "/", description: "Get all months with pagination & filters" },
      { method: "GET", path: "/stats", description: "Get month statistics by type" },
      { method: "GET", path: "/type/:type", description: "Get months by type (analytics/royalty/bonus)" },
      { method: "GET", path: "/:id", description: "Get month details by ID" },
      { method: "PATCH", path: "/:id", description: "Update month information" },
      { method: "DELETE", path: "/:id", description: "Deactivate month (soft delete)" },
      { method: "PATCH", path: "/:id/toggle-status", description: "Toggle month active status" }
    ]
  },
  {
    name: "Month Management",
    url: "/v1/months",
    description: "User access to active months for reporting",
    endpoints: [
      { method: "GET", path: "/active", description: "Get all active months grouped by type" },
      { method: "GET", path: "/type/:type/active", description: "Get active months by type" },
      { method: "GET", path: "/:id", description: "Get month details by ID (active only)" }
    ]
  },
  {
    name: "Admin - Report Management",
    url: "/v1/admin/reports",
    description: "Manage CSV report uploads and data processing for analytics, royalty, bonus, and MCN",
    endpoints: [
      { method: "POST", path: "/upload", description: "Upload CSV report file for processing" },
      { method: "GET", path: "/", description: "Get all reports with pagination & filters" },
      { method: "GET", path: "/stats", description: "Get report statistics and summary" },
      { method: "GET", path: "/month/:monthId", description: "Get all reports for specific month" },
      { method: "GET", path: "/:id", description: "Get report details by ID" },
      { method: "GET", path: "/:id/data", description: "Get processed CSV data from report" },
      { method: "DELETE", path: "/:id", description: "Delete report and associated file" }
    ]
  },
  {
    name: "Reports",
    url: "/v1/reports",
    description: "User access to view processed report data",
    endpoints: [
      { method: "GET", path: "/available", description: "Get available completed reports" },
      { method: "GET", path: "/type/:reportType", description: "Get reports by type (analytics/royalty/bonus_royalty/mcn)" },
      { method: "GET", path: "/month/:monthId", description: "Get all reports for specific month" },
      { method: "GET", path: "/:id/summary", description: "Get report summary and statistics" },
      { method: "GET", path: "/:id/data", description: "Get paginated report data with search/sort" },
      { method: "GET", path: "/:id/search", description: "Search within report data" }
    ]
  },
  {
    name: "FAQ",
    url: "/v1/faqs",
    description: "Public access to frequently asked questions organized by categories",
    endpoints: [
      { method: "GET", path: "/self", description: "FAQ service health check" },
      { method: "GET", path: "/", description: "Get all active FAQs grouped by category" },
      { method: "GET", path: "/categories", description: "Get all available FAQ categories" }
    ]
  },
  {
    name: "Admin - FAQ Management",
    url: "/v1/admin/faqs",
    description: "Admin management of FAQs with full CRUD operations",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin FAQ service health check" },
      { method: "POST", path: "/", description: "Create new FAQ" },
      { method: "GET", path: "/", description: "Get all FAQs with pagination and filtering" },
      { method: "GET", path: "/:faqId", description: "Get FAQ details by ID" },
      { method: "PUT", path: "/:faqId", description: "Update existing FAQ" },
      { method: "DELETE", path: "/:faqId", description: "Delete FAQ" }
    ]
  },
  {
    name: "Testimonials",
    url: "/v1/testimonials",
    description: "Public access to customer testimonials and reviews",
    endpoints: [
      { method: "GET", path: "/self", description: "Testimonial service health check" },
      { method: "GET", path: "/", description: "Get published testimonials with optional rating filter" },
      { method: "GET", path: "/featured", description: "Get featured testimonials (4+ rating)" },
      { method: "GET", path: "/by-rating", description: "Get testimonials grouped by rating" }
    ]
  },
  {
    name: "Admin - Testimonial Management",
    url: "/v1/admin/testimonials",
    description: "Admin management of customer testimonials with full CRUD operations",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin testimonial service health check" },
      { method: "POST", path: "/", description: "Create new testimonial" },
      { method: "GET", path: "/", description: "Get all testimonials with pagination and filtering" },
      { method: "GET", path: "/stats", description: "Get testimonial statistics and rating distribution" },
      { method: "GET", path: "/:testimonialId", description: "Get testimonial details by ID" },
      { method: "PUT", path: "/:testimonialId", description: "Update existing testimonial" },
      { method: "DELETE", path: "/:testimonialId", description: "Delete testimonial" }
    ]
  },
  {
    name: "Trending Labels",
    url: "/v1/trending-labels",
    description: "Public access to trending music labels and their statistics",
    endpoints: [
      { method: "GET", path: "/self", description: "Trending label service health check" },
      { method: "GET", path: "/active", description: "Get active trending labels with sorting options" },
      { method: "GET", path: "/top", description: "Get top 5 trending labels by monthly streams" },
      { method: "GET", path: "/stats", description: "Get aggregate statistics for all active labels" },
      { method: "GET", path: "/categories", description: "Get trending labels categorized by streams, releases, artists" }
    ]
  },
  {
    name: "Admin - Trending Label Management",
    url: "/v1/trending-labels/admin",
    description: "Admin management of trending labels with full CRUD operations",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin trending label service health check" },
      { method: "POST", path: "/", description: "Create new trending label" },
      { method: "GET", path: "/", description: "Get all trending labels with pagination and sorting" },
      { method: "GET", path: "/stats", description: "Get trending label statistics and top performers" },
      { method: "GET", path: "/:labelId", description: "Get trending label details by ID" },
      { method: "PATCH", path: "/:labelId", description: "Update existing trending label" },
      { method: "DELETE", path: "/:labelId", description: "Delete trending label" }
    ]
  },
  {
    name: "Trending Artists",
    url: "/v1/trending-artists",
    description: "Public access to trending music artists and their performance statistics",
    endpoints: [
      { method: "GET", path: "/self", description: "Trending artist service health check" },
      { method: "GET", path: "/active", description: "Get active trending artists with sorting options" },
      { method: "GET", path: "/top", description: "Get top 5 trending artists by monthly streams" },
      { method: "GET", path: "/stats", description: "Get aggregate statistics for all active artists" },
      { method: "GET", path: "/categories", description: "Get trending artists categorized by streams and releases" }
    ]
  },
  {
    name: "Admin - Trending Artist Management",
    url: "/v1/trending-artists/admin",
    description: "Admin management of trending artists with full CRUD operations",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin trending artist service health check" },
      { method: "POST", path: "/", description: "Create new trending artist" },
      { method: "GET", path: "/", description: "Get all trending artists with pagination, search and sorting" },
      { method: "GET", path: "/stats", description: "Get trending artist statistics and top performers" },
      { method: "GET", path: "/:artistId", description: "Get trending artist details by ID" },
      { method: "PATCH", path: "/:artistId", description: "Update existing trending artist" },
      { method: "DELETE", path: "/:artistId", description: "Delete trending artist" }
    ]
  },
  {
    name: "Admin - User Management",
    url: "/v1/admin/users",
    description: "Admin user management and analytics",
    endpoints: [
      { method: "GET", path: "/", description: "Get all users with search, filtering and pagination" },
      { method: "GET", path: "/analytics/self", description: "Admin analytics service health check" }
    ]
  },
  {
    name: "Admin - Team Member Management",
    url: "/v1/admin/team-members",
    description: "Admin management of team members with invitations, roles, and permissions",
    endpoints: [
      { method: "POST", path: "/invite", description: "Invite new team member" },
      { method: "GET", path: "/", description: "Get all team members with pagination and filtering" },
      { method: "GET", path: "/stats", description: "Get team member statistics" },
      { method: "GET", path: "/:teamMemberId", description: "Get team member details by ID" },
      { method: "PUT", path: "/:teamMemberId", description: "Update team member information" },
      { method: "PATCH", path: "/:teamMemberId/status", description: "Update team member status (active/inactive)" },
      { method: "POST", path: "/:teamMemberId/resend-invitation", description: "Resend invitation to team member" },
      { method: "DELETE", path: "/:teamMemberId", description: "Delete team member (soft delete)" }
    ]
  },
  {
    name: "Team Member",
    url: "/v1/team-members",
    description: "Team member self-service endpoints for profile and account management",
    endpoints: [
      { method: "GET", path: "/self", description: "Team member service health check" },
      { method: "POST", path: "/accept-invitation", description: "Accept team member invitation" },
      { method: "GET", path: "/invitation/:invitationToken", description: "Get invitation details" },
      { method: "GET", path: "/profile", description: "Get team member profile" },
      { method: "PUT", path: "/profile", description: "Update team member profile" },
      { method: "PATCH", path: "/change-password", description: "Change team member password" }
    ]
  },
  {
    name: "Support Tickets",
    url: "/v1/support-tickets",
    description: "Authenticated user support ticket submission and management system",
    endpoints: [
      { method: "GET", path: "/self", description: "Support ticket service health check" },
      { method: "POST", path: "/", description: "Create new support ticket (requires authentication)" },
      { method: "GET", path: "/my-tickets", description: "Get authenticated user's tickets with pagination and filters" },
      { method: "GET", path: "/my-stats", description: "Get authenticated user's ticket statistics" },
      { method: "GET", path: "/:ticketId", description: "Get ticket details by ID (authenticated)" },
      { method: "POST", path: "/:ticketId/response", description: "Add response to ticket" },
      { method: "POST", path: "/:ticketId/rating", description: "Add satisfaction rating to ticket" }
    ]
  },
  {
    name: "Admin - Support Ticket Management",
    url: "/v1/admin/support-tickets",
    description: "Admin and team member support ticket management with full CRUD operations",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin support ticket service health check" },
      { method: "GET", path: "/", description: "Get all tickets with advanced filtering, search and pagination" },
      { method: "GET", path: "/stats", description: "Get comprehensive ticket statistics and metrics" },
      { method: "GET", path: "/analytics", description: "Get detailed ticket analytics and performance data" },
      { method: "GET", path: "/:ticketId", description: "Get ticket details by ID with full admin view" },
      { method: "PUT", path: "/:ticketId", description: "Update ticket information and status" },
      { method: "DELETE", path: "/:ticketId", description: "Delete ticket (admin only)" },
      { method: "POST", path: "/:ticketId/response", description: "Add admin response to ticket" },
      { method: "POST", path: "/:ticketId/internal-note", description: "Add internal note to ticket (admin view only)" },
      { method: "PATCH", path: "/:ticketId/assign", description: "Assign ticket to department or team member" },
      { method: "PATCH", path: "/:ticketId/escalate", description: "Escalate ticket to higher level" }
    ]
  },
  {
    name: "Reports & Analytics",
    url: "/v1/reports",
    description: "Comprehensive analytics dashboard and reporting system for streaming data, revenue, and performance metrics",
    endpoints: [
      { method: "GET", path: "/analytics/dashboard", description: "Get complete analytics dashboard in one API call - includes overview metrics, time series charts, top tracks, platform/country distribution, audience insights, and revenue breakdown. Supports timeframe filtering (last 7 days to 1 year) and customizable limits for tracks and countries." },
      { method: "GET", path: "/royalty/dashboard", description: "Get complete royalty management dashboard in one API call - includes total earnings (regular + bonus), this month money, monthly trends, composition analysis, performance metrics (average monthly, best month, growth rate), platform revenue breakdown, and top earning tracks for both regular and bonus royalties. Supports timeframe filtering and custom date ranges." }
    ]
  },
  {
    name: "Company Settings",
    url: "/v1/company-settings",
    description: "Public access to company information for website display",
    endpoints: [
      { method: "GET", path: "/self", description: "Company settings service health check" },
      { method: "GET", path: "/", description: "Get complete company settings (social media + contact info)" },
      { method: "GET", path: "/social-media", description: "Get social media links only" },
      { method: "GET", path: "/contact", description: "Get contact information only" },
      { method: "GET", path: "/youtube-links", description: "Get YouTube dashboard links array" }
    ]
  },
  {
    name: "Admin - Company Settings Management",
    url: "/v1/admin/company-settings",
    description: "Admin management of company information with full CRUD operations",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin company settings service health check" },
      { method: "POST", path: "/", description: "Create initial company settings" },
      { method: "GET", path: "/", description: "Get company settings for admin" },
      { method: "GET", path: "/setup-status", description: "Check if company setup is complete" },
      { method: "GET", path: "/:settingsId", description: "Get company settings by ID" },
      { method: "PUT", path: "/:settingsId", description: "Update company settings" },
      { method: "DELETE", path: "/:settingsId", description: "Delete company settings" },
      { method: "POST", path: "/:settingsId/youtube-links", description: "Add YouTube link to dashboard" },
      { method: "DELETE", path: "/:settingsId/youtube-links/:linkIndex", description: "Remove YouTube link from dashboard" }
    ]
  },
  {
    name: "MCN Management",
    url: "/v1/mcn",
    description: "Multi-Channel Network (MCN) application and management system for YouTube channels",
    endpoints: [
      { method: "GET", path: "/self", description: "MCN service health check" },
      { method: "POST", path: "/request", description: "Submit MCN application request with YouTube channel details" },
      { method: "GET", path: "/my-requests", description: "Get user's MCN requests with pagination and filtering" },
      { method: "GET", path: "/my-requests/:requestId", description: "Get specific MCN request details" },
      { method: "GET", path: "/my-channels", description: "Get user's approved MCN channels" },
      { method: "GET", path: "/my-channels/:channelId", description: "Get specific MCN channel details" },
      { method: "POST", path: "/my-requests/:requestId/request-removal", description: "Request removal from MCN network" },
      { method: "GET", path: "/my-stats", description: "Get user's MCN statistics and metrics" }
    ]
  },
  {
    name: "Admin - MCN Management",
    url: "/v1/mcn/admin",
    description: "Admin management of MCN applications, channel creation, and network oversight",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin MCN service health check" },
      { method: "GET", path: "/requests", description: "Get all MCN requests with advanced filtering and search" },
      { method: "GET", path: "/requests/pending", description: "Get pending MCN requests for review" },
      { method: "GET", path: "/requests/:requestId", description: "Get detailed MCN request information" },
      { method: "POST", path: "/requests/:requestId/review", description: "Approve or reject MCN application with admin notes" },
      { method: "POST", path: "/requests/:requestId/create-channel", description: "Create MCN channel after approval with revenue share setup" },
      { method: "POST", path: "/requests/:requestId/process-removal", description: "Process channel removal requests" },
      { method: "GET", path: "/channels", description: "Get all MCN channels with filtering by manager, status, etc." },
      { method: "GET", path: "/channels/:channelId", description: "Get detailed MCN channel information" },
      { method: "PUT", path: "/channels/:channelId", description: "Update MCN channel details and revenue information" },
      { method: "PATCH", path: "/channels/:channelId/status", description: "Update channel status (active/suspended/inactive)" },
      { method: "DELETE", path: "/channels/:channelId", description: "Delete MCN channel (admin only)" },
      { method: "GET", path: "/stats", description: "Get comprehensive MCN statistics, revenue metrics, and analytics" }
    ]
  },
  {
    name: "Marketing Management",
    url: "/v1/marketing",
    description: "Music marketing services including sync licensing and playlist pitching submissions",
    endpoints: [
      { method: "GET", path: "/self", description: "Marketing service health check" },
      { method: "POST", path: "/sync/submit", description: "Submit sync licensing request with track details and project suitability" },
      { method: "POST", path: "/playlist-pitching/submit", description: "Submit playlist pitching request for streaming platforms" },
      { method: "GET", path: "/sync/my-submissions", description: "Get user's sync submissions with pagination and filtering" },
      { method: "GET", path: "/playlist-pitching/my-submissions", description: "Get user's playlist pitching submissions" },
      { method: "GET", path: "/sync/my-submissions/:submissionId", description: "Get specific sync submission details" },
      { method: "GET", path: "/playlist-pitching/my-submissions/:submissionId", description: "Get specific playlist pitching submission details" },
      { method: "GET", path: "/my-stats", description: "Get user's marketing submission statistics" }
    ]
  },
  {
    name: "Admin - Marketing Management",
    url: "/v1/marketing/admin",
    description: "Admin management of sync licensing and playlist pitching submissions with review capabilities",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin marketing service health check" },
      { method: "GET", path: "/sync/submissions", description: "Get all sync submissions with advanced filtering and search" },
      { method: "GET", path: "/playlist-pitching/submissions", description: "Get all playlist pitching submissions" },
      { method: "GET", path: "/sync/submissions/pending", description: "Get pending sync submissions for review" },
      { method: "GET", path: "/playlist-pitching/submissions/pending", description: "Get pending playlist pitching submissions" },
      { method: "GET", path: "/sync/submissions/:submissionId", description: "Get detailed sync submission information" },
      { method: "GET", path: "/playlist-pitching/submissions/:submissionId", description: "Get detailed playlist pitching submission" },
      { method: "POST", path: "/sync/submissions/:submissionId/review", description: "Approve or reject sync submission with admin notes" },
      { method: "POST", path: "/playlist-pitching/submissions/:submissionId/review", description: "Approve or reject playlist pitching submission" },
      { method: "GET", path: "/playlist-pitching/submissions/store/:store", description: "Get playlist pitching submissions by streaming platform" },
      { method: "GET", path: "/stats", description: "Get comprehensive marketing statistics and submission metrics" }
    ]
  },
  {
    name: "Fan Link Builder",
    url: "/v1/fan-links",
    description: "Create and manage custom fan link pages with multiple platform links and analytics tracking",
    endpoints: [
      { method: "GET", path: "/self", description: "Fan Link Builder service health check" },
      { method: "POST", path: "/create", description: "Create new fan link with custom URL and platform links" },
      { method: "GET", path: "/my-links", description: "Get user's fan links with pagination, filtering, and search" },
      { method: "GET", path: "/my-links/:fanLinkId", description: "Get specific fan link details by ID" },
      { method: "PUT", path: "/my-links/:fanLinkId", description: "Update fan link title, description, URL, or platform links" },
      { method: "DELETE", path: "/my-links/:fanLinkId", description: "Delete fan link permanently" },
      { method: "GET", path: "/my-stats", description: "Get user's fan link statistics including clicks and performance" },
      { method: "GET", path: "/check-availability/:customUrl", description: "Check if custom URL is available for use" },
      { method: "GET", path: "/link/:customUrl", description: "Get fan link by custom URL (public endpoint with click tracking)" }
    ]
  },
  {
    name: "MV Production",
    url: "/v1/mv-production",
    description: "Music video production budget requests - users submit proposals, admin approves/rejects",
    endpoints: [
      { method: "GET", path: "/self", description: "MV Production service health check" },
      { method: "POST", path: "/", description: "Submit MV Production budget request with project details" },
      { method: "GET", path: "/", description: "Get user's own MV Production requests with pagination" },
      { method: "GET", path: "/:productionId", description: "Get specific MV Production request by ID" },
      { method: "PATCH", path: "/:productionId", description: "Update MV Production request (only if pending)" },
      { method: "DELETE", path: "/:productionId", description: "Delete MV Production request (only if pending)" },
      { method: "GET", path: "/admin/self", description: "Admin MV Production service health check" },
      { method: "GET", path: "/admin", description: "Get all MV Production requests with filtering and pagination" },
      { method: "GET", path: "/admin/stats", description: "Get MV Production statistics (pending, accepted, rejected counts)" },
      { method: "GET", path: "/admin/:productionId", description: "Get MV Production request details (admin)" },
      { method: "PATCH", path: "/admin/:productionId", description: "Update MV Production request (admin)" },
      { method: "PATCH", path: "/admin/:productionId/status", description: "Update MV Production status - approve or reject" },
      { method: "DELETE", path: "/admin/:productionId", description: "Delete MV Production request (admin)" }
    ]
  },
  {
    name: "Merch Store",
    url: "/v1/merch-store",
    description: "Artist merchandise store applications - submit designs, admin approval workflow with two-phase process (application approval → design submission → design approval)",
    endpoints: [
      { method: "GET", path: "/self", description: "Merch Store service health check" },
      { method: "POST", path: "/", description: "Submit new merch store application with artist info, product preferences, marketing plan, and legal consents" },
      { method: "GET", path: "/", description: "Get user's merch store applications with pagination, filtering, and search" },
      { method: "GET", path: "/:storeId", description: "Get specific merch store application by ID" },
      { method: "PATCH", path: "/:storeId", description: "Update merch store application (only if pending or rejected)" },
      { method: "POST", path: "/:storeId/designs", description: "Submit designs (minimum 5 required) after application approval" },
      { method: "DELETE", path: "/:storeId", description: "Delete merch store application (only if pending, rejected, or design_rejected)" },
      { method: "GET", path: "/admin/self", description: "Admin Merch Store service health check" },
      { method: "GET", path: "/admin", description: "Get all merch store applications with filtering, search, and pagination" },
      { method: "GET", path: "/admin/stats", description: "Get merch store statistics (pending, approved, rejected, design states counts)" },
      { method: "GET", path: "/admin/:storeId", description: "Get merch store application details (admin)" },
      { method: "PATCH", path: "/admin/:storeId", description: "Update merch store application (admin)" },
      { method: "PATCH", path: "/admin/:storeId/status", description: "Update merch store status - approve/reject application or approve/reject designs with admin notes" },
      { method: "DELETE", path: "/admin/:storeId", description: "Delete merch store application (admin)" }
    ]
  }
];


let total = 0;
for (const api of apiData) {
    total += api.endpoints.length;
}

console.log('Total APIs:', total);
