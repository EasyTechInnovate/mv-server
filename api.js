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
      { method: "POST", path: "/create", description: "Create new advanced release" },
      { method: "PATCH", path: "/:releaseId/step1", description: "Update step 1 - Cover art & release info" },
      { method: "PATCH", path: "/:releaseId/step2", description: "Update step 2 - Tracks & audio files" },
      { method: "PATCH", path: "/:releaseId/step3", description: "Update step 3 - Delivery & rights" },
      { method: "POST", path: "/:releaseId/submit", description: "Submit release for review" },
      { method: "GET", path: "/my-releases", description: "Get user's advanced releases" },
      { method: "GET", path: "/:releaseId", description: "Get advanced release details" },
      { method: "DELETE", path: "/:releaseId", description: "Delete advanced release" },
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
      { method: "GET", path: "/", description: "Get active trending labels with sorting options" },
      { method: "GET", path: "/top", description: "Get top 5 trending labels by monthly streams" },
      { method: "GET", path: "/stats", description: "Get aggregate statistics for all active labels" },
      { method: "GET", path: "/categories", description: "Get trending labels categorized by streams, releases, artists" }
    ]
  },
  {
    name: "Admin - Trending Label Management",
    url: "/v1/admin/trending-labels",
    description: "Admin management of trending labels with full CRUD operations",
    endpoints: [
      { method: "GET", path: "/self", description: "Admin trending label service health check" },
      { method: "POST", path: "/", description: "Create new trending label" },
      { method: "GET", path: "/", description: "Get all trending labels with pagination and sorting" },
      { method: "GET", path: "/stats", description: "Get trending label statistics and top performers" },
      { method: "GET", path: "/:labelId", description: "Get trending label details by ID" },
      { method: "PUT", path: "/:labelId", description: "Update existing trending label" },
      { method: "DELETE", path: "/:labelId", description: "Delete trending label" }
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
  }
];


let total = 0;
for (const api of apiData) {
    total += api.endpoints.length;
}

console.log('Total APIs:', total);
