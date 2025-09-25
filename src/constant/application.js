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

// Analytics related enums
export const EStreamingPlatform = Object.freeze({
    SPOTIFY: 'Spotify',
    YOUTUBE: 'YouTube',
    APPLE_MUSIC: 'Apple Music',
    AMAZON: 'Amazon',
    NETEASE: 'Netease',
    RESSO: 'Resso',
    YOUTUBE_MUSIC: 'YouTube Music',
    TIDAL: 'Tidal',
    DEEZER: 'Deezer',
    PANDORA: 'Pandora',
    SOUNDCLOUD: 'SoundCloud',
    JIOSAAVN: 'JioSaavn',
    WYNK: 'Wynk',
    GAANA: 'Gaana'
});

export const EUsageType = Object.freeze({
    STREAM: 'Stream',
    DOWNLOAD: 'Download',
    SUBSCRIPTION: 'Subscription',
    AD_SUPPORTED: 'Ad Supported'
});

export const EAnalyticsTimeframe = Object.freeze({
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    LAST_3_MONTHS: 'last_3_months',
    LAST_6_MONTHS: 'last_6_months',
    LAST_YEAR: 'last_year',
    CUSTOM: 'custom'
});

export const EAnalyticsMetric = Object.freeze({
    STREAMS: 'streams',
    REVENUE: 'revenue',
    LISTENERS: 'listeners',
    DOWNLOADS: 'downloads'
});

