import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import User from '../../model/user.model.js'
import { EUserRole } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import quicker from '../../util/quicker.js'
import config from '../../config/config.js'

export default {
    async self (req, res, next) {
      try {
        httpResponse(req, res, 200, responseMessage.SERVICE('Authentication'));
      } catch (err) {
        httpError(next, err, req, 500);
      }
    },

    async register(req, res, next) {
        try {
            const { firstName, lastName, emailAddress, password, userType, companyName, phoneNumber } = req.body

            const existingUser = await User.findOne({ emailAddress })
            if (existingUser) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('User with this email already exists')),
                    req,
                    409
                )
            }

            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(password, salt)

            const verificationToken = quicker.generateVerificationToken()
            const verificationCode = quicker.generateVerificationCode()

            const userData = {
                firstName,
                lastName,
                emailAddress,
                password: hashedPassword,
                role: EUserRole.USER,
                userType,
                phoneNumber: phoneNumber || null,
                isActive: true,
                isEmailVerified: false,
                accountConfirmation: {
                    token: verificationToken,
                    code: verificationCode,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    isUsed: false
                }
            }

            if (companyName) {
                userData.companyName = companyName
            }

            const newUser = new User(userData)
            await newUser.save()

            const payload = {
                userId: newUser._id,
                emailAddress: newUser.emailAddress,
                role: newUser.role,
                userType: newUser.userType
            }

            const accessToken = quicker.generateToken(
                payload,
                config.auth.jwtSecret,
                config.auth.jwtExpiresIn
            )

            const refreshToken = quicker.generateToken(
                { userId: newUser._id },
                config.auth.jwtRefreshSecret,
                config.auth.jwtRefreshExpiresIn
            )

            newUser.refreshTokens.push(refreshToken)
            await newUser.save()

            newUser.addNotification(
                'Welcome!',
                'Your account has been created successfully. Please check your email to verify your account.',
                'success'
            )

            const verificationUrl = `${config.client.url}/verify-email?token=${verificationToken}`

            const responseData = {
                user: {
                    _id: newUser._id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    emailAddress: newUser.emailAddress,
                    role: newUser.role,
                    userType: newUser.userType,
                    isEmailVerified: newUser.isEmailVerified,
                    profileCompletion: newUser.profileCompletion
                },
                tokens: {
                    accessToken,
                    refreshToken
                },
                verification: {
                    verificationUrl,
                    verificationCode,
                    message: 'Please verify your email to activate your account'
                }
            }

            return httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('Account created successfully'),
                responseData
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async login(req, res, next) {
        try {
            const { emailAddress, password } = req.body

            const user = await User.findOne({ emailAddress, isActive: true })
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid email or password')),
                    req,
                    401
                )
            }

            const isPasswordValid = await bcrypt.compare(password, user.password)
            if (!isPasswordValid) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid email or password')),
                    req,
                    401
                )
            }

            const payload = {
                userId: user._id,
                emailAddress: user.emailAddress,
                role: user.role,
                userType: user.userType
            }

            const accessToken = quicker.generateToken(
                payload,
                config.auth.jwtSecret,
                config.auth.jwtExpiresIn
            )

            const refreshToken = quicker.generateToken(
                { userId: user._id },
                config.auth.jwtRefreshSecret,
                config.auth.jwtRefreshExpiresIn
            )

            user.refreshTokens.push(refreshToken)
            user.lastLoginAt = new Date()
            await user.save()

            const responseData = {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailAddress: user.emailAddress,
                    role: user.role,
                    userType: user.userType,
                    isEmailVerified: user.isEmailVerified,
                    profileCompletion: user.profileCompletion,
                    hasActiveSubscription: user.hasActiveSubscription,
                    subscription: user.subscription
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Login successful'),
                responseData
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body

            const payload = quicker.verifyToken(refreshToken, config.auth.jwtRefreshSecret)
            const user = await User.findById(payload.userId)

            if (!user || !user.refreshTokens.includes(refreshToken) || !user.isActive) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid refresh token')),
                    req,
                    401
                )
            }

            const newAccessToken = quicker.generateToken(
                {
                    userId: user._id,
                    emailAddress: user.emailAddress,
                    role: user.role,
                    userType: user.userType
                },
                config.auth.jwtSecret,
                config.auth.jwtExpiresIn
            )

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Token refreshed successfully'),
                { accessToken: newAccessToken }
            )
        } catch (err) {
            return httpError(
                next,
                new Error(responseMessage.customMessage('Invalid refresh token')),
                req,
                401
            )
        }
    },

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body
            const userId = req.authenticatedUser._id

            if (refreshToken) {
                const user = await User.findById(userId)
                user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken)
                await user.save()
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Logged out successfully')
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async logoutAll(req, res, next) {
        try {
            const userId = req.authenticatedUser._id

            const user = await User.findById(userId)
            user.refreshTokens = []
            await user.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Logged out from all devices successfully')
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async forgotPassword(req, res, next) {
        try {
            const { emailAddress } = req.body

            const user = await User.findOne({ emailAddress, isActive: true })
            if (!user) {
                return httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.customMessage('If an account with this email exists, a password reset link has been sent')
                )
            }

            const resetToken = crypto.randomBytes(32).toString('hex')
            const resetTokenExpiry = new Date(Date.now() + 3600000)

            user.passwordReset = {
                token: resetToken,
                expiresAt: resetTokenExpiry,
                isUsed: false
            }
            await user.save()

            const resetUrl = `${config.client.url}/reset-password?token=${resetToken}`

            user.addNotification(
                'Password Reset Request',
                `A password reset request has been made for your account. The reset link expires in 1 hour.`,
                'info'
            )

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('If an account with this email exists, a password reset link has been sent'),
                { resetUrl }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body

            const user = await User.findOne({
                'passwordReset.token': token,
                'passwordReset.expiresAt': { $gt: new Date() },
                'passwordReset.isUsed': false,
                isActive: true
            })

            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid or expired reset token')),
                    req,
                    400
                )
            }

            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(password, salt)

            user.password = hashedPassword
            user.passwordReset = {
                token: null,
                expiresAt: null,
                isUsed: true
            }
            user.refreshTokens = []
            await user.save()

            user.addNotification(
                'Password Reset Successful',
                'Your password has been reset successfully. Please login with your new password.',
                'success'
            )

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Password reset successfully')
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body
            const userId = req.authenticatedUser._id

            const user = await User.findById(userId)
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

            if (!isCurrentPasswordValid) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Current password is incorrect')),
                    req,
                    400
                )
            }

            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(newPassword, salt)

            user.password = hashedPassword
            user.refreshTokens = []
            await user.save()

            user.addNotification(
                'Password Changed',
                'Your password has been changed successfully. You have been logged out from all devices.',
                'success'
            )

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Password changed successfully')
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getProfile(req, res, next) {
        try {
            const userId = req.authenticatedUser._id

            const user = await User.findById(userId).select('-password -refreshTokens -passwordReset')

            const responseData = {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailAddress: user.emailAddress,
                    role: user.role,
                    userType: user.userType,
                    companyName: user.companyName,
                    phoneNumber: user.phoneNumber,
                    isEmailVerified: user.isEmailVerified,
                    profileCompletion: user.profileCompletion,
                    hasActiveSubscription: user.hasActiveSubscription,
                    subscription: user.subscription,
                    featureAccess: user.featureAccess,
                    createdAt: user.createdAt
                }
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, responseData)
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async verifyEmail(req, res, next) {
        try {
            const { token, code } = req.body

            const user = await User.findOne({
                'accountConfirmation.token': token,
                'accountConfirmation.expiresAt': { $gt: new Date() },
                'accountConfirmation.isUsed': false,
                isActive: true
            })

            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid or expired verification token')),
                    req,
                    400
                )
            }

            if (user.accountConfirmation.code !== code) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid verification code')),
                    req,
                    400
                )
            }

            user.isEmailVerified = true
            user.accountConfirmation = {
                token: null,
                code: null,
                expiresAt: null,
                isUsed: true
            }
            await user.save()

            user.addNotification(
                'Email Verified',
                'Your email has been verified successfully. You can now access all features.',
                'success'
            )

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Email verified successfully'),
                {
                    user: {
                        _id: user._id,
                        emailAddress: user.emailAddress,
                        isEmailVerified: user.isEmailVerified
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async resendVerification(req, res, next) {
        try {
            const { emailAddress } = req.body

            const user = await User.findOne({ 
                emailAddress, 
                isActive: true,
                isEmailVerified: false
            })

            if (!user) {
                return httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.customMessage('If an unverified account with this email exists, a verification email has been sent')
                )
            }

            const verificationToken = quicker.generateVerificationToken()
            const verificationCode = quicker.generateVerificationCode()

            user.accountConfirmation = {
                token: verificationToken,
                code: verificationCode,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                isUsed: false
            }
            await user.save()

            const verificationUrl = `${config.client.url}/verify-email?token=${verificationToken}`

            user.addNotification(
                'Verification Email Sent',
                'A new verification email has been sent to your email address.',
                'info'
            )

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('If an unverified account with this email exists, a verification email has been sent'),
                {
                    verificationUrl,
                    verificationCode
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async createAdmin(req, res, next) {
        try {
            const { firstName, lastName, emailAddress, password } = req.body

            const existingUser = await User.findOne({ emailAddress })
            if (existingUser) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('User with this email already exists')),
                    req,
                    409
                )
            }

            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(password, salt)

            const adminUser = new User({
                firstName,
                lastName,
                emailAddress,
                password: hashedPassword,
                role: EUserRole.ADMIN,
                isActive: true,
                isEmailVerified: true
            })

            await adminUser.save()

            adminUser.addNotification(
                'Admin Account Created',
                'Your admin account has been created successfully.',
                'success'
            )

            const responseData = {
                admin: {
                    _id: adminUser._id,
                    firstName: adminUser.firstName,
                    lastName: adminUser.lastName,
                    emailAddress: adminUser.emailAddress,
                    role: adminUser.role,
                    createdAt: adminUser.createdAt
                }
            }

            return httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('Admin user created successfully'),
                responseData
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}