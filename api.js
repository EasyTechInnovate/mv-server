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
  }
];


let total = 0;
for (const api of apiData) {
    total += api.endpoints.length;
}

console.log('Total APIs:', total);
