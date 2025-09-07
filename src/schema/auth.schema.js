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
        phoneNumber: z.string().trim().optional(),
        agreeToTerms: z.boolean().refine(val => val === true, {
            message: 'You must agree to terms and conditions'
        })
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

export default {
    register,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshToken,
    verifyEmail,
    resendVerification,
    createAdmin
}