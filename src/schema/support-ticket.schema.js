import { z } from 'zod'
import { ETicketCategory, ETicketPriority, ETicketStatus, EDepartment } from '../constant/application.js'

const createTicketSchema = z.object({
    body: z.object({
        subject: z.string()
            .trim()
            .min(1, 'Subject is required')
            .max(200, 'Subject must be less than 200 characters'),
        description: z.string()
            .trim()
            .min(1, 'Description is required')
            .max(5000, 'Description must be less than 5000 characters'),
        category: z.enum(Object.values(ETicketCategory), {
            errorMap: () => ({ message: 'Invalid category' })
        }),
        priority: z.enum(Object.values(ETicketPriority), {
            errorMap: () => ({ message: 'Invalid priority' })
        }).optional().default(ETicketPriority.MEDIUM),
        contactEmail: z.string()
            .email('Invalid email address')
            .trim()
            .toLowerCase()
            .optional(),
        attachments: z.array(z.object({
            fileName: z.string().trim(),
            fileUrl: z.string().url('Invalid file URL'),
            fileSize: z.number().positive('File size must be positive')
        })).optional().default([])
    })
})

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
        category: z.enum(Object.values(ETicketCategory)).optional(),
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
        description: z.string()
            .trim()
            .min(1, 'Description is required')
            .max(5000, 'Description must be less than 5000 characters')
            .optional(),
        category: z.enum(Object.values(ETicketCategory), {
            errorMap: () => ({ message: 'Invalid category' })
        }).optional(),
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
        tags: z.array(z.string().trim().toLowerCase()).optional()
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