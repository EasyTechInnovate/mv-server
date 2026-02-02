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
    ALTERNATIVE: 'alternative',
    ALTERNATIVE_ROCK: 'alternative_rock',
    ALTERNATIVE_AND_ROCK_LATINO: 'alternative_and_rock_latino',
    ANIME: 'anime',
    BALADAS_Y_BOLEROS: 'baladas_y_boleros',
    BIG_BAND: 'big_band',
    BLUES: 'blues',
    BRAZILIAN: 'brazilian',
    C_POP: 'c_pop',
    CANTOPOP_HK_POP: 'cantopop_hk_pop',
    CHILDRENS: 'childrens',
    CHINESE: 'chinese',
    CHRISTIAN: 'christian',
    CLASSICAL: 'classical',
    COMEDY: 'comedy',
    CONTEMPORARY_LATIN: 'contemporary_latin',
    COUNTRY: 'country',
    DANCE: 'dance',
    EASY_LISTENING: 'easy_listening',
    EDUCATIONAL: 'educational',
    ELECTRONIC: 'electronic',
    ENKA: 'enka',
    EXPERIMENTAL: 'experimental',
    FITNESS_AND_WORKOUT: 'fitness_and_workout',
    FOLK: 'folk',
    FRENCH_POP: 'french_pop',
    GERMAN_POP: 'german_pop',
    GERMAN_FOLK: 'german_folk',
    HIP_HOP_RAP: 'hip_hop_rap',
    HOLIDAY: 'holiday',
    INSTRUMENTAL: 'instrumental',
    INDO_POP: 'indo_pop',
    INSPIRATIONAL: 'inspirational',
    INDIAN: 'indian',
    INDIAN_POP: 'indian_pop',
    INDIAN_RAP: 'indian_rap',
    INDIAN_FOLK: 'indian_folk',
    INDIAN_BOLLYWOOD: 'indian_bollywood',
    INDIAN_DEVOTIONAL_AND_SPIRITUAL: 'indian_devotional_and_spiritual',
    INDIAN_FUSION: 'indian_fusion',
    INDIAN_GAZAL: 'indian_gazal',
    INDIAN_CLASSICAL_VOCAL: 'indian_classical_vocal',
    INDIAN_DANCE: 'indian_dance',
    INDIAN_ELECTRONIC: 'indian_electronic',
    JAZZ: 'jazz',
    J_POP: 'j_pop',
    K_POP: 'k_pop',
    KARAOKE: 'karaoke',
    LATIN_JAZZ: 'latin_jazz',
    METAL: 'metal',
    NEW_AGE: 'new_age',
    OPERA: 'opera',
    POP: 'pop',
    PUNK: 'punk',
    R_AND_B: 'r_and_b',
    REGGAE: 'reggae',
    REGGAETON_Y_HIP_HOP: 'reggaeton_y_hip_hop',
    REGIONAL_MEXICANO: 'regional_mexicano',
    ROCK: 'rock',
    SALAS_Y_TOPICAL: 'salas_y_topical',
    SOUL: 'soul',
    SOUNDTRACK: 'soundtrack',
    SPOKEN_WORD: 'spoken_word',
    THAI_POP: 'thai_pop',
    TROT: 'trot',
    VOCAL_NOSTALGIA: 'vocal_nostalgia',
    WORLD: 'world'
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
    ANDORRA: 'andorra',
    ANGOLA: 'angola',
    ANTIGUA_AND_BARBUDA: 'antigua_and_barbuda',
    ARGENTINA: 'argentina',
    ARMENIA: 'armenia',
    AUSTRALIA: 'australia',
    AUSTRIA: 'austria',
    AZERBAIJAN: 'azerbaijan',
    BAHAMAS: 'bahamas',
    BAHRAIN: 'bahrain',
    BANGLADESH: 'bangladesh',
    BARBADOS: 'barbados',
    BELARUS: 'belarus',
    BELGIUM: 'belgium',
    BELIZE: 'belize',
    BENIN: 'benin',
    BHUTAN: 'bhutan',
    BOLIVIA: 'bolivia',
    BOSNIA_AND_HERZEGOVINA: 'bosnia_and_herzegovina',
    BOTSWANA: 'botswana',
    BRAZIL: 'brazil',
    BRUNEI: 'brunei',
    BULGARIA: 'bulgaria',
    BURKINA_FASO: 'burkina_faso',
    BURUNDI: 'burundi',
    CABO_VERDE: 'cabo_verde',
    CAMBODIA: 'cambodia',
    CAMEROON: 'cameroon',
    CANADA: 'canada',
    CENTRAL_AFRICAN_REPUBLIC: 'central_african_republic',
    CHAD: 'chad',
    CHILE: 'chile',
    CHINA: 'china',
    COLOMBIA: 'colombia',
    COMOROS: 'comoros',
    CONGO_CONGO_BRAZZAVILLE: 'congo_congo-brazzaville',
    COSTA_RICA: 'costa_rica',
    COTE_DIVOIRE: 'cote_divoire',
    CROATIA: 'croatia',
    CUBA: 'cuba',
    CYPRUS: 'cyprus',
    CZECHIA: 'czechia',
    DEMOCRATIC_REPUBLIC_OF_THE_UNITED_STATE_OF_AMERICA: 'democratic_republic_of_the_united_states_of_america',
    DENMARK: 'denmark',
    DJIBOUTI: 'djibouti',
    DOMINICA: 'dominica',
    DOMINICAN_REPUBLIC: 'dominican_republic',
    ECUADOR: 'ecuador',
    EGYPT: 'egypt',
    EL_SALVADOR: 'el_salvador',
    EQUATORIAL_GUINEA: 'equatorial_guinea',
    ERITREA: 'eritrea',
    ESTONIA: 'estonia',
    ESWATINI_FORMERLY_SWAZILAND: 'eswatini_formerly_swaziland',
    ETHIOPIA: 'ethiopia',
    FIJI: 'fiji',
    FINLAND: 'finland',
    FRANCE: 'france',
    GABON: 'gabon',
    GAMBIA: 'gambia',
    GEORGIA: 'georgia',
    GERMANY: 'germany',
    GHANA: 'ghana',
    GREECE: 'greece',
    GRENADA: 'grenada',
    GUATEMALA: 'guatemala',
    GUINEA: 'guinea',
    GUINEA_BISSAU: 'guinea-bissau',
    GUYANA: 'guyana',
    HAITI: 'haiti',
    HONDURAS: 'honduras',
    HUNGARY: 'hungary',
    ICELAND: 'iceland',
    INDIA: 'india',
    INDONESIA: 'indonesia',
    IRAN: 'iran',
    IRAQ: 'iraq',
    IRELAND: 'ireland',
    ISRAEL: 'israel',
    ITALY: 'italy',
    JAMAICA: 'jamaica',
    JAPAN: 'japan',
    JORDAN: 'jordan',
    KAZAKHSTAN: 'kazakhstan',
    KENYA: 'kenya',
    KIRIBATI: 'kiribati',
    KUWAIT: 'kuwait',
    KYRGYZSTAN: 'kyrgyzstan',
    LAOS: 'laos',
    LATVIA: 'latvia',
    LEBANON: 'lebanon',
    LESOTHO: 'lesotho',
    LIBERIA: 'liberia',
    LIBYA: 'libya',
    LIECHTENSTEIN: 'liechtenstein',
    LITHUANIA: 'lithuania',
    LUXEMBOURG: 'luxembourg',
    MADAGASCAR: 'madagascar',
    MALAWI: 'malawi',
    MALAYSIA: 'malaysia',
    MALDIVES: 'maldives',
    MALI: 'mali',
    MALTA: 'malta',
    MARSHALL_ISLANDS: 'marshall_islands',
    MAURITANIA: 'mauritania',
    MAURITIUS: 'mauritius',
    MEXICO: 'mexico',
    MICRONESIA: 'micronesia',
    MOLDOVA: 'moldova',
    MONACO: 'monaco',
    MONGOLIA: 'mongolia',
    MONTENEGRO: 'montenegro',
    MOROCCO: 'morocco',
    MOZAMBIQUE: 'mozambique',
    MYANMAR_FORMERLY_BURMA: 'myanmar_formerly_burma',
    NAMIBIA: 'namibia',
    NAURU: 'nauru',
    NEPAL: 'nepal',
    NETHERLANDS: 'netherlands',
    NEW_ZEALAND: 'new_zealand',
    NICARAGUA: 'nicaragua',
    NIGER: 'niger',
    NIGERIA: 'nigeria',
    NORTH_KOREA: 'north_korea',
    NORTH_MACEDONIA_FORMERLY_MACEDONIA: 'north_macedonia_formerly_macedonia',
    NORWAY: 'norway',
    OMAN: 'oman',
    PAKISTAN: 'pakistan',
    PALAU: 'palau',
    PALESTINE: 'palestine',
    PANAMA: 'panama',
    PAPUA_NEW_GUINEA: 'papua_new_guinea',
    PARAGUAY: 'paraguay',
    PERU: 'peru',
    PHILIPPINES: 'philippines',
    POLAND: 'poland',
    PORTUGAL: 'portugal',
    QATAR: 'qatar',
    ROMANIA: 'romania',
    RUSSIA: 'russia',
    RWANDA: 'rwanda',
    SAINT_KITTS_AND_NEVIS: 'saint_kitts_and_nevis',
    SAINT_LUCIA: 'saint_lucia',
    SAINT_VINCENT_AND_THE_GRENADINES: 'saint_vincent_and_the_grenadines',
    SAMOA: 'samoa',
    SAN_MARINO: 'san_marino',
    SAO_TOME_AND_PRINCIPE: 'sao_tome_and_principe',
    SAUDI_ARABIA: 'saudi_arabia',
    SENEGAL: 'senegal',
    SERBIA: 'serbia',
    SEYCHELLES: 'seychelles',
    SIERRA_LEONE: 'sierra_leone',
    SINGAPORE: 'singapore',
    SLOVAKIA: 'slovakia',
    SLOVENIA: 'slovenia',
    SOLOMON_ISLANDS: 'solomon_islands',
    SOMALIA: 'somalia',
    SOUTH_AFRICA: 'south_africa',
    SOUTH_KOREA: 'south_korea',
    SOUTH_SUDAN: 'south_sudan',
    SPAIN: 'spain',
    SRI_LANKA: 'sri_lanka',
    SUDAN: 'sudan',
    SURINAME: 'suriname',
    SWEDEN: 'sweden',
    SWITZERLAND: 'switzerland',
    SYRIA: 'syria',
    TAIWAN: 'taiwan',
    TAJIKISTAN: 'tajikistan',
    TANZANIA: 'tanzania',
    THAILAND: 'thailand',
    TIMOR_LESTE: 'timor-leste',
    TOGO: 'togo',
    TONGA: 'tonga',
    TRINIDAD_AND_TOBAGO: 'trinidad_and_tobago',
    TUNISIA: 'tunisia',
    TURKEY: 'turkey',
    TURKMENISTAN: 'turkmenistan',
    TUVALU: 'tuvalu',
    UGANDA: 'uganda',
    UKRAINE: 'ukraine',
    UNITED_ARAB_EMIRATES: 'united_arab_emirates',
    UNITED_KINGDOM: 'united_kingdom',
    UNITED_STATES_OF_AMERICA: 'united_states_of_america',
    URUGUAY: 'uruguay',
    UZBEKISTAN: 'uzbekistan',
    VANUATU: 'vanuatu',
    VATICAN_CITY: 'vatican_city',
    VENEZUELA: 'venezuela',
    VIETNAM: 'vietnam',
    YEMEN: 'yemen',
    ZAMBIA: 'zambia',
    ZIMBABWE: 'zimbabwe',
    WORLDWIDE: 'worldwide'
});

