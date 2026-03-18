import Notification from '../../model/notification.model.js'
import User from '../../model/user.model.js'
import { ENotificationTargetType } from '../../constant/application.js'
import { createNotification } from '../../util/notificationHelper.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

const adminNotificationController = {
    async create(req, res, next) {
        try {
            const adminId = req.authenticatedUser._id
            const { title, message, targetType, targetUser } = req.body

            if (!title || !message) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('title and message are required')), req, 400)
            }

            if (!Object.values(ENotificationTargetType).includes(targetType)) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('targetType')), req, 400)
            }

            if (targetType === ENotificationTargetType.SPECIFIC_USER) {
                if (!targetUser || !Array.isArray(targetUser) || targetUser.length === 0) {
                    return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('targetUser must be a non-empty array for specific_user targetType')), req, 400)
                }
                const users = await User.find({ _id: { $in: targetUser } })
                if (users.length !== targetUser.length) {
                    return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('One or more Users')), req, 404)
                }
            }

            const notification = await createNotification({
                type: 'custom',
                category: 'custom',
                title: title.trim(),
                message: message.trim(),
                targetType,
                targetUsers: targetType === ENotificationTargetType.SPECIFIC_USER ? targetUser : [],
                createdBy: adminId
            })

            return httpResponse(req, res, 201, responseMessage.customMessage('Notification created successfully'), { notification })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getAll(req, res, next) {
        try {
            const { page = 1, limit = 20, type, category, status } = req.query
            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)
            const skip = (pageNum - 1) * limitNum

            const filter = { isActive: true }
            if (type) filter.type = type
            if (category) filter.category = category
            if (status !== undefined) filter.status = status === 'true'

            const [notifications, totalCount] = await Promise.all([
                Notification.find(filter)
                    .populate('createdBy', 'firstName lastName emailAddress')
                    .populate('targetUser', 'firstName lastName emailAddress accountId')
                    .populate('targetUsers', 'firstName lastName emailAddress accountId')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Notification.countDocuments(filter)
            ])

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                notifications,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalItems: totalCount,
                    itemsPerPage: limitNum
                }
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getById(req, res, next) {
        try {
            const { notificationId } = req.params

            const notification = await Notification.findOne({ notificationId, isActive: true })
                .populate('createdBy', 'firstName lastName emailAddress')
                .populate('targetUser', 'firstName lastName emailAddress accountId')
                .populate('targetUsers', 'firstName lastName emailAddress accountId')

            if (!notification) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Notification')), req, 404)
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, { notification })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async toggleStatus(req, res, next) {
        try {
            const { notificationId } = req.params
            const { status } = req.body

            if (typeof status !== 'boolean') {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('status must be true or false')), req, 400)
            }

            const notification = await Notification.findOne({ notificationId, isActive: true })
            if (!notification) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Notification')), req, 404)
            }

            notification.status = status
            await notification.save()

            return httpResponse(req, res, 200, responseMessage.customMessage(`Notification ${status ? 'enabled' : 'disabled'} successfully`), {
                notificationId: notification.notificationId,
                status: notification.status
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async delete(req, res, next) {
        try {
            const { notificationId } = req.params;
            const notification = await Notification.findOne({ notificationId });
            
            if (!notification) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Notification')), req, 404);
            }

            await Notification.deleteOne({ _id: notification._id });

            return httpResponse(req, res, 200, responseMessage.customMessage('Notification deleted permanently.'));
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async bulkDelete(req, res, next) {
        try {
            const { notificationIds } = req.body;

            if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('notificationIds must be a non-empty array')), req, 400);
            }

            const notifications = await Notification.find({ notificationId: { $in: notificationIds } });

            if (notifications.length === 0) {
                return httpError(next, new Error(responseMessage.customMessage('No notifications found to delete')), req, 404);
            }

            const deletedIds = notifications.map(n => n._id);
            await Notification.deleteMany({ _id: { $in: deletedIds } });

            return httpResponse(req, res, 200, responseMessage.customMessage('Notifications deleted permanently.'));
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async searchUsers(req, res, next) {
        try {
            const { page = 1, limit = 100, search = '' } = req.query
            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)
            const skip = (pageNum - 1) * limitNum

            const filter = { isActive: true }
            if (search) {
                const searchRegex = { $regex: search, $options: 'i' }
                filter.$or = [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { emailAddress: searchRegex },
                    { accountId: searchRegex }
                ]
            }

            const [users, totalCount] = await Promise.all([
                User.find(filter)
                    .select('firstName lastName emailAddress accountId userType')
                    .limit(limitNum)
                    .skip(skip)
                    .lean(),
                User.countDocuments(filter)
            ])

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                users,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount,
                    hasNextPage: pageNum * limitNum < totalCount,
                    hasPrevPage: pageNum > 1
                }
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}

export default adminNotificationController
