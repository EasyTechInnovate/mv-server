import os from 'os';
import crypto from 'crypto';
import config from '../config/config.js';
import jwt from 'jsonwebtoken'
import parsePhoneNumber from 'libphonenumber-js'

export default {
    getSystemHealth: () => {
        return {
            cpuUsage: os.loadavg(),
            totalMemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
            freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`,
        };
    },
    getApplicationHealth: () => {
        return {
            environment: config.env,
            uptime: `${process.uptime().toFixed(2)} Seconds`,
            memoryUsage: {
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            },
        };
    },
    generateToken: (payload, secret, expiry) => {
        return jwt.sign(payload, secret, {
            expiresIn: expiry
        })
    },
    verifyToken: (token, secret) => {
        return jwt.verify(token, secret)
    },
    generateVerificationCode: () => {
        return Math.floor(100000 + Math.random() * 900000).toString()
    },
    generateVerificationToken: () => {
        return crypto.randomBytes(32).toString('hex')
    },
    generateAccountId: async (userType, User) => {
        const prefixes = {
            'artist': 'MV/A/',
            'label': 'MV/L/',
            'aggregator': 'MV/AG/',
            'admin': 'MV/AD/',
            'team_member': 'MV/TM/'
        }

        const prefix = prefixes[userType]
        if (!prefix) {
            throw new Error('Invalid user type for account ID generation')
        }

        const latestUser = await User.findOne({
            accountId: { $regex: `^${prefix.replace('/', '\\/')}` }
        }).sort({ accountId: -1 })

        let nextNumber = 1
        if (latestUser && latestUser.accountId) {
            const currentNumber = parseInt(latestUser.accountId.split('/').pop())
            nextNumber = currentNumber + 1
        }

        const accountId = `${prefix}${String(nextNumber).padStart(2, '0')}`
        return accountId
    },
    generateReleaseId: async (releaseType, trackType, ReleaseModel) => {
        const prefixes = {
            'basic_single': 'RE-B-S-',
            'basic_album': 'RE-B-A-',
            'advance_single': 'RE-A-S-',
            'advance_album': 'RE-A-A-'
        }

        const key = `${releaseType}_${trackType}`
        const prefix = prefixes[key]
        if (!prefix) {
            throw new Error('Invalid release type or track type for release ID generation')
        }

        const latestRelease = await ReleaseModel.findOne({
            releaseId: { $regex: `^${prefix.replace('-', '\\-')}` }
        }).sort({ releaseId: -1 })

        let nextNumber = 1
        if (latestRelease && latestRelease.releaseId) {
            const currentNumber = parseInt(latestRelease.releaseId.split('-').pop())
            nextNumber = currentNumber + 1
        }

        const releaseId = `${prefix}${String(nextNumber).padStart(3, '0')}`
        return releaseId
    },

    generateSublabelId: async (SublabelModel) => {
        const prefix = 'SUB-'

        const latestSublabel = await SublabelModel.findOne({
            sublabelId: { $regex: `^${prefix}` }
        }).sort({ sublabelId: -1 })

        let nextNumber = 1
        if (latestSublabel && latestSublabel.sublabelId) {
            const currentNumber = parseInt(latestSublabel.sublabelId.split('-').pop())
            nextNumber = currentNumber + 1
        }

        const sublabelId = `${prefix}${String(nextNumber).padStart(3, '0')}`
        return sublabelId
    },

    generateTicketId: async (TicketModel) => {
        const prefix = 'TKT-'

        const latestTicket = await TicketModel.findOne({
            ticketId: { $regex: `^${prefix}` }
        }).sort({ ticketId: -1 })

        let nextNumber = 1
        if (latestTicket && latestTicket.ticketId) {
            const currentNumber = parseInt(latestTicket.ticketId.split('-').pop())
            nextNumber = currentNumber + 1
        }

        const ticketId = `${prefix}${String(nextNumber).padStart(6, '0')}`
        return ticketId
    },
    
    getDomainFromUrl: (url) => {
        try {
            const parsedUrl = new URL(url)
            return parsedUrl.hostname
        } catch (err) {
            throw err
        }
    },

    getAccountStatus: (user) => {
        const status = {
            emailVerified: user.isEmailVerified,
            kycCompleted: user.kycStatus?.isCompleted || false,
            kycStatus: user.kycStatus?.status || 'pending',
            hasActiveSubscription: user.hasActiveSubscription,
            subscriptionStatus: user.subscription?.status || 'inactive',
            nextStep: null,
            redirectTo: null,
        }

        // Determine next step and redirect
        if (!status.emailVerified) {
            status.nextStep = 'verify_email'
            status.redirectTo = '/verify-email'
        } else if (!status.kycCompleted) {
            if (status.kycStatus === 'pending') {
                status.nextStep = 'complete_kyc'
                status.redirectTo = '/kyc'
            } else if (status.kycStatus === 'submitted') {
                status.nextStep = 'kyc_under_review'
                status.redirectTo = '/kyc-status'
            } else if (status.kycStatus === 'rejected') {
                status.nextStep = 'resubmit_kyc'
                status.redirectTo = '/kyc'
            } else if (status.kycStatus === 'verified') {
                status.kycCompleted = true
            }
        }

        if (status.emailVerified && status.kycCompleted) {
            if (!status.hasActiveSubscription) {
                status.nextStep = 'choose_subscription'
                status.redirectTo = '/subscription'
            } else {
                status.nextStep = 'dashboard'
                status.redirectTo = '/dashboard'
            }
        }

        return status
    },
    parsePhoneNumber: (phoneNumber) => {
        try {
            const parsedContactNumber = parsePhoneNumber(phoneNumber)
            if (parsedContactNumber) {
                return {
                    countryCode: parsedContactNumber.countryCallingCode,
                    isoCode: parsedContactNumber.country || null,
                    internationalNumber: parsedContactNumber.formatInternational()
                }
            }

            return {
                countryCode: null,
                isoCode: null,
                internationalNumber: null
            }
        } catch (err) {
            return {
                countryCode: null,
                isoCode: null,
                internationalNumber: null
            }
        }
    },
      getPagination: ({ totalCount, limit, currentPage }) => {
    const l = Math.max(parseInt(limit, 10) || 10, 1);
    const p = Math.max(parseInt(currentPage, 10) || 1, 1);
    const totalPages = Math.max(Math.ceil((parseInt(totalCount, 10) || 0) / l), 1);

    return {
      totalCount: parseInt(totalCount, 10) || 0,
      currentPage: p,
      limit: l,
      totalPages,
      hasNextPage: p < totalPages,
      hasPrevPage: p > 1,
    };
  },
};
