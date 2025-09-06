firtsName
lastName
EmailId
PhoneNumber
Address
pincode
State
COuntry
Password



artist ---->
ArtistName
YoutubeLink
InstagramLink
FacebookLink
consent

label ---->
labelName
YoutubeLink
WebsiteLink
YourPopularReleaseLink
Your Popular Artist Links
Total No. Of releases in Your current Calalog
How often Do You release your music? -> dropdown
How many releases do plan to distribute in a month?
Provide some brief info. About your Label
consent


Aggregator ---->
CompanyName/FirmName
YoutubeLink
WebsiteLink
InstagramUrl
FacebookUrl
LinkdinUrl
YourPopularReleaseLink multiple
Your Popular Artist Links multiple
Your labels multiple
Total No. Of releases in Your current Calalog*
How often Do You release your music? -> dropdown
How many releases do plan to distribute in a month?
Provide some brief info. About your Firm/Company*
Are you interested in any of our additional services?* -> Music Marketing/Advertisment, YouTube Channel CMS,Music Video Distribution
How do you know about us?* -> Social Media, Friend, Advertisement, Other
If Choose Other/our existing client*
consent


How i write model example 
// user.model.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import { EUserRole } from '../constant/application.js'

dayjs.extend(utc)

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        
        avatar: {
            type: String,
            default: null
        },
        
        emailAddress: {
            type: String,
            required: [true, 'Email address is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
        },
        
        phoneNumber: {
            _id: false,
            isoCode: {
                type: String,
                required: [true, 'ISO code is required']
            },
            countryCode: {
                type: String,
                required: [true, 'Country code is required']
            },
            internationalNumber: {
                type: String,
                required: [true, 'Phone number is required']
            }
        },
        
        timezone: {
            type: String,
            trim: true,
            required: [true, 'Timezone is required']
        },
        
        password: {
            type: String,
            required: function() {
                return !this.googleAuth?.googleId
            },
            minlength: [6, 'Password must be at least 6 characters long']
        },
        
        googleAuth: {
            _id: false,
            googleId: {
                type: String,
                default: null,
                sparse: true
            },
            profile: {
                _id: false,
                name: {
                    type: String,
                    default: null
                },
                picture: {
                    type: String,
                    default: null
                },
                email: {
                    type: String,
                    default: null
                }
            }
        },
        
        accountConfirmation: {
            _id: false,
            status: {
                type: Boolean,
                default: false,
                required: true
            },
            token: {
                type: String,
                required: [true, 'Confirmation token is required']
            },
            code: {
                type: String,
                required: [true, 'Confirmation code is required']
            },
            timestamp: {
                type: Date,
                default: null
            }
        },
        
        passwordReset: {
            _id: false,
            token: {
                type: String,
                default: null
            },
            expiry: {
                type: Number,
                default: null
            },
            lastResetAt: {
                type: Date,
                default: null
            }
        },
        
        consent: {
            type: Boolean,
            required: [true, 'Consent is required to proceed']
        },
        
        roles: {
            type: [String],
            enum: Object.values(EUserRole),
            default: [EUserRole.USER]
        },
        
        isActive: {
            type: Boolean,
            default: false
        },
        
        userLocation: {
            _id: false,
            lat: {
                type: Number,
                default: null,
                required: [true, 'Latitude is required']
            },
            long: {
                type: Number,
                default: null,
                required: [true, 'Longitude is required']
            }
        },
        
        loginInfo: {
            _id: false,
            lastLogin: {
                type: Date,
                default: null
            },
            loginCount: {
                type: Number,
                default: 0
            },
            lastLoginIP: {
                type: String,
                default: null
            },
            registrationIP: {
                type: String,
                default: null
            }
        },
        
        notifications: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: () => new mongoose.Types.ObjectId()
            },
            title: {
                type: String,
                required: [true, 'Notification title is required']
            },
            message: {
                type: String,
                required: [true, 'Notification message is required']
            },
            type: {
                type: String,
                enum: ['info', 'warning', 'error', 'success'],
                default: 'info'
            },
            isRead: {
                type: Boolean,
                default: false
            },
            readAt: {
                type: Date,
                default: null
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            expiresAt: {
                type: Date,
                default: null
            }
        }]
    },
    { 
        timestamps: true,
    }
)

userSchema.index({ roles: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ 'loginInfo.lastLogin': -1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ 'phoneNumber.internationalNumber': 1 })

userSchema.index({ roles: 1, isActive: 1 })

userSchema.virtual('isSeller').get(function() {
    return this.roles.includes(EUserRole.SELLER)
})

userSchema.virtual('unreadNotificationsCount').get(function() {
    return this.notifications?.filter(n => !n.isRead).length || 0
})

userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next()
    
    try {
        const salt = await bcrypt.genSalt(12)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (error) {
        next(error)
    }
})

userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false
    return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.hasRole = function(role) {
    return this.roles.includes(role)
}

userSchema.methods.addRole = function(role) {
    if (!this.roles.includes(role)) {
        this.roles.push(role)
    }
}

userSchema.methods.removeRole = function(role) {
    this.roles = this.roles.filter(r => r !== role)
}

userSchema.methods.addNotification = function(title, message, type = 'info', expiresAt = null) {
    this.notifications.push({
        title,
        message,
        type,
        expiresAt
    })
}

userSchema.methods.markNotificationAsRead = function(notificationId) {
    const notification = this.notifications.id(notificationId)
    if (notification) {
        notification.isRead = true
        notification.readAt = new Date()
    }
}

userSchema.methods.updateLoginInfo = function(ip) {
    this.loginInfo.lastLogin = dayjs().utc().toDate()
    this.loginInfo.loginCount += 1
    this.loginInfo.lastLoginIP = ip
}

userSchema.statics.findByRole = function(role) {
    return this.find({
        roles: role,
        isActive: true
    })
}

userSchema.statics.findSellers = function() {
    return this.find({
        roles: EUserRole.SELLER,
        isActive: true
    })
}

export default mongoose.model('User', userSchema)






// user.schema.js
import { z } from 'zod'
import { EUserRole } from '../constant/application.js'

const authSchemas = {
    register: z.object({
        emailAddress: z.string().email('Please provide a valid email address').toLowerCase().trim(),
        phoneNumber: z.string().min(1, 'Phone number is required').trim(),
        password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
        googleAuth: z
            .object({
                googleId: z.string().optional(),
                profile: z
                    .object({
                        name: z.string().optional(),
                        picture: z.string().url().optional(),
                        email: z.string().email().optional()
                    })
                    .optional()
            })
            .optional(),
        userLocation: z.object({
            lat: z.number('Latitude must be a number'),
            long: z.number('Longitude must be a number')
        }),
        role: z.enum(Object.values(EUserRole)).default(EUserRole.USER),
        consent: z.boolean().refine((val) => val === true, 'Consent is required to proceed'),
        avatar: z.string().url().optional()
    }),

    confirmationParams: z.object({
        token: z.string().min(1, 'Confirmation token is required')
    }),

    confirmationQuery: z.object({
        code: z.string().min(1, 'Confirmation code is required')
    }),

    login: z.object({
        emailAddress: z.string().email('Please provide a valid email address').toLowerCase().trim(),
        password: z.string().min(1, 'Password is required')
    }),

    googleLogin: z.object({
        googleId: z.string().min(1, 'Google ID is required'),
        profile: z.object({
            name: z.string().min(1, 'Name is required'),
            picture: z.string().url().optional(),
            email: z.string().email('Valid email is required')
        })
    }),

    refreshToken: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required')
    }),

    forgotPassword: z.object({
        emailAddress: z.string().email('Please provide a valid email address').toLowerCase().trim()
    }),

    resetPassword: z
        .object({
            token: z.string().min(1, 'Reset token is required'),
            newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
            confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters long')
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
            message: 'Passwords do not match',
            path: ['confirmPassword']
        }),

    changePassword: z
        .object({
            currentPassword: z.string().min(1, 'Current password is required'),
            newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
            confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters long')
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
            message: 'Passwords do not match',
            path: ['confirmPassword']
        })
        .refine((data) => data.currentPassword !== data.newPassword, {
            message: 'New password must be different from current password',
            path: ['newPassword']
        }),

    updateProfile: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').trim().optional(),
        phoneNumber: z.string().min(1, 'Phone number is required').trim().optional(),
        avatar: z.string().url('Avatar must be a valid URL').optional(),
        userLocation: z
            .object({
                lat: z.number('Latitude must be a number'),
                long: z.number('Longitude must be a number')
            })
            .optional()
    }),

    resendConfirmation: z.object({
        emailAddress: z.string().email('Please provide a valid email address').toLowerCase().trim()
    }),

    checkEmail: z.object({
        emailAddress: z.string().email('Please provide a valid email address').toLowerCase().trim()
    }),

    validateToken: z.object({
        token: z.string().min(1, 'Token is required')
    }),
    checkEmailAvailability: z.object({
        emailAddress: z.string().email('Please provide a valid email address').toLowerCase().trim()
    }),

    getNotifications: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        type: z.enum(['info', 'warning', 'error', 'success']).optional()
    }),

    markNotificationRead: z.object({
        notificationId: z.string().min(1, 'Notification ID is required')
    })
}

export default authSchemas