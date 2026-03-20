import { z } from 'zod'
import { ECompanySettingsStatus } from '../constant/application.js'

const youtubeLinkSchema = z.object({
    title: z.string()
        .trim()
        .min(1, 'YouTube link title is required')
        .max(100, 'Title must be less than 100 characters'),
    url: z.string()
        .url('Invalid YouTube URL')
        .trim()
})

const physicalAddressSchema = z.object({
    street: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    state: z.string().trim().optional().nullable(),
    zipCode: z.string().trim().optional().nullable(),
    country: z.string().trim().optional().nullable()
})

const socialMediaSchema = z.object({
    instagram: z.string().url('Invalid Instagram URL').optional().nullable(),
    facebook: z.string().url('Invalid Facebook URL').optional().nullable(),
    linkedin: z.string().url('Invalid LinkedIn URL').optional().nullable(),
    youtube: z.string().url('Invalid YouTube URL').optional().nullable(),
    website: z.string().url('Invalid website URL').optional().nullable(),
    x: z.string().url('Invalid X (Twitter) URL').optional().nullable(),
    youtubeLinks: z.array(youtubeLinkSchema).optional().default([])
})

const contactInfoSchema = z.object({
    primaryPhone: z.string().trim().optional().nullable(),
    secondaryPhone: z.string().trim().optional().nullable(),
    primaryEmail: z.string().email('Invalid primary email').optional().nullable(),
    supportEmail: z.string().email('Invalid support email').optional().nullable(),
    businessEmail: z.string().email('Invalid business email').optional().nullable(),
    pressEmail: z.string().email('Invalid press email').optional().nullable(),
    legalEmail: z.string().email('Invalid legal email').optional().nullable(),
    whatsappQRCode: z.string().url('Invalid WhatsApp QR code URL').optional().nullable(),
    physicalAddress: physicalAddressSchema.optional(),
    businessHours: z.string()
        .trim()
        .max(500, 'Business hours must be less than 500 characters')
        .optional()
        .nullable()
})

const createCompanySettingsSchema = z.object({
    body: z.object({
        socialMedia: socialMediaSchema.optional(),
        contactInfo: contactInfoSchema.optional(),
        status: z.enum(Object.values(ECompanySettingsStatus), {
            errorMap: () => ({ message: 'Invalid status' })
        }).optional().default(ECompanySettingsStatus.ACTIVE)
    })
})

const updateCompanySettingsSchema = z.object({
    params: z.object({
        settingsId: z.string()
            .trim()
            .min(1, 'Settings ID is required')
    }),
    body: z.object({
        socialMedia: socialMediaSchema.optional(),
        contactInfo: contactInfoSchema.optional(),
        status: z.enum(Object.values(ECompanySettingsStatus), {
            errorMap: () => ({ message: 'Invalid status' })
        }).optional()
    })
})

const getCompanySettingsSchema = z.object({
    query: z.object({
        includeInactive: z.enum(['true', 'false']).optional().default('false')
    })
})

const getCompanySettingsByIdSchema = z.object({
    params: z.object({
        settingsId: z.string()
            .trim()
            .min(1, 'Settings ID is required')
    })
})

const deleteCompanySettingsSchema = z.object({
    params: z.object({
        settingsId: z.string()
            .trim()
            .min(1, 'Settings ID is required')
    })
})

const addYoutubeLinkSchema = z.object({
    params: z.object({
        settingsId: z.string()
            .trim()
            .min(1, 'Settings ID is required')
    }),
    body: youtubeLinkSchema
})

const removeYoutubeLinkSchema = z.object({
    params: z.object({
        settingsId: z.string()
            .trim()
            .min(1, 'Settings ID is required'),
        linkIndex: z.string()
            .trim()
            .min(1, 'Link index is required')
    })
})

export default {
    createCompanySettingsSchema,
    updateCompanySettingsSchema,
    getCompanySettingsSchema,
    getCompanySettingsByIdSchema,
    deleteCompanySettingsSchema,
    addYoutubeLinkSchema,
    removeYoutubeLinkSchema
}