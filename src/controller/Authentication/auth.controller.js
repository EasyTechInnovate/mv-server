import crypto from 'crypto'
import User from '../../model/user.model.js'
import CompanySettings from '../../model/company-settings.model.js'
import { EUserRole, EKYCStatus, EUserType } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import quicker from '../../util/quicker.js'
import config from '../../config/config.js'
import { assignDefaultSublabelToUser, createLabelSublabel } from '../../util/sublabelHelper.js'

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
            const { firstName, lastName, emailAddress, password, userType, companyName, phoneNumber, consent, address, artistData, labelData } = req.body

            const existingUser = await User.findOne({ emailAddress })
            if (existingUser) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('An account with this email already exists. Please login to continue.')),
                    req,
                    409
                )
            }

            const { countryCode, isoCode, internationalNumber } = quicker.parsePhoneNumber(`+${phoneNumber}`)
            if (!countryCode || !isoCode || !internationalNumber) {
                return httpError(next, new Error(responseMessage.customMessage('Invalid phone number')), req, 422)
            }

            const verificationToken = quicker.generateVerificationToken()
            const verificationCode = quicker.generateVerificationCode()

            const accountId = await quicker.generateAccountId(userType, User)

            const userData = {
                firstName,
                lastName,
                accountId,
                emailAddress,
                password,
                role: EUserRole.USER,
                userType,
                phoneNumber:{
                    countryCode,
                    isoCode,
                    internationalNumber
                },
                consent,
                address,
                isActive: true,
                isEmailVerified: false,
                accountConfirmation: {
                    token: verificationToken,
                    code: verificationCode,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    isUsed: false
                }
            }

            if (userType === 'artist' && artistData) {
                userData.artistData = artistData
            }
            
            if (userType === 'label' && labelData) {
                userData.labelData = labelData
            }

            if (companyName) {
                userData.companyName = companyName
            }

            const newUser = new User(userData)
            await newUser.save()

            if (userType === EUserType.ARTIST) {
                try {
                    await assignDefaultSublabelToUser(newUser._id, userType)
                } catch (error) {
                    console.error('Failed to assign default sublabel to artist:', error)
                }
            }

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
                    accountId: newUser.accountId,
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

            const user = await User.findOne({ emailAddress })
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid email or password 1')),
                    req,
                    401
                )
            }

            const isPasswordValid = await user.comparePassword(password)
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

            let responseData

            if (user.role === EUserRole.ADMIN) {
                // Admin login response with company setup status
                const companySettings = await CompanySettings.findOne({ status: 'active' })
                const isCompanySetupComplete = companySettings ? companySettings.isSetupComplete : false

                responseData = {
                    user: {
                        _id: user._id,
                        accountId: user.accountId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        emailAddress: user.emailAddress,
                        role: user.role,
                        isEmailVerified: user.isEmailVerified
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    },
                    companySetup: {
                        isComplete: isCompanySetupComplete,
                        message: isCompanySetupComplete
                            ? 'Company setup is complete'
                            : 'Please complete company settings including social media links and contact information',
                        nextStep: isCompanySetupComplete ? null : 'complete_company_settings',
                        redirectTo: isCompanySetupComplete ? '/admin/dashboard' : '/admin/company-settings'
                    }
                }
            } else {
                // Regular user login response with KYC status
                const accountStatus = quicker.getAccountStatus(user)

                responseData = {
                    user: {
                        _id: user._id,
                        accountId: user.accountId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        emailAddress: user.emailAddress,
                        role: user.role,
                        userType: user.userType,
                        isEmailVerified: user.isEmailVerified,
                        profileCompletion: user.profileCompletion,
                        hasActiveSubscription: user.hasActiveSubscription,
                        subscription: user.subscription,
                        kycStatus: user.kycStatus
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    },
                    accountStatus: accountStatus
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

            const user = await User.findOne({ emailAddress })
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
                'passwordReset.isUsed': false
            })

            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid or expired reset token')),
                    req,
                    400
                )
            }

            user.password = password
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
            const isCurrentPasswordValid = await user.comparePassword(currentPassword)

            if (!isCurrentPasswordValid) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Current password is incorrect')),
                    req,
                    400
                )
            }

            user.password = newPassword
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
                    accountId: user.accountId,
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
                    socialMedia: user.socialMedia,
                    kyc: user.kyc,
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
                        accountId: user.accountId,
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

            const existingAdmin = await User.findOne({ role: EUserRole.ADMIN })
            if (existingAdmin) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('An admin user already exists')),
                    req,
                    409
                )
            }

            const accountId = await quicker.generateAccountId('admin', User)

            const adminUser = new User({
                firstName,
                lastName,
                accountId,
                emailAddress,
                password,
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
            
            await adminUser.save()

            // Check company settings completion status
            const companySettings = await CompanySettings.findOne({ status: 'active' })
            const isCompanySetupComplete = companySettings ? companySettings.isSetupComplete : false

            const responseData = {
                admin: {
                    _id: adminUser._id,
                    accountId: adminUser.accountId,
                    firstName: adminUser.firstName,
                    lastName: adminUser.lastName,
                    emailAddress: adminUser.emailAddress,
                    role: adminUser.role,
                    createdAt: adminUser.createdAt
                },
                companySetup: {
                    isComplete: isCompanySetupComplete,
                    message: isCompanySetupComplete
                        ? 'Company setup is complete'
                        : 'Please complete company settings including social media links and contact information'
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
    },
    async verifyKYC(req, res, next) {
      try {
        const userId = req.authenticatedUser._id;
        const { 
          documents, 
          bankDetails, 
          upiDetails 
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
          return httpError(
            next,
            new Error(responseMessage.customMessage('User not found')),
            req,
            404
          );
        }

        if (!user.isEmailVerified) {
          return httpError(
            next,
            new Error(responseMessage.customMessage('Please verify your email address first')),
            req,
            400
          );
        }

        if (user.kyc.status === EKYCStatus.VERIFIED) {
          return httpError(
            next,
            new Error(responseMessage.customMessage('KYC already verified')),
            req,
            400
          );
        }

        // Update KYC information using the correct schema structure - mark as verified immediately
        if (documents) {
          if (documents.aadhaar) {
            user.kyc.documents.aadhaar = {
              number: documents.aadhaar.number,
              documentUrl: documents.aadhaar.documentUrl,
              verified: true // Mark as verified immediately
            };
            user.kyc.aadhaarVerified = true;
          }

          if (documents.pan) {
            user.kyc.documents.pan = {
              number: documents.pan.number,
              documentUrl: documents.pan.documentUrl,
              verified: true // Mark as verified immediately
            };
            user.kyc.panVerified = true;
          }
        }

        if (bankDetails) {
          user.kyc.bankDetails = {
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            accountHolderName: bankDetails.accountHolderName,
            bankName: bankDetails.bankName,
            verified: true // Mark as verified immediately
          };
        }

        if (upiDetails) {
          user.kyc.upiDetails = {
            upiId: upiDetails.upiId,
            verified: true // Mark as verified immediately
          };
        }

        // Update KYC status and timestamps - mark as verified immediately
        user.kyc.status = EKYCStatus.VERIFIED; // Mark as verified immediately
        user.kyc.submittedAt = new Date();
        user.kyc.verifiedAt = new Date(); // Set verification timestamp immediately
        user.kyc.rejectedAt = null; // Reset rejection timestamp
        
        // Also update the kycStatus object for consistency
        user.kycStatus.status = 'verified';
        user.kycStatus.submittedAt = new Date();
        user.kycStatus.isCompleted = true; // Set to true when verified (never from payload)
        user.kycStatus.verifiedAt = new Date(); // Set verification timestamp

        await user.save();

        user.addNotification(
          'KYC Verified',
          'Your KYC information has been successfully verified and approved.',
          'success'
        );

        await user.save(); // Save again to persist notification

        return httpResponse(
          req,
          res,
          200,
          responseMessage.customMessage('KYC information verified successfully'),
          {
            kycStatus: user.kyc.status,
            submittedAt: user.kyc.submittedAt,
            verifiedAt: user.kyc.verifiedAt,
            isCompleted: user.kycStatus.isCompleted,
            kyc: {
              documents: user.kyc.documents,
              bankDetails: user.kyc.bankDetails,
              upiDetails: user.kyc.upiDetails
            }
          }
        );
      } catch (err) {
        return httpError(next, err, req, 500);
      }
    }
}