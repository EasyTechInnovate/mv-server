import { z } from 'zod'
import {
    ETicketPriority,
    ETicketStatus,
    EDepartment,
    ETicketType,
    ENormalTicketCategory,
    ETicketCategory,
} from '../constant/application.js'

// --- Details Schemas for Each Ticket Type ---

const normalTicketDetailsSchema = z.object({
    description: z.string().trim().min(1, 'Description is required').max(5000),
    category: z.enum(Object.values(ENormalTicketCategory)),
    contactEmail: z.string().email().trim().toLowerCase().optional(),
    attachments: z.array(z.object({
        fileName: z.string().trim(),
        fileUrl: z.string().url(),
        fileSize: z.number().positive(),
    })).optional().default([]),
});

const metaClaimReleaseDetailsSchema = z.object({
    fullName: z.string().trim().min(1),
    email: z.string().email(),
    mobile: z.string().trim().min(1),
    claims: z.array(z.object({
        metaVideoLink: z.string().url(),
        metaAudioLink: z.string().url(),
        isrc: z.string().trim().min(1),
    })).min(1),
    confirmation: z.boolean().refine(val => val === true),
});

const youtubeClaimReleaseDetailsSchema = z.object({
    fullName: z.string().trim().min(1),
    email: z.string().email(),
    mobile: z.string().trim().min(1),
    claims: z.array(z.object({
        youtubeVideoLink: z.string().url(),
        officialVideoLink: z.string().url(),
        isrc: z.string().trim().min(1),
    })).min(1),
    confirmation: z.boolean().refine(val => val === true),
});

const youtubeManualClaimDetailsSchema = z.object({
    fullName: z.string().trim().min(1),
    email: z.string().email(),
    mobile: z.string().trim().min(1),
    claims: z.array(z.object({
        youtubeVideoLink: z.string().url(),
        officialVideoLink: z.string().url().optional().or(z.literal('')),
        isrc: z.string().trim().min(1),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })).min(1),
    confirmation: z.boolean().refine(val => val === true),
});

const metaProfileMappingDetailsSchema = z.object({
    fullName: z.string().trim().min(1),
    email: z.string().email(),
    mobile: z.string().trim().min(1),
    mapType: z.enum(['Facebook Page', 'Instagram Profile', 'Both']),
    facebookPageUrl: z.string().url().optional().or(z.literal('')),
    instagramProfileUrl: z.string().url().optional().or(z.literal('')),
    isrcs: z.array(z.string().trim().min(1)).min(1),
    confirmation: z.boolean().refine(val => val === true),
}).refine(data => {
    if (data.mapType === 'Facebook Page') return !!data.facebookPageUrl;
    if (data.mapType === 'Instagram Profile') return !!data.instagramProfileUrl;
    if (data.mapType === 'Both') return !!data.facebookPageUrl && !!data.instagramProfileUrl;
    return false;
}, { message: "Please provide the correct profile/page URLs for the selected map type." });

const youtubeOacMappingDetailsSchema = z.object({
    fullName: z.string().trim().min(1),
    email: z.string().email(),
    mobile: z.string().trim().min(1),
    mapType: z.enum(['OAC', 'Release']),
    topicChannelLink: z.string().url().optional().or(z.literal('')),
    youtubeOacTopicLink: z.string().url().optional().or(z.literal('')),
    artTrackLink: z.string().url().optional().or(z.literal('')),
    isrc: z.string().trim().min(1).optional().or(z.literal('')),
    confirmation: z.boolean().refine(val => val === true),
}).refine(data => {
    if (data.mapType === 'OAC') return !!data.topicChannelLink && !!data.youtubeOacTopicLink;
    if (data.mapType === 'Release') return !!data.youtubeOacTopicLink && !!data.artTrackLink && !!data.isrc;
    return false;
}, { message: "Please provide the correct links/ISRC for the selected map type." });

const metaManualClaimDetailsSchema = z.object({
    fullName: z.string().trim().min(1),
    email: z.string().email(),
    mobile: z.string().trim().min(1),
    claims: z.array(z.object({
        metaVideoLink: z.string().url(),
        officialVideoLink: z.string().url().optional().or(z.literal('')),
        isrc: z.string().trim().min(1),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })).min(1),
    confirmation: z.boolean().refine(val => val === true),
});


// --- Main Create Ticket Schema with Conditional Validation ---

const createTicketSchema = z.object({
    body: z.object({
        subject: z.string().trim().min(1).max(200),
        priority: z.enum(Object.values(ETicketPriority)).optional().default(ETicketPriority.MEDIUM),
        ticketType: z.enum(Object.values(ETicketType)),
        details: z.any(), // We validate 'details' manually in superRefine
    }).superRefine((data, ctx) => {
        let detailsSchema;
        switch (data.ticketType) {
            case ETicketType.NORMAL:
                detailsSchema = normalTicketDetailsSchema;
                break;
            case ETicketType.META_CLAIM_RELEASE:
                detailsSchema = metaClaimReleaseDetailsSchema;
                break;
            case ETicketType.YOUTUBE_CLAIM_RELEASE:
                detailsSchema = youtubeClaimReleaseDetailsSchema;
                break;
            case ETicketType.YOUTUBE_MANUAL_CLAIM:
                detailsSchema = youtubeManualClaimDetailsSchema;
                break;
            case ETicketType.META_PROFILE_MAPPING:
                detailsSchema = metaProfileMappingDetailsSchema;
                break;
            case ETicketType.YOUTUBE_OAC_MAPPING:
                detailsSchema = youtubeOacMappingDetailsSchema;
                break;
            case ETicketType.META_MANUAL_CLAIM:
                detailsSchema = metaManualClaimDetailsSchema;
                break;
            default:
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['ticketType'],
                    message: 'Invalid ticket type',
                });
                return;
        }

        const result = detailsSchema.safeParse(data.details);
        if (!result.success) {
            result.error.issues.forEach(issue => {
                ctx.addIssue({
                    ...issue,
                    path: ['details', ...issue.path],
                });
            });
        }
    }),
});

