export const EApplicationEnvironment = Object.freeze({
    PRODUCTION: 'production',
    DEVELOPMENT: 'development'
});

export const EUserRole = Object.freeze({
    ADMIN: 'admin',
    USER: 'user',
    TEAM_MEMBER: 'team_member'
});

export const EUserType = Object.freeze({
    ARTIST: 'artist',
    LABEL: 'label',
    AGGREGATOR: 'aggregator'
});

export const EKYCStatus = Object.freeze({
    UNVERIFIED: 'unverified',
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
});

export const ESubscriptionStatus = Object.freeze({
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
});

export const ESubscriptionPlan = Object.freeze({
    MAHESHWARI_STANDARD: 'maheshwari_standard',
    MAHESHWARI_BEST_VALUE: 'maheshwari_best_value',
    MAHESHWARI_POPULAR: 'maheshwari_popular',
    MAHESHWARI_PREMIUM: 'maheshwari_premium'
});

export const EPaymentStatus = Object.freeze({
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
});

export const ENotificationType = Object.freeze({
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success'
});

// Release related enums
export const EReleaseType = Object.freeze({
    BASIC: 'basic',
    ADVANCE: 'advance'
});

export const ETrackType = Object.freeze({
    SINGLE: 'single',
    ALBUM: 'album'
});

export const EReleaseStatus = Object.freeze({
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    PROCESSING: 'processing',
    PUBLISHED: 'published',
    LIVE: 'live',
    REJECTED: 'rejected',
    TAKE_DOWN: 'take_down',
    UPDATE_REQUEST: 'update_request'
});

export const EMusicGenre = Object.freeze({
    BOLLYWOOD: 'bollywood',
    CLASSICAL: 'classical',
    DEVOTIONAL: 'devotional',
    FOLK: 'folk',
    GHAZAL: 'ghazal',
    HINDI_POP: 'hindi_pop',
    INSTRUMENTAL: 'instrumental',
    PUNJABI: 'punjabi',
    REGIONAL: 'regional',
    ROCK: 'rock',
    ROMANTIC: 'romantic',
    SAD: 'sad',
    SUFI: 'sufi',
    WESTERN: 'western',
    ELECTRONIC: 'electronic',
    JAZZ: 'jazz',
    BLUES: 'blues',
    COUNTRY: 'country',
    RAP_HIP_HOP: 'rap_hip_hop',
    METAL: 'metal',
    ALTERNATIVE: 'alternative',
    INDIE: 'indie',
    WORLD_MUSIC: 'world_music'
});

export const EAudioFormat = Object.freeze({
    MP3: 'mp3',
    WAV: 'wav',
    OGG: 'ogg',
    FLAC: 'flac',
    AAC: 'aac'
});

export const ETerritories = Object.freeze({
    AFGHANISTAN: 'afghanistan',
    ALBANIA: 'albania',
    ALGERIA: 'algeria',
    ARGENTINA: 'argentina',
    AUSTRALIA: 'australia',
    AUSTRIA: 'austria',
    BANGLADESH: 'bangladesh',
    BELGIUM: 'belgium',
    BRAZIL: 'brazil',
    CANADA: 'canada',
    CHINA: 'china',
    FRANCE: 'france',
    GERMANY: 'germany',
    INDIA: 'india',
    ITALY: 'italy',
    JAPAN: 'japan',
    MEXICO: 'mexico',
    NETHERLANDS: 'netherlands',
    PAKISTAN: 'pakistan',
    RUSSIA: 'russia',
    SOUTH_AFRICA: 'south_africa',
    SOUTH_KOREA: 'south_korea',
    SPAIN: 'spain',
    SWEDEN: 'sweden',
    SWITZERLAND: 'switzerland',
    UNITED_KINGDOM: 'united_kingdom',
    UNITED_STATES: 'united_states',
    WORLDWIDE: 'worldwide'
});

