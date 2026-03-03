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
                if (!targetUser) {
                    return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('targetUser is required for specific_user targetType')), req, 400)
                }
                const user = await User.findById(targetUser)
                if (!user) {
                    return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404)
                }
            }

            const notification = await createNotification({
                type: 'custom',
                category: 'custom',
                title: title.trim(),
                message: message.trim(),
                targetType,
                targetUser: targetType === ENotificationTargetType.SPECIFIC_USER ? targetUser : null,
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
    }
}

export default adminNotificationController
