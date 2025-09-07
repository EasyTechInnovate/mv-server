import os from 'os';
import crypto from 'crypto';
import config from '../config/config.js';
import jwt from 'jsonwebtoken'

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
            'admin': 'MV/AD/'
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
    getDomainFromUrl: (url) => {
        try {
            const parsedUrl = new URL(url)
            return parsedUrl.hostname
        } catch (err) {
            throw err
        }
    }
};