export const EDistributionPartners = Object.freeze({
    SPOTIFY: 'spotify',
    APPLE_MUSIC: 'apple_music',
    YOUTUBE_MUSIC: 'youtube_music',
    AMAZON_MUSIC: 'amazon_music',
    GAANA: 'gaana',
    JIOSAAVN: 'jiosaavn',
    WYNK: 'wynk',
    HUNGAMA: 'hungama',
    RESSO: 'resso',
    INSTAGRAM_REELS: 'instagram_reels',
    FACEBOOK: 'facebook',
    TIKTOK: 'tiktok',
    SNAPCHAT: 'snapchat',
    DEEZER: 'deezer',
    TIDAL: 'tidal',
    PANDORA: 'pandora',
    SOUNDCLOUD: 'soundcloud',
    BANDCAMP: 'bandcamp'
});

export const EReleaseStep = Object.freeze({
    COVER_ART_AND_INFO: 'cover_art_and_info',
    AUDIO_FILES_AND_TRACKS: 'audio_files_and_tracks',
    RELEASE_SETTINGS: 'release_settings'
});

export const ESublabelMembershipStatus = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended'
});

export const EAdvancedReleaseType = Object.freeze({
    SINGLE: 'single',
    ALBUM: 'album',
    MINI_ALBUM: 'mini_album',
    RINGTONE_RELEASE: 'ringtone_release'
});

export const EReleasePricingTier = Object.freeze({
    FRONT: 'front',
    MID: 'mid',
    BACK: 'back'
});

export const EAdvancedReleaseStep = Object.freeze({
    COVER_ART_AND_RELEASE_INFO: 'cover_art_and_release_info',
    TRACKS_AND_AUDIO: 'tracks_and_audio',
    DELIVERY_AND_RIGHTS: 'delivery_and_rights'
});

export const EMonthManagementType = Object.freeze({
    ANALYTICS: 'analytics',
    ROYALTY: 'royalty',
    BONUS: 'bonus'
});

export const EReportType = Object.freeze({
    ANALYTICS: 'analytics',
    ROYALTY: 'royalty',
    BONUS_ROYALTY: 'bonus_royalty',
    MCN: 'mcn'
});

export const EReportStatus = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
});

export const EFAQCategory = Object.freeze({
    UPLOAD_PROCESS: 'Upload Process',
    DISTRIBUTION: 'Distribution',
    ROYALTIES: 'Royalties',
    RELEASE_MANAGEMENT: 'Release Management',
    TECHNICAL_SUPPORT: 'Technical Support'
});

export const ETestimonialStatus = Object.freeze({
    DRAFT: 'draft',
    PUBLISHED: 'published'
});

export const ETrendingLabelStatus = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive'
});

export const ECompanySettingsStatus = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive'
});

export const ETeamRole = Object.freeze({
    ADMIN: 'Admin',
    CONTENT_MANAGER: 'Content Manager',
    DEVELOPER: 'Developer',
    MARKETING_HEAD: 'Marketing Head',
    SUPPORT_SPECIALIST: 'Support Specialist'
});

export const EDepartment = Object.freeze({
    MANAGEMENT: 'Management',
    CONTENT: 'Content',
    TECHNOLOGY: 'Technology',
    MARKETING: 'Marketing',
    SUPPORT: 'Support'
});

export const EModuleAccess = Object.freeze({
    USER_MANAGEMENT: 'User Management',
    ROYALTY_MANAGEMENT: 'Royalty Management',
    ANALYTICS: 'Analytics',
    FINANCIAL_REPORTS: 'Financial Reports',
    BLOG_MANAGEMENT: 'Blog Management',
    TEAM_MANAGEMENT: 'Team Management',
    RELEASE_MANAGEMENT: 'Release Management',
    MCN_MANAGEMENT: 'MCN Management',
    CONTENT_MANAGEMENT: 'Content Management',
    SUPPORT_TICKETS: 'Support Tickets',
    SYSTEM_SETTINGS: 'System Settings',
    MERCH_MANAGEMENT: 'Merch Management'
});

export const ETeamMemberStatus = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending'
});

export const ETicketCategory = Object.freeze({
    TECHNICAL: 'Technical',
    BILLING: 'Billing',
    ACCOUNT: 'Account',
    CONTENT: 'Content'
});

export const ETicketPriority = Object.freeze({
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
});

export const ETicketStatus = Object.freeze({
    OPEN: 'open',
    PENDING: 'pending',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
});
