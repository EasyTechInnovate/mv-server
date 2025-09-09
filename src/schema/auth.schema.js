import { z } from 'zod'
import { EUserType } from '../constant/application.js'

const register = z.object({
    body: z.object({
        firstName: z.string().trim().min(1, 'First name is required'),
        lastName: z.string().trim().min(1, 'Last name is required'),
        emailAddress: z.string().email('Invalid email address').transform(val => val.toLowerCase()),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
        userType: z.enum([EUserType.ARTIST, EUserType.LABEL]),
        companyName: z.string().trim().optional(),
        phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
        consent: z.object({
            terms: z.boolean().refine(val => val === true, {
                message: 'You must agree to terms and conditions'
            }),
            privacy: z.boolean().refine(val => val === true, {
                message: 'You must agree to privacy policy'
            }),
            marketing: z.boolean().optional()
        }),
        address: z.object({
            street: z.string().min(1, 'Street is required'),
            city: z.string().min(1, 'City is required'),
            state: z.string().min(1, 'State is required'),
            country: z.string().min(1, 'Country is required'),
            pinCode: z.string().min(1, 'Pin code is required')
        }),
        artistData: z.object({
            artistName: z.string().min(1, 'Artist name is required'),
            youtubeLink: z.string().url('Invalid YouTube URL').optional(),
            instagramLink: z.string().url('Invalid Instagram URL').optional(),
            facebookLink: z.string().url('Invalid Facebook URL').optional()
        }).optional(),
        labelData: z.object({
            labelName: z.string().min(1, 'Label name is required'),
            youtubeLink: z.string().url('Invalid YouTube URL').optional(),
            websiteLink: z.string().url('Invalid Website URL').optional(),
            popularReleaseLink: z.string().url('Invalid Release URL').optional(),
            popularArtistLinks: z.array(z.string().url()).optional(),
            totalReleases: z.number().min(0, 'Total releases must be non-negative').optional(),
            releaseFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
            monthlyReleasePlans: z.number().min(0, 'Monthly release plans must be non-negative').optional(),
            aboutLabel: z.string().optional()
        }).optional()
    }).refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })
})

const login = z.object({
    body: z.object({
        emailAddress: z.string().email('Invalid email address').transform(val => val.toLowerCase()),
        password: z.string().min(1, 'Password is required')
    })
})

const forgotPassword = z.object({
    body: z.object({
        emailAddress: z.string().email('Invalid email address').transform(val => val.toLowerCase())
    })
})

const resetPassword = z.object({
    body: z.object({
        token: z.string().min(1, 'Reset token is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })
})

const changePassword = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters'),
        confirmPassword: z.string()
    }).refine(data => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })
})

const refreshToken = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required')
    })
})

const verifyEmail = z.object({
    body: z.object({
        token: z.string().min(1, 'Verification token is required'),
        code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits')
    })
})

const resendVerification = z.object({
    body: z.object({
        emailAddress: z.string().email('Invalid email address').transform(val => val.toLowerCase())
    })
})

const createAdmin = z.object({
    body: z.object({
        firstName: z.string().trim().min(1, 'First name is required'),
        lastName: z.string().trim().min(1, 'Last name is required'),
        emailAddress: z.string().email('Invalid email address').transform(val => val.toLowerCase()),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })
})

const kycSubmit = z.object({
    body: z.object({
        documents: z.object({
            aadhaar: z.object({
                number: z.string()
                    .trim()
                    .refine(val => /^\d{4}-?\d{4}-?\d{4}$/.test(val), {
                        message: 'Aadhaar must be 12 digits (format: 1234-5678-9012 or 123456789012)'
                    }),
                documentUrl: z.string().url('Invalid document URL')
            }).optional(),
            pan: z.object({
                number: z.string()
                    .trim()
                    .toUpperCase()
                    .refine(val => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), {
                        message: 'PAN must be valid (e.g., ABCDE1234F)'
                    }),
                documentUrl: z.string().url('Invalid document URL')
            }).optional()
        }).optional(),
        bankDetails: z.object({
            accountNumber: z.string().trim().min(8, 'Account number must be at least 8 characters'),
            ifscCode: z.string()
                .trim()
                .toUpperCase()
                .refine(val => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
                    message: 'IFSC code must be valid (e.g., HDFC0001234)'
                }),
            accountHolderName: z.string().trim().min(1, 'Account holder name is required'),
            bankName: z.string().trim().min(1, 'Bank name is required')
        }).optional(),
        upiDetails: z.object({
            upiId: z.string()
                .trim()
                .refine(val => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/.test(val), {
                    message: 'UPI ID must be valid (e.g., user@paytm)'
                })
        }).optional()
    }).refine(data => 
        data.documents || data.bankDetails || data.upiDetails, {
        message: 'At least one of documents, bank details, or UPI details must be provided'
    }).transform(data => {
        // Security: Remove any status fields that users might try to inject
        const { isCompleted, status, verifiedAt, rejectedAt, ...cleanData } = data;
        return cleanData;
    })
})

export default {
    register,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshToken,
    verifyEmail,
    resendVerification,
    createAdmin,
    kycSubmit
}
