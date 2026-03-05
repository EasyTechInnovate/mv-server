import Notification from '../model/notification.model.js'
import quicker from './quicker.js'

/**
 * Create a notification (system or custom).
 * Used by both admin controller and auto-trigger points.
 *
 * @param {object} opts
 * @param {'system'|'custom'} opts.type
 * @param {string} opts.category  - ENotificationCategory value
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} opts.targetType - ENotificationTargetType value
 * @param {ObjectId|null} opts.targetUser - (Legacy) single target user
 * @param {Array<ObjectId>} opts.targetUsers - required when targetType === 'specific_user'
 * @param {object} opts.metadata  - optional { releaseId, releaseName, reportType, monthName }
 * @param {ObjectId|null} opts.createdBy - admin userId
 */
export const createNotification = async ({
    type,
    category,
    title,
    message,
    targetType,
    targetUser = null,
    targetUsers = [],
    metadata = {},
    createdBy = null
}) => {
    const notificationId = await quicker.generateNotificationId(Notification)
    return Notification.create({
        notificationId,
        type,
        category,
        title,
        message,
        status: true,
        targetType,
        targetUser,
        targetUsers,
        metadata,
        createdBy,
        readBy: [],
        readCount: 0
    })
}
