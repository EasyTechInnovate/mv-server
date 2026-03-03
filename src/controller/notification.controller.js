import Notification from '../model/notification.model.js'
import responseMessage from '../constant/responseMessage.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'

const notificationController = {
    async getMyNotifications(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const userType = req.authenticatedUser.userType
            const { page = 1, limit = 20 } = req.query

            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)

            const [notifications, totalItems] = await Promise.all([
                Notification.findForUser(userId, userType, { page: pageNum, limit: limitNum }),
                Notification.countForUser(userId, userType)
            ])

            // Add isRead flag per notification
            const enriched = notifications.map(n => ({
                ...n,
                isRead: n.readBy.some(r => r.userId.toString() === userId.toString())
            }))

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                notifications: enriched,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalItems / limitNum),
                    totalItems,
                    itemsPerPage: limitNum
                }
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getUnreadCount(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const userType = req.authenticatedUser.userType

            const unreadCount = await Notification.getUnreadCount(userId, userType)

            return httpResponse(req, res, 200, responseMessage.SUCCESS, { unreadCount })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async markAsRead(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const userType = req.authenticatedUser.userType
            const { notificationId } = req.params

            // Verify notification is visible to this user
            const userQuery = {
                notificationId,
                status: true,
                isActive: true,
                $or: [
                    { targetType: 'specific_user', targetUser: userId },
                    { targetType: 'all_users' },
                    ...(userType === 'artist' ? [{ targetType: 'all_artists' }] : []),
                    ...(userType === 'label' ? [{ targetType: 'all_labels' }] : [])
                ]
            }

            const notification = await Notification.findOne(userQuery)
            if (!notification) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Notification')), req, 404)
            }

            await notification.markReadByUser(userId)

            return httpResponse(req, res, 200, responseMessage.customMessage('Notification marked as read'), {
                notificationId: notification.notificationId,
                readCount: notification.readCount
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async markAllAsRead(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const userType = req.authenticatedUser.userType

            const visibilityQuery = {
                status: true,
                isActive: true,
                'readBy.userId': { $ne: userId },
                $or: [
                    { targetType: 'specific_user', targetUser: userId },
                    { targetType: 'all_users' },
                    ...(userType === 'artist' ? [{ targetType: 'all_artists' }] : []),
                    ...(userType === 'label' ? [{ targetType: 'all_labels' }] : [])
                ]
            }

            // Update all unread notifications for this user in one query
            const result = await Notification.updateMany(
                visibilityQuery,
                {
                    $push: { readBy: { userId, readAt: new Date() } },
                    $inc: { readCount: 1 }
                }
            )

            return httpResponse(req, res, 200, responseMessage.customMessage('All notifications marked as read'), {
                markedCount: result.modifiedCount
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}

export default notificationController
