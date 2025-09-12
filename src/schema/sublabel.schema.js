import { z } from 'zod'
import { ESublabelMembershipStatus } from '../constant/application.js'

const createSublabel = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Sublabel name is required').max(100, 'Name too long'),
        membershipStatus: z.enum(Object.values(ESublabelMembershipStatus)).default(ESublabelMembershipStatus.ACTIVE),
        contractStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
        contractEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
        description: z.string().max(500, 'Description too long').optional(),
        contactInfo: z.object({
            email: z.string().email('Invalid email').optional(),
            phone: z.string().optional()
        }).optional()
    })
})

const updateSublabel = z.object({
    params: z.object({
        id: z.string().min(1, 'Sublabel ID is required')
    }),
    body: z.object({
        name: z.string().trim().min(1, 'Sublabel name is required').max(100, 'Name too long').optional(),
        membershipStatus: z.enum(Object.values(ESublabelMembershipStatus)).optional(),
        contractStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
        contractEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
        description: z.string().max(500, 'Description too long').optional(),
        contactInfo: z.object({
            email: z.string().email('Invalid email').optional(),
            phone: z.string().optional()
        }).optional(),
        isActive: z.boolean().optional()
    })
})

const getSublabel = z.object({
    params: z.object({
        id: z.string().min(1, 'Sublabel ID is required')
    })
})

const deleteSublabel = z.object({
    params: z.object({
        id: z.string().min(1, 'Sublabel ID is required')
    })
})

const assignSublabelToUser = z.object({
    params: z.object({
        id: z.string().min(1, 'Sublabel ID is required')
    }),
    body: z.object({
        userId: z.string().min(1, 'User ID is required'),
        isDefault: z.boolean().default(false)
    })
})

const removeSublabelFromUser = z.object({
    params: z.object({
        id: z.string().min(1, 'Sublabel ID is required')
    }),
    body: z.object({
        userId: z.string().min(1, 'User ID is required')
    })
})

const toggleUserSublabels = z.object({
    params: z.object({
        userId: z.string().min(1, 'User ID is required')
    }),
    body: z.object({
        sublabelIds: z.array(z.string().min(1, 'Valid sublabel ID required')).min(1, 'At least one sublabel required')
    })
})

const getUserSublabels = z.object({
    params: z.object({
        userId: z.string().min(1, 'User ID is required')
    })
})

const getSublabels = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        search: z.string().optional(),
        membershipStatus: z.enum(Object.values(ESublabelMembershipStatus)).optional(),
        isActive: z.enum(['true', 'false']).optional(),
        sortBy: z.enum(['name', 'createdAt', 'membershipStatus']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
})

export default {
    createSublabel,
    updateSublabel,
    getSublabel,
    deleteSublabel,
    assignSublabelToUser,
    removeSublabelFromUser,
    toggleUserSublabels,
    getUserSublabels,
    getSublabels
}