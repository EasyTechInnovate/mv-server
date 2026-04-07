import cron from 'node-cron'
import User from '../model/user.model.js'
import { ESubscriptionStatus } from '../constant/application.js'
import { createNotification } from '../util/notificationHelper.js'
import logger from '../util/logger.js'
import { sendMembershipPurchaseReminderEmail, sendMembershipExpiryNoticeEmail } from '../service/emailService.js'

/**
 * Mark expired subscriptions and send notifications.
 * Runs daily at 00:05 IST (UTC+5:30 → 18:35 UTC previous day)
 */
const subscriptionExpiryCron = cron.schedule('35 18 * * *', async () => {
    logger.info('SUBSCRIPTION_EXPIRY_CRON', { meta: { message: 'Running subscription expiry check' } })

    try {
        const now = new Date()

        // --- 1. Mark active subscriptions that have passed validUntil as expired ---
        const expiredResult = await User.updateMany(
            {
                'subscription.status': ESubscriptionStatus.ACTIVE,
                'subscription.validUntil': { $lt: now },
                isActive: true
            },
            {
                $set: { 'subscription.status': ESubscriptionStatus.EXPIRED }
            }
        )

        if (expiredResult.modifiedCount > 0) {
            logger.info('SUBSCRIPTION_EXPIRY_CRON', {
                meta: { message: `Marked ${expiredResult.modifiedCount} subscriptions as expired` }
            })

            // Notify each expired user
            const expiredUsers = await User.find(
                {
                    'subscription.status': ESubscriptionStatus.EXPIRED,
                    'subscription.validUntil': { $lt: now, $gte: new Date(now - 24 * 60 * 60 * 1000) }, // expired in last 24h
                    isActive: true
                },
                '_id firstName emailAddress subscription.planId'
            ).lean()

            await Promise.allSettled(
                expiredUsers.map(user => {
                    sendMembershipPurchaseReminderEmail(user.emailAddress, user.firstName).catch(() => {})
                    return createNotification({
                        type: 'system',
                        category: 'custom',
                        title: 'Subscription Expired',
                        message: 'Your subscription has expired. Renew now to continue enjoying uninterrupted access to all features.',
                        targetType: 'specific_user',
                        targetUsers: [user._id],
                        createdBy: null
                    })
                })
            )
        }

        // --- 2. Find subscriptions expiring in exactly 7 days → send reminder ---
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const sevenDaysWindow = {
            start: new Date(sevenDaysFromNow.setHours(0, 0, 0, 0)),
            end: new Date(sevenDaysFromNow.setHours(23, 59, 59, 999))
        }

        const expiringIn7Days = await User.find(
            {
                'subscription.status': ESubscriptionStatus.ACTIVE,
                'subscription.validUntil': { $gte: sevenDaysWindow.start, $lte: sevenDaysWindow.end },
                isActive: true
            },
            '_id firstName emailAddress subscription.planId subscription.validUntil'
        ).lean()

        if (expiringIn7Days.length > 0) {
            await Promise.allSettled(
                expiringIn7Days.map(user => {
                    sendMembershipExpiryNoticeEmail(user.emailAddress, user.firstName, user.subscription?.planId || 'Your Plan', user.subscription?.validUntil, 7).catch(() => {})
                    return createNotification({
                        type: 'system',
                        category: 'custom',
                        title: 'Subscription Expiring Soon',
                        message: 'Your subscription expires in 7 days. Renew now to avoid any interruption.',
                        targetType: 'specific_user',
                        targetUsers: [user._id],
                        createdBy: null
                    })
                })
            )

            logger.info('SUBSCRIPTION_EXPIRY_CRON', {
                meta: { message: `Sent 7-day expiry reminders to ${expiringIn7Days.length} users` }
            })
        }

        // --- 3. Find subscriptions expiring in exactly 1 day → final reminder ---
        const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
        const oneDayWindow = {
            start: new Date(oneDayFromNow.setHours(0, 0, 0, 0)),
            end: new Date(oneDayFromNow.setHours(23, 59, 59, 999))
        }

        const expiringIn1Day = await User.find(
            {
                'subscription.status': ESubscriptionStatus.ACTIVE,
                'subscription.validUntil': { $gte: oneDayWindow.start, $lte: oneDayWindow.end },
                isActive: true
            },
            '_id firstName emailAddress subscription.planId subscription.validUntil'
        ).lean()

        if (expiringIn1Day.length > 0) {
            await Promise.allSettled(
                expiringIn1Day.map(user => {
                    sendMembershipExpiryNoticeEmail(user.emailAddress, user.firstName, user.subscription?.planId || 'Your Plan', user.subscription?.validUntil, 1).catch(() => {})
                    return createNotification({
                        type: 'system',
                        category: 'custom',
                        title: 'Last Day — Subscription Expires Tomorrow',
                        message: 'Your subscription expires tomorrow. Renew today to keep your music live and uninterrupted.',
                        targetType: 'specific_user',
                        targetUsers: [user._id],
                        createdBy: null
                    })
                })
            )

            logger.info('SUBSCRIPTION_EXPIRY_CRON', {
                meta: { message: `Sent 1-day expiry reminders to ${expiringIn1Day.length} users` }
            })
        }

    } catch (err) {
        logger.error('SUBSCRIPTION_EXPIRY_CRON_ERROR', { meta: err })
    }
}, {
    timezone: 'Asia/Kolkata'
})

export default subscriptionExpiryCron
