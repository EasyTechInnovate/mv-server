import crypto from 'crypto'
import User from '../../model/user.model.js'
import CompanySettings from '../../model/company-settings.model.js'
import { EUserRole, EKYCStatus, EUserType, EResidencyType, EPayoutMethod } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import quicker from '../../util/quicker.js'
import config from '../../config/config.js'
import { assignDefaultSublabelToUser, createLabelSublabel } from '../../util/sublabelHelper.js'
import { sendForgotPasswordEmail, sendVerificationEmail, sendWelcomeEmail, sendDistributionAgreementEmail, sendKycPendingEmail } from '../../service/emailService.js'

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

            let welcomeMessage = "Your account has been created successfully. Please check your email to verify your account.";
            if (userType === 'artist') {
                welcomeMessage = "We're absolutely thrilled to have you on board! 🎶 Please verify your email to start releasing your music to the world.";
            } else if (userType === 'label') {
                welcomeMessage = "We're excited to partner with your label! 🎵 Please verify your email to start managing your catalog and artists.";
            } else if (userType === 'aggregator') {
                welcomeMessage = "We're glad to partner with you! 🤝 Please verify your email to start exploring our powerful aggregator services.";
            }

            newUser.addNotification(
                'Welcome to Maheshwari Visuals! 🎉',
                welcomeMessage,
                'success'
            )

            if (userType === 'label') {
                newUser.addNotification(
                    'Label Activation Status ⏳',
                    'Your custom label name will be officially assigned and activated within 24 hours after your subscription plan is activated.',
                    'info'
                )
            }

            const verificationUrl = `${config.client.url}/verify-email?token=${verificationToken}`

            // Send Verification Email
            try {
                await sendVerificationEmail(newUser.emailAddress, newUser.firstName, verificationCode)
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError)
            }

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

            // Block Inactive Accounts
            if (!user.isActive) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Your account is inactive. Please contact your administrator.')),
                    req,
                    403
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
            } else if (user.role === EUserRole.TEAM_MEMBER) {
                // Team member login — include moduleAccess for frontend access control
                if (!user.isActive || !user.isInvitationAccepted) {
                    return httpError(
                        next,
                        new Error(responseMessage.customMessage('Your account is not active. Please accept the invitation or contact your administrator.')),
                        req,
                        403
                    )
                }

                responseData = {
                    user: {
                        _id: user._id,
                        accountId: user.accountId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        emailAddress: user.emailAddress,
                        role: user.role,
                        teamRole: user.teamRole,
                        mobileNumber: user.mobileNumber,
                        moduleAccess: user.moduleAccess || [],
                        isActive: user.isActive,
                        isEmailVerified: user.isEmailVerified
                    },
                    tokens: {
                        accessToken,
                        refreshToken
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
                        hasActiveAggregatorSubscription: user.hasActiveAggregatorSubscription,
                        subscription: user.subscription,
                        aggregatorSubscription: user.aggregatorSubscription,
                        kycStatus: user.kycStatus,
                        aggregatorBanner: user.aggregatorBanner,
                        aggregatorData: user.aggregatorData
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
            const { emailAddress, redirectUrl } = req.body

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

            const baseUrl = redirectUrl || config.client.url
            const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

            user.addNotification(
                'Password Reset Request',
                `A password reset request has been made for your account. The reset link expires in 1 hour.`,
                'info'
            )

            // Send Forgot Password Email
            try {
                await sendForgotPasswordEmail(user.emailAddress, user.firstName, resetUrl)
            } catch (emailError) {
                console.error('Failed to send forgot password email:', emailError)
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('If an account with this email exists, a password reset link has been sent')
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
                    phoneNumber: user.phoneNumber,
                    isEmailVerified: user.isEmailVerified,
                    profileCompletion: user.profileCompletion,
                    hasActiveSubscription: user.hasActiveSubscription,
                    hasActiveAggregatorSubscription: user.hasActiveAggregatorSubscription,
                    subscription: user.subscription,
                    aggregatorSubscription: user.aggregatorSubscription,
                    featureAccess: user.featureAccess,
                    socialMedia: user.socialMedia,
                    kyc: user.kyc,
                    payoutMethods: user.payoutMethods,
                    aggregatorBanner: user.aggregatorBanner,
                    profile: user.profile,
                    artistData: user.artistData,
                    labelData: user.labelData,
                    aggregatorData: user.aggregatorData,
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
            const { emailAddress, code } = req.body

            const user = await User.findOne({
                emailAddress,
                'accountConfirmation.expiresAt': { $gt: new Date() },
                'accountConfirmation.isUsed': false,
                isActive: true
            })

            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid or expired verification. Please request a new code.')),
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

            sendWelcomeEmail(user.emailAddress, user.firstName).catch(() => {})
            sendDistributionAgreementEmail(user.emailAddress, user.firstName).catch(() => {})

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

            // Send Verification Email
            try {
                await sendVerificationEmail(user.emailAddress, user.firstName, verificationCode)
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError)
            }

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
          residencyType,
          details
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

        // Update KYC information based on residency type
        user.kyc.residencyType = residencyType || EResidencyType.INDIAN;
        
        if (user.kyc.residencyType === EResidencyType.INDIAN) {
          user.kyc.details.aadhaarNumber = details?.aadhaarNumber || null;
          user.kyc.details.panNumber = details?.panNumber || null;
          user.kyc.details.gstUdhyamNumber = details?.gstUdhyamNumber || null;
          // Clear foreign fields
          user.kyc.details.passportNumber = null;
          user.kyc.details.vatNumber = null;
        } else {
          user.kyc.details.passportNumber = details?.passportNumber || null;
          user.kyc.details.vatNumber = details?.vatNumber || null;
          // Clear Indian fields
          user.kyc.details.aadhaarNumber = null;
          user.kyc.details.panNumber = null;
          user.kyc.details.gstUdhyamNumber = null;
        }

        // Update KYC status and timestamps - set to PENDING for admin review
        user.kyc.status = EKYCStatus.PENDING;
        user.kyc.submittedAt = new Date();
        
        // Mark payout methods as needing verification if they are updated here (though they shouldn't be anymore)
        // Since we decoupled them, we don't reset payout methods here.

        user.kyc.verifiedAt = null; 
        user.kyc.verifiedBy = null;
        user.kyc.rejectionReason = null; 

        // Also update the kycStatus object for consistency
        if (user.kycStatus) {
            user.kycStatus.status = 'pending';
        }

        await user.save();

        user.addNotification(
          'KYC Verified',
          'Your KYC information has been successfully verified and approved.',
          'success'
        );

        await user.save(); // Save again to persist notification

        sendKycPendingEmail(user.emailAddress, user.firstName).catch(() => {})

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
    },

    // Update Profile API
    async updateProfile(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const {
                firstName,
                lastName,
                phoneNumber,
                address,
                profile,
                artistData,
                labelData,
                aggregatorData
            } = req.body

            const user = await User.findById(userId)
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('User not found')),
                    req,
                    404
                )
            }

            // Update basic info
            if (firstName) user.firstName = firstName
            if (lastName) user.lastName = lastName

            // Update phone number
            if (phoneNumber) {
                const { countryCode, isoCode, internationalNumber } = quicker.parsePhoneNumber(`+${phoneNumber}`)
                if (countryCode && isoCode && internationalNumber) {
                    user.phoneNumber = { countryCode, isoCode, internationalNumber }
                }
            }

            // Update address
            if (address) {
                if (address.street !== undefined) user.address.street = address.street
                if (address.city !== undefined) user.address.city = address.city
                if (address.state !== undefined) user.address.state = address.state
                if (address.country !== undefined) user.address.country = address.country
                if (address.pinCode !== undefined) user.address.pinCode = address.pinCode
            }

            // Update profile
            if (profile) {
                if (profile.photo !== undefined) user.profile.photo = profile.photo
                if (profile.bio !== undefined) user.profile.bio = profile.bio
                if (profile.primaryGenre !== undefined) user.profile.primaryGenre = profile.primaryGenre
                if (profile.location) {
                    if (profile.location.lat !== undefined) user.profile.location.lat = profile.location.lat
                    if (profile.location.long !== undefined) user.profile.location.long = profile.location.long
                    if (profile.location.address !== undefined) user.profile.location.address = profile.location.address
                }
            }

            // Update artist data (only for artists)
            if (artistData && user.userType === EUserType.ARTIST) {
                if (artistData.artistName !== undefined) user.artistData.artistName = artistData.artistName
                if (artistData.youtubeLink !== undefined) user.artistData.youtubeLink = artistData.youtubeLink
                if (artistData.instagramLink !== undefined) user.artistData.instagramLink = artistData.instagramLink
                if (artistData.facebookLink !== undefined) user.artistData.facebookLink = artistData.facebookLink
            }

            // Update label data (only for labels)
            if (labelData && user.userType === EUserType.LABEL) {
                if (labelData.labelName !== undefined) user.labelData.labelName = labelData.labelName
                if (labelData.youtubeLink !== undefined) user.labelData.youtubeLink = labelData.youtubeLink
                if (labelData.websiteLink !== undefined) user.labelData.websiteLink = labelData.websiteLink
                if (labelData.popularReleaseLink !== undefined) user.labelData.popularReleaseLink = labelData.popularReleaseLink
                if (labelData.popularArtistLinks !== undefined) user.labelData.popularArtistLinks = labelData.popularArtistLinks
                if (labelData.totalReleases !== undefined) user.labelData.totalReleases = labelData.totalReleases
                if (labelData.releaseFrequency !== undefined) user.labelData.releaseFrequency = labelData.releaseFrequency
                if (labelData.monthlyReleasePlans !== undefined) user.labelData.monthlyReleasePlans = labelData.monthlyReleasePlans
                if (labelData.briefInfo !== undefined) user.labelData.briefInfo = labelData.briefInfo
            }

            // Update aggregator data (only for aggregators)
            if (aggregatorData && user.userType === EUserType.AGGREGATOR) {
                if (aggregatorData.companyName !== undefined) user.aggregatorData.companyName = aggregatorData.companyName
                if (aggregatorData.youtubeLink !== undefined) user.aggregatorData.youtubeLink = aggregatorData.youtubeLink
                if (aggregatorData.websiteLink !== undefined) user.aggregatorData.websiteLink = aggregatorData.websiteLink
                if (aggregatorData.instagramUrl !== undefined) user.aggregatorData.instagramUrl = aggregatorData.instagramUrl
                if (aggregatorData.facebookUrl !== undefined) user.aggregatorData.facebookUrl = aggregatorData.facebookUrl
                if (aggregatorData.linkedinUrl !== undefined) user.aggregatorData.linkedinUrl = aggregatorData.linkedinUrl
                if (aggregatorData.popularReleaseLinks !== undefined) user.aggregatorData.popularReleaseLinks = aggregatorData.popularReleaseLinks
                if (aggregatorData.popularArtistLinks !== undefined) user.aggregatorData.popularArtistLinks = aggregatorData.popularArtistLinks
                if (aggregatorData.associatedLabels !== undefined) user.aggregatorData.associatedLabels = aggregatorData.associatedLabels
                if (aggregatorData.totalReleases !== undefined) user.aggregatorData.totalReleases = aggregatorData.totalReleases
                if (aggregatorData.releaseFrequency !== undefined) user.aggregatorData.releaseFrequency = aggregatorData.releaseFrequency
                if (aggregatorData.monthlyReleasePlans !== undefined) user.aggregatorData.monthlyReleasePlans = aggregatorData.monthlyReleasePlans
                if (aggregatorData.briefInfo !== undefined) user.aggregatorData.briefInfo = aggregatorData.briefInfo
            }

            // Recalculate profile completion
            user.calculateProfileCompletion()

            await user.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Profile updated successfully'),
                {
                    user: {
                        _id: user._id,
                        accountId: user.accountId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        emailAddress: user.emailAddress,
                        role: user.role,
                        userType: user.userType,
                        phoneNumber: user.phoneNumber,
                        isEmailVerified: user.isEmailVerified,
                        address: user.address,
                        profile: user.profile,
                        artistData: user.artistData,
                        labelData: user.labelData,
                        aggregatorData: user.aggregatorData,
                        profileCompletion: user.profileCompletion,
                        subscription: user.subscription,
                        featureAccess: user.featureAccess,
                        socialMedia: user.socialMedia,
                        kyc: user.kyc,
                        payoutMethods: user.payoutMethods,
                        aggregatorBanner: user.aggregatorBanner,
                        createdAt: user.createdAt
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    // Update Social Media API
    async updateSocialMedia(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const {
                spotify,
                instagram,
                youtube,
                tiktok,
                linkedin,
                website,
                facebook,
                twitter
            } = req.body

            const user = await User.findById(userId)
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('User not found')),
                    req,
                    404
                )
            }

            // Update social media links
            if (spotify !== undefined) user.socialMedia.spotify = spotify
            if (instagram !== undefined) user.socialMedia.instagram = instagram
            if (youtube !== undefined) user.socialMedia.youtube = youtube
            if (tiktok !== undefined) user.socialMedia.tiktok = tiktok
            if (linkedin !== undefined) user.socialMedia.linkedin = linkedin
            if (website !== undefined) user.socialMedia.website = website
            if (facebook !== undefined) user.socialMedia.facebook = facebook
            if (twitter !== undefined) user.socialMedia.twitter = twitter

            await user.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Social media links updated successfully'),
                {
                    socialMedia: user.socialMedia
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    // Get Active Sessions API
    async getSessions(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const currentToken = req.headers.authorization?.split(' ')[1]

            const user = await User.findById(userId).select('refreshTokens lastLoginAt loginInfo')
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('User not found')),
                    req,
                    404
                )
            }

            // Get session info from refresh tokens
            const sessions = user.refreshTokens.map((token, index) => {
                // Decode token to get creation time (if possible)
                let createdAt = null
                try {
                    const decoded = quicker.verifyToken(token, config.auth.jwtRefreshSecret)
                    createdAt = decoded.iat ? new Date(decoded.iat * 1000) : null
                } catch (e) {
                    // Token might be expired or invalid
                }

                return {
                    sessionId: index,
                    isCurrentSession: token === currentToken,
                    createdAt: createdAt,
                    lastActivity: index === user.refreshTokens.length - 1 ? user.loginInfo?.lastLogin : null
                }
            })

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    totalSessions: user.refreshTokens.length,
                    sessions: sessions,
                    loginInfo: {
                        lastLogin: user.loginInfo?.lastLogin,
                        loginCount: user.loginInfo?.loginCount,
                        lastLoginIP: user.loginInfo?.lastLoginIP
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    // Revoke Session API
    async revokeSession(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { sessionId } = req.params
            const currentToken = req.headers.authorization?.split(' ')[1]

            const user = await User.findById(userId)
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('User not found')),
                    req,
                    404
                )
            }

            const sessionIndex = parseInt(sessionId)
            if (isNaN(sessionIndex) || sessionIndex < 0 || sessionIndex >= user.refreshTokens.length) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid session ID')),
                    req,
                    400
                )
            }

            // Check if trying to revoke current session
            if (user.refreshTokens[sessionIndex] === currentToken) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Cannot revoke current session. Use logout instead.')),
                    req,
                    400
                )
            }

            // Remove the session
            user.refreshTokens.splice(sessionIndex, 1)
            await user.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Session revoked successfully'),
                {
                    remainingSessions: user.refreshTokens.length
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    // Revoke All Other Sessions API
    async revokeAllOtherSessions(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const { refreshToken } = req.body

            const user = await User.findById(userId)
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('User not found')),
                    req,
                    404
                )
            }

            // Keep only the current session's refresh token
            if (refreshToken && user.refreshTokens.includes(refreshToken)) {
                user.refreshTokens = [refreshToken]
            } else {
                // If no valid refresh token provided, clear all
                user.refreshTokens = []
            }

            await user.save()

            user.addNotification(
                'Sessions Revoked',
                'All other sessions have been logged out successfully.',
                'info'
            )
            await user.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('All other sessions have been revoked successfully'),
                {
                    remainingSessions: user.refreshTokens.length
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async updatePayoutMethods(req, res, next) {
        try {
            const userId = req.authenticatedUser._id;
            const { bank, upi, paypal, primaryMethod } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404);
            }

            if (primaryMethod) {
                if (!Object.values(EPayoutMethod).includes(primaryMethod)) {
                    return httpError(next, new Error(responseMessage.customMessage('Invalid primary payout method')), req, 400);
                }
                user.payoutMethods.primaryMethod = primaryMethod;
            }

            if (bank) {
                if (bank.accountNumber && !/^\d{9,18}$/.test(bank.accountNumber)) {
                    return httpError(next, new Error(responseMessage.customMessage('Invalid Bank Account Number (9-18 digits)')), req, 400);
                }
                user.payoutMethods.bank.accountHolderName = bank.accountHolderName ?? user.payoutMethods.bank.accountHolderName;
                user.payoutMethods.bank.bankName = bank.bankName ?? user.payoutMethods.bank.bankName;
                user.payoutMethods.bank.accountNumber = bank.accountNumber ?? user.payoutMethods.bank.accountNumber;
                user.payoutMethods.bank.ifscSwiftCode = bank.ifscSwiftCode ?? user.payoutMethods.bank.ifscSwiftCode;
                user.payoutMethods.bank.verified = false;
            }

            if (upi) {
                if (upi.upiId && !/^[\w.-]+@[\w.-]+$/.test(upi.upiId)) {
                    return httpError(next, new Error(responseMessage.customMessage('Invalid UPI ID format')), req, 400);
                }
                user.payoutMethods.upi.upiId = upi.upiId ?? user.payoutMethods.upi.upiId;
                user.payoutMethods.upi.accountHolderName = upi.accountHolderName ?? user.payoutMethods.upi.accountHolderName;
                user.payoutMethods.upi.verified = false;
            }

            if (paypal) {
                if (paypal.paypalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal.paypalEmail)) {
                    return httpError(next, new Error(responseMessage.customMessage('Invalid PayPal Email format')), req, 400);
                }
                user.payoutMethods.paypal.accountName = paypal.accountName ?? user.payoutMethods.paypal.accountName;
                user.payoutMethods.paypal.paypalEmail = paypal.paypalEmail ?? user.payoutMethods.paypal.paypalEmail;
                user.payoutMethods.paypal.verified = false;
            }

            await user.save();

            return httpResponse(req, res, 200, responseMessage.customMessage('Payout methods updated successfully'), {
                payoutMethods: user.payoutMethods
            });
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },
}
