import User from '../../model/user.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import httpResponse from '../../util/httpResponse.js'

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'Admin Analytics service is running.')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getAllUsers: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, search, userType, role, isActive } = req.query
            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const filter = {}

            if (search) {
                filter.$or = [
                    { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
                    { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
                    { emailAddress: { $regex: search, $options: 'i' } }
                ]
            }

            if (userType) filter.userType = userType
            if (role) filter.role = role
            if (isActive !== undefined) filter.isActive = isActive === 'true'

            const [users, totalCount] = await Promise.all([
                User.find(filter)
                    .select('-password -verificationToken -refreshTokens -__v')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                User.countDocuments(filter)
            ])

            const pagination = {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalCount,
                hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrevPage: pageNumber > 1
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                users,
                pagination
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}