export const EDistributionPartners = Object.freeze({
    JIO: 'jio',
    AIRTEL: 'airtel',
    BSNL: 'bsnl',
    VI: 'vi',
    GAANA: 'gaana',
    HUNGAMA: 'hungama',
    JIOSAAVN: 'jiosaavn',
    WYNK: 'wynk',
    "7DIGITAL": '7digital',
    MIXUPLOAD: 'mixupload',
    DEEZER: 'deezer',
    SOUNDCLOUD: 'soundcloud',
    AMI_ENTERTAINMENT: 'ami_entertainment',
    SIMFY: 'simfy',
    SLACKER: 'slacker',
    SOUNDEXCHANGE: 'soundexchange',
    GRACENOTE: 'gracenote',
    LICKD: 'lickd',
    "8TRACKS": '8tracks',
    LIKEE: 'likee',
    MONKINGME: 'monkingme',
    IMUSICA: 'imusica',
    APPLER_MUSIC: 'appler_music',
    TOUCHTUNES: 'touchtunes',
    TRAXSOURCE: 'traxsource',
    PANDORA: 'pandora',
    TIDAL: 'tidal',
    JUNO_DOWNLOADS: 'juno_downloads',
    SHAZAM: 'shazam',
    SBERZVUK: 'sberzvuk',
    SPOTIFY: 'spotify',
    BMAT: 'bmat',
    KKBOX: 'kkbox',
    MEDIANET: 'medianet',
    AMAZON: 'amazon',
    NAPSTER: 'napster',
    DAILYMOTION: 'dailymotion',
    AWA: 'awa',
    IHEART_RADIO: 'iheart_radio',
    BOOMPLAY: 'boomplay',
    FACEBOOK_AUDIO_LIBRARY: 'facebook_audio_library',
    FACEBOOK_AUDIO_FOOTPRINTING: 'facebook_audio_footprinting',
    ALIBABA: 'alibaba',
    NETEASE: 'netease',
    TENCENT: 'tencent',
    AUDIBLE_MAGIC: 'audible_magic',
    MUSO_AI: 'muso.ai',
    SAAVN: 'saavn',
    UNITED_MEDIA_AGENCY: 'united_media_agency',
    MIXCLOUD: 'mixcloud',
    KUACK_MEDIA_GROUP: 'kuack_media_group',
    SIRIUSXM: 'siriusxm',
    ANGHAMI: 'anghami',
    QOBUZ: 'qobuz',
    CLICKNCLEAR: 'clicknclear',
    TUNEDGLOBAL: 'tunedglobal',
    FLO: 'flo',
    ACRCLOUD: 'acrcloud',
    MOODAGENT: 'moodagent',
    ENAZA: 'enaza',
    YOUTUBE_ART_TRACKS: 'youtube_art_tracks',
    YOUTUBE_CONTENT_ID: 'youtube_content_id',
    JOOX: 'joox',
    IPEX: 'ipex',
    JAXSTA: 'jaxsta',
    MELON: 'melon',
    PRETZEL: 'pretzel',
    RESSO: 'resso',
    TIKTOK: 'tiktok',
    SCPP: 'scpp',
    SOUNDMOUSE: 'soundmouse',
    TRILLER: 'triller',
    YANDEX: 'yandex',
    ZAYCEV: 'zaycev',
    AUDIOMACK: 'audiomack',
    YOUTUBE_MUSIC: 'youtube_music',
    INSTAGRAM_REELS: 'instagram_reels',
    SNAPCHAT: 'snapchat',
    BANDCAMP: 'bandcamp',
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
    EP: 'ep',
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
    BONUS: 'bonus',
    MCN: 'mcn'
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

export const ETrendingArtistStatus = Object.freeze({
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

export const ENormalTicketCategory = Object.freeze({
    GENERAL_QUESTIONS: 'General Questions',
    WITHDRAWAL_QUESTIONS: 'Withdrawal Questions',
    SUBSCRIPTION_RELATED: 'Subscription Related',
    PAYMENT_AND_REFUNDS: 'Payment and Refunds',
    OWNERSHIP_COPYRIGHT_ISSUES: 'Ownership/Copyright Related Issues',
    ACCOUNT_DELETION_CANCELLATION: 'Account Deletion/Membership Cancellation',
    COPYRIGHT_CLAIMS: 'Copyright Claims - YouTube, Meta, etc',
    OAC_REQUESTS: 'OAC Requests',
    CONNECT_SOCIAL_MEDIA: 'Connect/Correct Social Media Profiles',
    ARTIFICIAL_STREAMING: 'Artificial Streaming/Infringement',
    RELEASE_ISSUES: 'Release - Delivery, Takedown, Edit',
    OTHER: 'Other'
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

export const ETicketType = Object.freeze({
    NORMAL: 'Normal',
    META_CLAIM_RELEASE: 'Meta Claim Release',
    YOUTUBE_CLAIM_RELEASE: 'Youtube Claim release',
    YOUTUBE_MANUAL_CLAIM: 'Youtube Manual Claim',
    META_PROFILE_MAPPING: 'Meta Profile/Page Mapping',
    YOUTUBE_OAC_MAPPING: 'Youtube Channel OAC / Release Mapping',
    META_MANUAL_CLAIM: 'Meta Manual Claiming Form'
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
    GAANA: 'Gaana',
    SEVEN_DIGITAL: '7Digital',
    SELECT_ALL: 'Select All'
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

// MCN Management Enums
export const EMCNRequestStatus = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REMOVAL_REQUESTED: 'removal_requested',
    REMOVAL_APPROVED: 'removal_approved'
});

export const EMCNChannelStatus = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
});

export const EMCNRequestAction = Object.freeze({
    APPROVE: 'approve',
    REJECT: 'reject',
    REQUEST_REMOVAL: 'request_removal',
    APPROVE_REMOVAL: 'approve_removal'
});

// Marketing Management Enums
export const EMarketingSubmissionStatus = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
});

export const EMarketingSubmissionType = Object.freeze({
    SYNC: 'sync',
    PLAYLIST_PITCHING: 'playlist_pitching'
});

export const ESyncProjectSuitability = Object.freeze({
    AD_CAMPAIGNS: 'ad_campaigns',
    OTT_WEB_SERIES: 'ott_web_series',
    TV_FILM_SCORE: 'tv_film_score',
    TRAILERS: 'trailers',
    PODCASTS: 'podcasts',
    CORPORATE_FILMS: 'corporate_films',
    FASHION_OR_PRODUCT_LAUNCH: 'fashion_or_product_launch',
    GAMING_ANIMATION: 'gaming_animation',
    FESTIVAL_DOCUMENTARIES: 'festival_documentaries',
    SHORT_FILMS_STUDENT_PROJECTS: 'short_films_student_projects'
});



export const EMusicMood = Object.freeze({
    UPLIFTING: 'uplifting',
    MELANCHOLIC: 'melancholic',
    EUPHORIC: 'euphoric',
    NOSTALGIC: 'nostalgic',
    ROMANTIC: 'romantic',
    CINEMATIC: 'cinematic',
    AGGRESSIVE: 'aggressive',
    CHILL_MELLOW: 'chill_mellow',
    DARK_MOODY: 'dark_moody',
    HOPEFUL: 'hopeful',
    TENSE_SUSPENSEFUL: 'tense_suspenseful',
    PLAYFUL_QUIRKY: 'playful_quirky',
    ENERGETIC_HIGH_TEMPO: 'energetic_high_tempo',
    INSPIRATIONAL: 'inspirational',
    MYSTERIOUS: 'mysterious',
    SAD_REFLECTIVE: 'sad_reflective',
    SPIRITUAL_DEVOTIONAL: 'spiritual_devotional',
    GROOVY_FUNKY: 'groovy_funky',
    TRIBAL_ROOTED: 'tribal_rooted',
    ANTHEMIC_EPIC: 'anthemic_epic'
});

export const EMusicTheme = Object.freeze({
    LOVE_ROMANCE: 'love_romance',
    HEARTBREAK_HEALING: 'heartbreak_healing',
    REBELLION_RESISTANCE: 'rebellion_resistance',
    CELEBRATION_PARTY: 'celebration_party',
    SPIRITUAL_DEVOTIONAL: 'spiritual_devotional',
    COMING_OF_AGE: 'coming_of_age',
    FRIENDSHIP_BROTHERHOOD: 'friendship_brotherhood',
    NATURE_ENVIRONMENT: 'nature_environment',
    FESTIVAL_TRADITION: 'festival_tradition',
    IDENTITY_SELF_DISCOVERY: 'identity_self_discovery',
    URBAN_LIFE_HUSTLE: 'urban_life_hustle',
    NOSTALGIA_MEMORY: 'nostalgia_memory',
    HOPE_RESILIENCE: 'hope_resilience',
    JOURNEY_TRAVEL: 'journey_travel',
    FAMILY_LEGACY: 'family_legacy',
    SOCIAL_JUSTICE_AWARENESS: 'social_justice_awareness',
    FANTASY_IMAGINATION: 'fantasy_imagination',
    RITUAL_CULTURE: 'ritual_culture',
    EMPOWERMENT_CONFIDENCE: 'empowerment_confidence',
    MYSTERY_SUSPENSE: 'mystery_suspense'
});

export const EMusicLanguage = Object.freeze({
    INSTRUMENTAL: 'instrumental',
    AFRIKAANS: 'afrikaans',
    ALBANIAN: 'albanian',
    AMHARIC: 'amharic',
    ARABIC: 'arabic',
    ARAGONESE: 'aragonese',
    ARMENIAN: 'armenian',
    ASTURIAN: 'asturian',
    AZERBAIJANI: 'azerbaijani',
    BASQUE: 'basque',
    BELARUSIAN: 'belarusian',
    BENGALI: 'bengali',
    BOSNIAN: 'bosnian',
    BRETON: 'breton',
    BULGARIAN: 'bulgarian',
    CATALAN: 'catalan',
    CENTRAL_KURDISH: 'central_kurdish',
    CHINESE: 'chinese',
    CORSICAN: 'corsican',
    CROATIAN: 'croatian',
    CZECH: 'czech',
    DANISH: 'danish',
    DUTCH: 'dutch',
    ENGLISH: 'english',
    ENGLISH_AUSTRALIA: 'english_australia',
    ENGLISH_CANADA: 'english_canada',
    ENGLISH_INDIA: 'english_india',
    ENGLISH_US: 'english_us',
    ENGLISH_UK: 'english_uk',
    ENGLISH_NEW_ZEALAND: 'english_new_zealand',
    ENGLISH_SOUTH_AFRICA: 'english_south_africa',
    ESTENIAN: 'estenian',
    FAREESE: 'fareese',
    FILIPINO: 'filipino',
    FINNISH: 'finnish',
    FRENCH: 'french',
    GALICIAN: 'galician',
    GEORGIAN: 'georgian',
    GERMAN: 'german',
    GURANI: 'gurani',
    GUJRATI: 'gujrati',
    HAUSA: 'hausa',
    HAWAIIAN: 'hawaiian',
    HEBREW: 'hebrew',
    HINDI: 'hindi',
    HUNGARIAN: 'hungarian',
    ICELANDIC: 'icelandic',
    INDONESIAN: 'indonesian',
    INTERLINGUA: 'interlingua',
    IRISH: 'irish',
    ITALIAN: 'italian',
    JAPANESE: 'japanese',
    KANNADA: 'kannada',
    KAZAKH: 'kazakh',
    KHMER: 'khmer',
    KOREN: 'koren',
    KURDISH: 'kurdish',
    KYRGYZ: 'kyrgyz',
    LAO: 'lao',
    LATIN: 'latin',
    LATVIAN: 'latvian',
    LINGALA: 'lingala',
    LITHUANIAN: 'lithuanian',
    MACEDONIAN: 'macedonian',
    MALAY: 'malay',
    MALAYALAM: 'malayalam',
    MALTESE: 'maltese',
    MARATHI: 'marathi',
    MONGOLIAN: 'mongolian',
    NAGPURI: 'nagpuri',
    NEPALI: 'nepali',
    NORWEGIAN: 'norwegian',
    OCCITAN: 'occitan',
    ORIYA: 'oriya',
    OROMO: 'oromo',
    PASHTO: 'pashto',
    PERSIAN: 'persian',
    POLISH: 'polish',
    PORTUGUESE: 'portuguese',
    PUNJABI: 'punjabi',
    QUECHUA: 'quechua',
    ROMANIAN: 'romanian',
    RUSSIAN: 'russian',
    SAINTHILI: 'sainthili',
    SCOTTISH: 'scottish',
    SERBIAN: 'serbian',
    SINDHI: 'sindhi',
    SHONO: 'shono',
    SINHALA: 'sinhala',
    SLOVAK: 'slovak',
    SLOVERNIAN: 'slovenian',
    SOMALI: 'somali',
    SPANISH: 'spanish',
    SUNDANESE: 'sundanese',
    SWAHILI: 'swahili',
    SWEDISH: 'swedish',
    TAJIK: 'tajik',
    TAMIL: 'tamil',
    TATAR: 'tatar',
    TELUGU: 'telugu',
    THAI: 'thai',
    TIGRINYA: 'tigrinya',
    TONGAN: 'tongan',
    TURKISH: 'turkish',
    TURKMEN: 'turkmen',
    TWI: 'twi',
    UKRAINIAN: 'ukrainian',
    URDU: 'urdu',
    UYGHUR: 'uyghur',
    UZBEK: 'uzbek',
    VIETNAMESE: 'vietnamese',
    WALLOON: 'walloon',
    WETISH: 'wetish',
    WESTERN_FRISIAN: 'western_frisian',
    XHOSA: 'xhosa',
    YIDDISH: 'yiddish',
    YORUBA: 'yoruba',
    ZULU: 'zulu'
});

export const EPROAffiliation = Object.freeze({
    BMI: 'bmi',
    ASCAP: 'ascap',
    IPRS: 'iprs',
    PRS: 'prs',
    SOCAN: 'socan',
    SACEM: 'sacem',
    GEMA: 'gema',
    OTHER: 'other',
    NONE: 'none'
});

// Fan Link Builder Enums
export const EFanLinkStatus = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive'
});

