import { z } from 'zod'

const submitApplication = z.object({
    body: z.object({
        firstName: z.string().trim().min(1, 'First name is required'),
        lastName: z.string().trim().min(1, 'Last name is required'),
        emailAddress: z.string().email('Invalid email address').transform(val => val.toLowerCase()),
        phoneNumber: z.string().trim().min(1, 'Phone number is required'),
        companyName: z.string().trim().min(1, 'Company name is required'),
        websiteLink: z.string().url('Invalid website URL').optional().or(z.literal('')),
        instagramUrl: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
        facebookUrl: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
        linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
        youtubeLink: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
        popularReleaseLinks: z.array(z.string().url()).optional(),
        popularArtistLinks: z.array(z.string().url()).optional(),
        associatedLabels: z.array(z.string()).optional(),
        totalReleases: z.number().min(0, 'Total releases cannot be negative').optional(),
        releaseFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
        monthlyReleasePlans: z.number().min(0, 'Monthly release plans cannot be negative').optional(),
        briefInfo: z.string().trim().min(1, 'Brief info is required').max(1000, 'Brief info cannot exceed 1000 characters'),
        additionalServices: z.array(z.enum(['music_marketing', 'youtube_cms', 'music_video_distribution'])).optional(),
        howDidYouKnow: z.enum(['social_media', 'friend', 'advertisement', 'other']).optional(),
        howDidYouKnowOther: z.string().trim().optional(),
        agreeToTerms: z.boolean().refine(val => val === true, {
            message: 'You must agree to terms and conditions'
        })
    })
})

const reviewApplication = z.object({
    params: z.object({
        applicationId: z.string().min(1, 'Application ID is required')
    }),
    body: z.object({
        applicationStatus: z.enum(['approved', 'rejected']),
        adminNotes: z.string().trim().optional()
    })
})

const createAggregatorAccount = z.object({
    params: z.object({
        applicationId: z.string().min(1, 'Application ID is required')
    }),
    body: z.object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })
})

export default {
    submitApplication,
    reviewApplication,
    createAggregatorAccount
}