const getTicketsSchema = z.object({
    query: z.object({
        page: z.string()
            .optional()
            .transform((val) => val ? parseInt(val, 10) : 1)
            .pipe(z.number().min(1, 'Page must be at least 1')),
        limit: z.string()
            .optional()
            .transform((val) => val ? parseInt(val, 10) : 10)
            .pipe(z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100')),
        status: z.enum(Object.values(ETicketStatus)).optional(),
        priority: z.enum(Object.values(ETicketPriority)).optional(),
        assignedDepartment: z.enum(Object.values(EDepartment)).optional(),
        search: z.string().trim().optional(),
        sortBy: z.enum(['createdAt', 'lastActivityAt', 'priority', 'status']).optional().default('lastActivityAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
        dateFrom: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        dateTo: z.string().optional().transform((val) => val ? new Date(val) : undefined)
    })
})

const getTicketByIdSchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    })
})

const updateTicketSchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    }),
    body: z.object({
        subject: z.string()
            .trim()
            .min(1, 'Subject is required')
            .max(200, 'Subject must be less than 200 characters')
            .optional(),
        priority: z.enum(Object.values(ETicketPriority), {
            errorMap: () => ({ message: 'Invalid priority' })
        }).optional(),
        status: z.enum(Object.values(ETicketStatus), {
            errorMap: () => ({ message: 'Invalid status' })
        }).optional(),
        assignedTo: z.string()
            .trim()
            .optional()
            .nullable(),
        assignedDepartment: z.enum(Object.values(EDepartment), {
            errorMap: () => ({ message: 'Invalid department' })
        }).optional().nullable(),
        tags: z.array(z.string().trim().toLowerCase()).optional(),
        details: z.any().optional(),
    })
})

const addResponseSchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    }),
    body: z.object({
        message: z.string()
            .trim()
            .min(1, 'Response message is required')
            .max(2000, 'Response message must be less than 2000 characters'),
        isInternal: z.boolean().optional().default(false),
        attachments: z.array(z.object({
            fileName: z.string().trim(),
            fileUrl: z.string().url('Invalid file URL'),
            fileSize: z.number().positive('File size must be positive')
        })).optional().default([])
    })
})

const addInternalNoteSchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    }),
    body: z.object({
        note: z.string()
            .trim()
            .min(1, 'Note is required')
            .max(1000, 'Note must be less than 1000 characters')
    })
})

const assignTicketSchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    }),
    body: z.object({
        assignedTo: z.string()
            .trim()
            .optional()
            .nullable(),
        assignedDepartment: z.enum(Object.values(EDepartment), {
            errorMap: () => ({ message: 'Invalid department' })
        }).optional().nullable()
    })
})

const updateTicketStatusSchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    }),
    body: z.object({
        status: z.enum(Object.values(ETicketStatus), {
            errorMap: () => ({ message: 'Invalid status' })
        })
    })
})

const updateTicketPrioritySchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    }),
    body: z.object({
        priority: z.enum(Object.values(ETicketPriority), {
            errorMap: () => ({ message: 'Invalid priority' })
        })
    })
})

const escalateTicketSchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    })
})

const addSatisfactionRatingSchema = z.object({
    params: z.object({
        ticketId: z.string()
            .trim()
            .min(1, 'Ticket ID is required')
    }),
    body: z.object({
        rating: z.number()
            .int()
            .min(1, 'Rating must be between 1 and 5')
            .max(5, 'Rating must be between 1 and 5'),
        feedback: z.string()
            .trim()
            .max(1000, 'Feedback must be less than 1000 characters')
            .optional()
            .nullable()
    })
})

const getTicketStatsSchema = z.object({
    query: z.object({
        dateFrom: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        dateTo: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        department: z.enum(Object.values(EDepartment)).optional()
    })
})

const bulkUpdateTicketsSchema = z.object({
    body: z.object({
        ticketIds: z.array(z.string().trim()).min(1, 'At least one ticket ID is required'),
        updates: z.object({
            status: z.enum(Object.values(ETicketStatus)).optional(),
            priority: z.enum(Object.values(ETicketPriority)).optional(),
            assignedTo: z.string().trim().optional().nullable(),
            assignedDepartment: z.enum(Object.values(EDepartment)).optional().nullable(),
            tags: z.array(z.string().trim().toLowerCase()).optional()
        }).refine((data) => {
            const hasUpdates = Object.keys(data).length > 0
            return hasUpdates
        }, {
            message: 'At least one update field is required'
        })
    })
})

export {
    createTicketSchema,
    getTicketsSchema,
    getTicketByIdSchema,
    updateTicketSchema,
    addResponseSchema,
    addInternalNoteSchema,
    assignTicketSchema,
    updateTicketStatusSchema,
    updateTicketPrioritySchema,
    escalateTicketSchema,
    addSatisfactionRatingSchema,
    getTicketStatsSchema,
    bulkUpdateTicketsSchema
}