// Country mapping from CSV
export const ECountry = Object.freeze({
    AFGHANISTAN: { name: 'Afghanistan', code: 'AF' },
    ALBANIA: { name: 'Albania', code: 'AL' },
    ALGERIA: { name: 'Algeria', code: 'DZ' },
    AMERICAN_SAMOA: { name: 'American Samoa', code: 'AS' },
    ANDORRA: { name: 'Andorra', code: 'AD' },
    ANGOLA: { name: 'Angola', code: 'AO' },
    ANGUILLA: { name: 'Anguilla', code: 'AI' },
    ANTARCTICA: { name: 'Antarctica', code: 'AQ' },
    ANTIGUA_AND_BARBUDA: { name: 'Antigua and Barbuda', code: 'AG' },
    ARGENTINA: { name: 'Argentina', code: 'AR' },
    ARMENIA: { name: 'Armenia', code: 'AM' },
    ARUBA: { name: 'Aruba', code: 'AW' },
    AUSTRALIA: { name: 'Australia', code: 'AU' },
    AUSTRIA: { name: 'Austria', code: 'AT' },
    AZERBAIJAN: { name: 'Azerbaijan', code: 'AZ' },
    BAHAMAS: { name: 'Bahamas', code: 'BS' },
    BAHRAIN: { name: 'Bahrain', code: 'BH' },
    BANGLADESH: { name: 'Bangladesh', code: 'BD' },
    BARBADOS: { name: 'Barbados', code: 'BB' },
    BELARUS: { name: 'Belarus', code: 'BY' },
    BELGIUM: { name: 'Belgium', code: 'BE' },
    BELIZE: { name: 'Belize', code: 'BZ' },
    BENIN: { name: 'Benin', code: 'BJ' },
    BERMUDA: { name: 'Bermuda', code: 'BM' },
    BHUTAN: { name: 'Bhutan', code: 'BT' },
    BOLIVIA: { name: 'Bolivia, Plurinational State of', code: 'BO' },
    BONAIRE: { name: 'Bonaire, Sint Eustatius and Saba', code: 'BQ' },
    BOSNIA_AND_HERZEGOVINA: { name: 'Bosnia and Herzegovina', code: 'BA' },
    BOTSWANA: { name: 'Botswana', code: 'BW' },
    BOUVET_ISLAND: { name: 'Bouvet Island', code: 'BV' },
    BRAZIL: { name: 'Brazil', code: 'BR' },
    BRITISH_INDIAN_OCEAN_TERRITORY: { name: 'British Indian Ocean Territory', code: 'IO' },
    BRUNEI_DARUSSALAM: { name: 'Brunei Darussalam', code: 'BN' },
    BULGARIA: { name: 'Bulgaria', code: 'BG' },
    BURKINA_FASO: { name: 'Burkina Faso', code: 'BF' },
    BURUNDI: { name: 'Burundi', code: 'BI' },
    CAMBODIA: { name: 'Cambodia', code: 'KH' },
    CAMEROON: { name: 'Cameroon', code: 'CM' },
    CANADA: { name: 'Canada', code: 'CA' },
    CAPE_VERDE: { name: 'Cape Verde', code: 'CV' },
    CAYMAN_ISLANDS: { name: 'Cayman Islands', code: 'KY' },
    CENTRAL_AFRICAN_REPUBLIC: { name: 'Central African Republic', code: 'CF' },
    CHAD: { name: 'Chad', code: 'TD' },
    CHILE: { name: 'Chile', code: 'CL' },
    CHINA: { name: 'China', code: 'CN' },
    CHRISTMAS_ISLAND: { name: 'Christmas Island', code: 'CX' },
    COCOS_ISLANDS: { name: 'Cocos (Keeling) Islands', code: 'CC' },
    COLOMBIA: { name: 'Colombia', code: 'CO' },
    COMOROS: { name: 'Comoros', code: 'KM' },
    CONGO: { name: 'Congo', code: 'CG' },
    CONGO_DEMOCRATIC_REPUBLIC: { name: 'Congo, the Democratic Republic of the', code: 'CD' },
    COOK_ISLANDS: { name: 'Cook Islands', code: 'CK' },
    COSTA_RICA: { name: 'Costa Rica', code: 'CR' },
    CROATIA: { name: 'Croatia', code: 'HR' },
    CUBA: { name: 'Cuba', code: 'CU' },
    CURACAO: { name: 'Curaçao', code: 'CW' },
    CYPRUS: { name: 'Cyprus', code: 'CY' },
    CZECH_REPUBLIC: { name: 'Czech Republic', code: 'CZ' },
    COTE_DIVOIRE: { name: "Côte d'Ivoire", code: 'CI' },
    DENMARK: { name: 'Denmark', code: 'DK' },
    DJIBOUTI: { name: 'Djibouti', code: 'DJ' },
    DOMINICA: { name: 'Dominica', code: 'DM' },
    DOMINICAN_REPUBLIC: { name: 'Dominican Republic', code: 'DO' },
    ECUADOR: { name: 'Ecuador', code: 'EC' },
    EGYPT: { name: 'Egypt', code: 'EG' },
    EL_SALVADOR: { name: 'El Salvador', code: 'SV' },
    EQUATORIAL_GUINEA: { name: 'Equatorial Guinea', code: 'GQ' },
    ERITREA: { name: 'Eritrea', code: 'ER' },
    ESTONIA: { name: 'Estonia', code: 'EE' },
    ESWATINI: { name: 'Eswatini', code: 'SZ' },
    ETHIOPIA: { name: 'Ethiopia', code: 'ET' },
    FALKLAND_ISLANDS: { name: 'Falkland Islands (Malvinas)', code: 'FK' },
    FAROE_ISLANDS: { name: 'Faroe Islands', code: 'FO' },
    FIJI: { name: 'Fiji', code: 'FJ' },
    FINLAND: { name: 'Finland', code: 'FI' },
    FRANCE: { name: 'France', code: 'FR' },
    FRENCH_GUIANA: { name: 'French Guiana', code: 'GF' },
    FRENCH_POLYNESIA: { name: 'French Polynesia', code: 'PF' },
    FRENCH_SOUTHERN_TERRITORIES: { name: 'French Southern Territories', code: 'TF' },
    GABON: { name: 'Gabon', code: 'GA' },
    GAMBIA: { name: 'Gambia', code: 'GM' },
    GEORGIA: { name: 'Georgia', code: 'GE' },
    GERMANY: { name: 'Germany', code: 'DE' },
    GHANA: { name: 'Ghana', code: 'GH' },
    GIBRALTAR: { name: 'Gibraltar', code: 'GI' },
    GREECE: { name: 'Greece', code: 'GR' },
    GREENLAND: { name: 'Greenland', code: 'GL' },
    GRENADA: { name: 'Grenada', code: 'GD' },
    GUADELOUPE: { name: 'Guadeloupe', code: 'GP' },
    GUAM: { name: 'Guam', code: 'GU' },
    GUATEMALA: { name: 'Guatemala', code: 'GT' },
    GUERNSEY: { name: 'Guernsey', code: 'GG' },
    GUINEA: { name: 'Guinea', code: 'GN' },
    GUINEA_BISSAU: { name: 'Guinea-Bissau', code: 'GW' },
    GUYANA: { name: 'Guyana', code: 'GY' },
    HAITI: { name: 'Haiti', code: 'HT' },
    HEARD_ISLAND_AND_MCDONALD_ISLANDS: { name: 'Heard Island and McDonald Islands', code: 'HM' },
    HOLY_SEE: { name: 'Holy See (Vatican City State)', code: 'VA' },
    HONDURAS: { name: 'Honduras', code: 'HN' },
    HONG_KONG: { name: 'Hong Kong', code: 'HK' },
    HUNGARY: { name: 'Hungary', code: 'HU' },
    ICELAND: { name: 'Iceland', code: 'IS' },
    INDIA: { name: 'India', code: 'IN' },
    INDONESIA: { name: 'Indonesia', code: 'ID' },
    IRAN: { name: 'Iran, Islamic Republic of', code: 'IR' },
    IRAQ: { name: 'Iraq', code: 'IQ' },
    IRELAND: { name: 'Ireland', code: 'IE' },
    ISLE_OF_MAN: { name: 'Isle of Man', code: 'IM' },
    ISRAEL: { name: 'Israel', code: 'IL' },
    ITALY: { name: 'Italy', code: 'IT' },
    JAMAICA: { name: 'Jamaica', code: 'JM' },
    JAPAN: { name: 'Japan', code: 'JP' },
    JERSEY: { name: 'Jersey', code: 'JE' },
    JORDAN: { name: 'Jordan', code: 'JO' },
    KAZAKHSTAN: { name: 'Kazakhstan', code: 'KZ' },
    KENYA: { name: 'Kenya', code: 'KE' },
    KIRIBATI: { name: 'Kiribati', code: 'KI' },
    KOREA_DEMOCRATIC: { name: 'Korea, Democratic People\'s Republic of', code: 'KP' },
    KOREA_REPUBLIC: { name: 'Korea, Republic of', code: 'KR' },
    KUWAIT: { name: 'Kuwait', code: 'KW' },
    KYRGYZSTAN: { name: 'Kyrgyzstan', code: 'KG' },
    LAO: { name: 'Lao People\'s Democratic Republic', code: 'LA' },
    LATVIA: { name: 'Latvia', code: 'LV' },
    LEBANON: { name: 'Lebanon', code: 'LB' },
    LESOTHO: { name: 'Lesotho', code: 'LS' },
    LIBERIA: { name: 'Liberia', code: 'LR' },
    LIBYA: { name: 'Libya', code: 'LY' },
    LIECHTENSTEIN: { name: 'Liechtenstein', code: 'LI' },
    LITHUANIA: { name: 'Lithuania', code: 'LT' },
    LUXEMBOURG: { name: 'Luxembourg', code: 'LU' },
    MACAO: { name: 'Macao', code: 'MO' },
    MACEDONIA: { name: 'Macedonia, the Former Yugoslav Republic of', code: 'MK' },
    MADAGASCAR: { name: 'Madagascar', code: 'MG' },
    MALAWI: { name: 'Malawi', code: 'MW' },
    MALAYSIA: { name: 'Malaysia', code: 'MY' },
    MALDIVES: { name: 'Maldives', code: 'MV' },
    MALI: { name: 'Mali', code: 'ML' },
    MALTA: { name: 'Malta', code: 'MT' },
    MARSHALL_ISLANDS: { name: 'Marshall Islands', code: 'MH' },
    MARTINIQUE: { name: 'Martinique', code: 'MQ' },
    MAURITANIA: { name: 'Mauritania', code: 'MR' },
    MAURITIUS: { name: 'Mauritius', code: 'MU' },
    MAYOTTE: { name: 'Mayotte', code: 'YT' },
    MEXICO: { name: 'Mexico', code: 'MX' },
    MICRONESIA: { name: 'Micronesia, Federated States of', code: 'FM' },
    MOLDOVA: { name: 'Moldova, Republic of', code: 'MD' },
    MONACO: { name: 'Monaco', code: 'MC' },
    MONGOLIA: { name: 'Mongolia', code: 'MN' },
    MONTENEGRO: { name: 'Montenegro', code: 'ME' },
    MONTSERRAT: { name: 'Montserrat', code: 'MS' },
    MOROCCO: { name: 'Morocco', code: 'MA' },
    MOZAMBIQUE: { name: 'Mozambique', code: 'MZ' },
    MYANMAR: { name: 'Myanmar', code: 'MM' },
    NAMIBIA: { name: 'Namibia', code: 'NA' },
    NAURU: { name: 'Nauru', code: 'NR' },
    NEPAL: { name: 'Nepal', code: 'NP' },
    NETHERLANDS: { name: 'Netherlands', code: 'NL' },
    NEW_CALEDONIA: { name: 'New Caledonia', code: 'NC' },
    NEW_ZEALAND: { name: 'New Zealand', code: 'NZ' },
    NICARAGUA: { name: 'Nicaragua', code: 'NI' },
    NIGER: { name: 'Niger', code: 'NE' },
    NIGERIA: { name: 'Nigeria', code: 'NG' },
    NIUE: { name: 'Niue', code: 'NU' },
    NORFOLK_ISLAND: { name: 'Norfolk Island', code: 'NF' },
    NORTHERN_MARIANA_ISLANDS: { name: 'Northern Mariana Islands', code: 'MP' },
    NORWAY: { name: 'Norway', code: 'NO' },
    OMAN: { name: 'Oman', code: 'OM' },
    PAKISTAN: { name: 'Pakistan', code: 'PK' },
    PALAU: { name: 'Palau', code: 'PW' },
    PALESTINE: { name: 'Palestine, State of', code: 'PS' },
    PANAMA: { name: 'Panama', code: 'PA' },
    PAPUA_NEW_GUINEA: { name: 'Papua New Guinea', code: 'PG' },
    PARAGUAY: { name: 'Paraguay', code: 'PY' },
    PERU: { name: 'Peru', code: 'PE' },
    PHILIPPINES: { name: 'Philippines', code: 'PH' },
    PITCAIRN: { name: 'Pitcairn', code: 'PN' },
    POLAND: { name: 'Poland', code: 'PL' },
    PORTUGAL: { name: 'Portugal', code: 'PT' },
    PUERTO_RICO: { name: 'Puerto Rico', code: 'PR' },
    QATAR: { name: 'Qatar', code: 'QA' },
    ROMANIA: { name: 'Romania', code: 'RO' },
    RUSSIAN_FEDERATION: { name: 'Russian Federation', code: 'RU' },
    RWANDA: { name: 'Rwanda', code: 'RW' },
    REUNION: { name: 'Réunion', code: 'RE' },
    SAINT_BARTHELEMY: { name: 'Saint Barthélemy', code: 'BL' },
    SAINT_HELENA: { name: 'Saint Helena, Ascension and Tristan da Cunha', code: 'SH' },
    SAINT_KITTS_AND_NEVIS: { name: 'Saint Kitts and Nevis', code: 'KN' },
    SAINT_LUCIA: { name: 'Saint Lucia', code: 'LC' },
    SAINT_MARTIN: { name: 'Saint Martin (French part)', code: 'MF' },
    SAINT_PIERRE_AND_MIQUELON: { name: 'Saint Pierre and Miquelon', code: 'PM' },
    SAINT_VINCENT_AND_THE_GRENADINES: { name: 'Saint Vincent and the Grenadines', code: 'VC' },
    SAMOA: { name: 'Samoa', code: 'WS' },
    SAN_MARINO: { name: 'San Marino', code: 'SM' },
    SAO_TOME_AND_PRINCIPE: { name: 'Sao Tome and Principe', code: 'ST' },
    SAUDI_ARABIA: { name: 'Saudi Arabia', code: 'SA' },
    SENEGAL: { name: 'Senegal', code: 'SN' },
    SERBIA: { name: 'Serbia', code: 'RS' },
    SEYCHELLES: { name: 'Seychelles', code: 'SC' },
    SIERRA_LEONE: { name: 'Sierra Leone', code: 'SL' },
    SINGAPORE: { name: 'Singapore', code: 'SG' },
    SINT_MAARTEN: { name: 'Sint Maarten (Dutch part)', code: 'SX' },
    SLOVAKIA: { name: 'Slovakia', code: 'SK' },
    SLOVENIA: { name: 'Slovenia', code: 'SI' },
    SOLOMON_ISLANDS: { name: 'Solomon Islands', code: 'SB' },
    SOMALIA: { name: 'Somalia', code: 'SO' },
    SOUTH_AFRICA: { name: 'South Africa', code: 'ZA' },
    SOUTH_GEORGIA: { name: 'South Georgia and the South Sandwich Islands', code: 'GS' },
    SOUTH_SUDAN: { name: 'South Sudan', code: 'SS' },
    SPAIN: { name: 'Spain', code: 'ES' },
    SRI_LANKA: { name: 'Sri Lanka', code: 'LK' },
    SUDAN: { name: 'Sudan', code: 'SD' },
    SURINAME: { name: 'Suriname', code: 'SR' },
    SVALBARD_AND_JAN_MAYEN: { name: 'Svalbard and Jan Mayen', code: 'SJ' },
    SWEDEN: { name: 'Sweden', code: 'SE' },
    SWITZERLAND: { name: 'Switzerland', code: 'CH' },
    SYRIAN_ARAB_REPUBLIC: { name: 'Syrian Arab Republic', code: 'SY' },
    TAIWAN: { name: 'Taiwan, Province of China', code: 'TW' },
    TAJIKISTAN: { name: 'Tajikistan', code: 'TJ' },
    TANZANIA: { name: 'Tanzania, United Republic of', code: 'TZ' },
    THAILAND: { name: 'Thailand', code: 'TH' },
    TIMOR_LESTE: { name: 'Timor-Leste', code: 'TL' },
    TOGO: { name: 'Togo', code: 'TG' },
    TOKELAU: { name: 'Tokelau', code: 'TK' },
    TONGA: { name: 'Tonga', code: 'TO' },
    TRINIDAD_AND_TOBAGO: { name: 'Trinidad and Tobago', code: 'TT' },
    TUNISIA: { name: 'Tunisia', code: 'TN' },
    TURKEY: { name: 'Turkey', code: 'TR' },
    TURKMENISTAN: { name: 'Turkmenistan', code: 'TM' },
    TURKS_AND_CAICOS_ISLANDS: { name: 'Turks and Caicos Islands', code: 'TC' },
    TUVALU: { name: 'Tuvalu', code: 'TV' },
    UGANDA: { name: 'Uganda', code: 'UG' },
    UKRAINE: { name: 'Ukraine', code: 'UA' },
    UNITED_ARAB_EMIRATES: { name: 'United Arab Emirates', code: 'AE' },
    UNITED_KINGDOM: { name: 'United Kingdom', code: 'GB' },
    UNITED_STATES: { name: 'United States', code: 'US' },
    UNITED_STATES_MINOR_OUTLYING_ISLANDS: { name: 'United States Minor Outlying Islands', code: 'UM' },
    URUGUAY: { name: 'Uruguay', code: 'UY' },
    UZBEKISTAN: { name: 'Uzbekistan', code: 'UZ' },
    VANUATU: { name: 'Vanuatu', code: 'VU' },
    VENEZUELA: { name: 'Venezuela, Bolivarian Republic of', code: 'VE' },
    VIETNAM: { name: 'Viet Nam', code: 'VN' },
    VIRGIN_ISLANDS_BRITISH: { name: 'Virgin Islands, British', code: 'VG' },
    VIRGIN_ISLANDS_US: { name: 'Virgin Islands, U.S.', code: 'VI' },
    WALLIS_AND_FUTUNA: { name: 'Wallis and Futuna', code: 'WF' },
    WESTERN_SAHARA: { name: 'Western Sahara', code: 'EH' },
    YEMEN: { name: 'Yemen', code: 'YE' },
    ZAMBIA: { name: 'Zambia', code: 'ZM' },
    ZIMBABWE: { name: 'Zimbabwe', code: 'ZW' },
    ALAND_ISLANDS: { name: 'Åland Islands', code: 'AX' }
});

// Royalty related enums
export const ERoyaltyType = Object.freeze({
    REGULAR: 'regular',
    BONUS: 'bonus'
});

export const ERoyaltyTimeframe = Object.freeze({
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    LAST_90_DAYS: 'last_90_days',
    LAST_6_MONTHS: 'last_6_months',
    LAST_YEAR: 'last_year',
    CUSTOM: 'custom'
});

export const ERoyaltyMetric = Object.freeze({
    EARNINGS: 'earnings',
    GROWTH_RATE: 'growth_rate',
    AVERAGE_MONTHLY: 'average_monthly',
    BEST_MONTH: 'best_month'
});