export const EFanLinkPlatform = Object.freeze({
    SPOTIFY: 'spotify',
    APPLE_MUSIC: 'apple_music',
    AMAZON_MUSIC: 'amazon_music',
    YOUTUBE_MUSIC: 'youtube_music',
    DEEZER: 'deezer',
    TIDAL: 'tidal',
    PANDORA: 'pandora',
    SOUNDCLOUD: 'soundcloud',
    JIOSAAVN: 'jiosaavn',
    WYNK: 'wynk',
    GAANA: 'gaana',
    HUNGAMA: 'hungama'
});

export const EMVProductionStatus = Object.freeze({
    PENDING: 'pending',
    ACCEPT: 'accept',
    REJECT: 'reject'
});

export const ELocationPreference = Object.freeze({
    INDOOR_STUDIO: 'indoor_studio',
    OUTDOOR_AND_NATURAL: 'outdoor_and_natural',
    URBAN_AND_STREET: 'urban_and_street',
    OTHER: 'other'
});

export const ERevenueSharingModel = Object.freeze({
    FLAT_BUYOUT: 'flat_buyout',
    REVENUE_SPLIT: 'revenue_split',
    HYBRID: 'hybrid'
});

// Merch Store Enums
export const EMerchStoreStatus = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    DESIGN_PENDING: 'design_pending',
    DESIGN_SUBMITTED: 'design_submitted',
    DESIGN_APPROVED: 'design_approved',
    DESIGN_REJECTED: 'design_rejected'
});

export const EMerchProductType = Object.freeze({
    T_SHIRT: 't_shirt',
    HOODIE: 'hoodie',
    SIPPER_BOTTLE: 'sipper_bottle',
    POSTERS: 'posters',
    TOTE_BAGS: 'tote_bags',
    STICKERS: 'stickers',
    OTHER: 'other'
});

export const EMerchMarketingChannel = Object.freeze({
    INSTAGRAM: 'instagram',
    YOUTUBE: 'youtube',
    EMAIL_NEWSLETTER: 'email_newsletter',
    LIVE_EVENTS: 'live_events',
    OTHER: 'other'
});

export const EPayoutStatus = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    PAID: 'paid',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
});

export const EPayoutMethod = Object.freeze({
    BANK_TRANSFER: 'bank_transfer',
    UPI: 'upi',
    CHEQUE: 'cheque'
});
