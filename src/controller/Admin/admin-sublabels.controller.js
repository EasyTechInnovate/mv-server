import Sublabel from '../../model/sublabel.model.js'
import User from '../../model/user.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

export default {
    async createSublabel(req, res, next) {
        try {
            const { name, membershipStatus, contractStartDate, contractEndDate, description, contactInfo } = req.body

            const existingSublabel = await Sublabel.findOne({ name })
            if (existingSublabel) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Sublabel with this name already exists')),
                    req,
                    400
                )
            }

            const sublabel = new Sublabel({
                name,
                membershipStatus,
                contractStartDate: new Date(contractStartDate),
                contractEndDate: new Date(contractEndDate),
                description,
                contactInfo
            })

            await sublabel.save()

            return httpResponse(
                req,
                res,
                201,
                responseMessage.CREATED,
                {
                    sublabel: {
                        id: sublabel._id,
                        name: sublabel.name,
                        membershipStatus: sublabel.membershipStatus,
                        contractStartDate: sublabel.contractStartDate,
                        contractEndDate: sublabel.contractEndDate,
                        isActive: sublabel.isActive,
                        description: sublabel.description,
                        contactInfo: sublabel.contactInfo,
                        createdAt: sublabel.createdAt
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getSublabels(req, res, next) {
        try {
            const { page = 1, limit = 10, search, membershipStatus, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
            
            const filter = {}
            if (search) {
                filter.name = { $regex: search, $options: 'i' }
            }
            if (membershipStatus) {
                filter.membershipStatus = membershipStatus
            }
            if (isActive !== undefined) {
                filter.isActive = isActive === 'true'
            }

            const sort = {}
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1

            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)
            const skip = (pageNum - 1) * limitNum

            const [sublabels, total] = await Promise.all([
                Sublabel.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Sublabel.countDocuments(filter)
            ])

            const sublabelsWithUserCount = await Promise.all(
                sublabels.map(async (sublabel) => {
                    const userCount = await User.countDocuments({
                        'sublabels.sublabel': sublabel._id,
                        'sublabels.isActive': true,
                        isActive: true
                    })
                    return {
                        ...sublabel,
                        assignedUsersCount: userCount
                    }
                })
            )

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    sublabels: sublabelsWithUserCount,
                    pagination: {
                        currentPage: pageNum,
                        totalPages: Math.ceil(total / limitNum),
                        totalItems: total,
                        itemsPerPage: limitNum
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getSublabel(req, res, next) {
        try {
            const { id } = req.params

            const sublabel = await Sublabel.findById(id)
            if (!sublabel) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Sublabel')),
                    req,
                    404
                )
            }

            const assignedUsers = await User.find({
                'sublabels.sublabel': id,
                'sublabels.isActive': true,
                isActive: true
            }, 'firstName lastName userType sublabels.$')
                .populate('sublabels.sublabel', 'name')

            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    sublabel: {
                        id: sublabel._id,
                        name: sublabel.name,
                        membershipStatus: sublabel.membershipStatus,
                        contractStartDate: sublabel.contractStartDate,
                        contractEndDate: sublabel.contractEndDate,
                        isActive: sublabel.isActive,
                        description: sublabel.description,
                        contactInfo: sublabel.contactInfo,
                        createdAt: sublabel.createdAt,
                        updatedAt: sublabel.updatedAt
                    },
                    assignedUsers: assignedUsers.map(user => ({
                        id: user._id,
                        name: `${user.firstName} ${user.lastName}`,
                        userType: user.userType,
                        assignedAt: user.sublabels[0].assignedAt,
                        isDefault: user.sublabels[0].isDefault
                    }))
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async updateSublabel(req, res, next) {
        try {
            const { id } = req.params
            const { name, membershipStatus, contractStartDate, contractEndDate, description, contactInfo, isActive } = req.body

            const sublabel = await Sublabel.findById(id)
            if (!sublabel) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Sublabel')),
                    req,
                    404
                )
            }

            if (name && name !== sublabel.name) {
                const existingSublabel = await Sublabel.findOne({ name, _id: { $ne: id } })
                if (existingSublabel) {
                    return httpError(
                        next,
                        new Error(responseMessage.customMessage('Sublabel with this name already exists')),
                        req,
                        400
                    )
                }
                sublabel.name = name
            }

            if (membershipStatus) sublabel.membershipStatus = membershipStatus
            if (contractStartDate) sublabel.contractStartDate = new Date(contractStartDate)
            if (contractEndDate) sublabel.contractEndDate = new Date(contractEndDate)
            if (description !== undefined) sublabel.description = description
            if (contactInfo) sublabel.contactInfo = contactInfo
            if (isActive !== undefined) sublabel.isActive = isActive

            await sublabel.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.UPDATED,
                {
                    sublabel: {
                        id: sublabel._id,
                        name: sublabel.name,
                        membershipStatus: sublabel.membershipStatus,
                        contractStartDate: sublabel.contractStartDate,
                        contractEndDate: sublabel.contractEndDate,
                        isActive: sublabel.isActive,
                        description: sublabel.description,
                        contactInfo: sublabel.contactInfo,
                        updatedAt: sublabel.updatedAt
                    }
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async deleteSublabel(req, res, next) {
        try {
            const { id } = req.params

            const sublabel = await Sublabel.findById(id)
            if (!sublabel) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Sublabel')),
                    req,
                    404
                )
            }

            if (sublabel.name === 'Maheshwari Visual') {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Cannot delete default sublabel')),
                    req,
                    400
                )
            }

            const assignedUsersCount = await User.countDocuments({
                'sublabels.sublabel': id,
                'sublabels.isActive': true
            })

            if (assignedUsersCount > 0) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Cannot delete sublabel with assigned users')),
                    req,
                    400
                )
            }

            await Sublabel.findByIdAndDelete(id)

            return httpResponse(
                req,
                res,
                200,
                responseMessage.DELETED
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async assignSublabelToUser(req, res, next) {
        try {
            const { id } = req.params
            const { userId, isDefault = false } = req.body

            const [sublabel, user] = await Promise.all([
                Sublabel.findById(id),
                User.findById(userId)
            ])

            if (!sublabel) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('Sublabel')),
                    req,
                    404
                )
            }

            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('User')),
                    req,
                    404
                )
            }

            const existingAssignment = user.sublabels.find(
                sub => sub.sublabel.toString() === id && sub.isActive
            )

            if (existingAssignment) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Sublabel already assigned to user')),
                    req,
                    400
                )
            }

            if (isDefault) {
                user.sublabels.forEach(sub => {
                    sub.isDefault = false
                })
            }

            user.sublabels.push({
                sublabel: id,
                isDefault,
                isActive: true
            })

            await user.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Sublabel assigned to user successfully'),
                {
                    userId: user._id,
                    userName: `${user.firstName} ${user.lastName}`,
                    sublabelId: sublabel._id,
                    sublabelName: sublabel.name,
                    isDefault,
                    assignedAt: new Date()
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async removeSublabelFromUser(req, res, next) {
        try {
            const { id } = req.params
            const { userId } = req.body

            const user = await User.findById(userId)
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('User')),
                    req,
                    404
                )
            }

            const sublabelIndex = user.sublabels.findIndex(
                sub => sub.sublabel.toString() === id && sub.isActive
            )

            if (sublabelIndex === -1) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Sublabel not assigned to user')),
                    req,
                    404
                )
            }

            if (user.sublabels[sublabelIndex].isDefault) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Cannot remove default sublabel')),
                    req,
                    400
                )
            }

            user.sublabels[sublabelIndex].isActive = false
            await user.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Sublabel removed from user successfully')
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async toggleUserSublabels(req, res, next) {
        try {
            const { userId } = req.params
            const { sublabelIds } = req.body

            const user = await User.findById(userId)
            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('User')),
                    req,
                    404
                )
            }

            const sublabels = await Sublabel.find({
                _id: { $in: sublabelIds },
                isActive: true
            })

            if (sublabels.length !== sublabelIds.length) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Some sublabels not found or inactive')),
                    req,
                    404
                )
            }

            user.sublabels.forEach(sub => {
                sub.isActive = false
            })

            sublabelIds.forEach((sublabelId, index) => {
                const existingIndex = user.sublabels.findIndex(
                    sub => sub.sublabel.toString() === sublabelId
                )

                if (existingIndex !== -1) {
                    user.sublabels[existingIndex].isActive = true
                    user.sublabels[existingIndex].assignedAt = new Date()
                } else {
                    user.sublabels.push({
                        sublabel: sublabelId,
                        isDefault: index === 0,
                        isActive: true
                    })
                }
            })

            await user.save()

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('User sublabels updated successfully'),
                {
                    userId: user._id,
                    assignedSublabels: sublabels.map((sub, index) => ({
                        id: sub._id,
                        name: sub.name,
                        isDefault: index === 0
                    }))
                }
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },

    async getUserSublabels(req, res, next) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 10, search } = req.query;

            const user = await User.findById(userId);

            if (!user) {
                return httpError(
                    next,
                    new Error(responseMessage.ERROR.NOT_FOUND('User')),
                    req,
                    404
                );
            }

            const activeSublabelIds = user.sublabels
                .filter(sub => sub.isActive)
                .map(sub => sub.sublabel);

            const filter = {
                _id: { $in: activeSublabelIds }
            };

            if (search) {
                filter.name = { $regex: search, $options: 'i' };
            }

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const [sublabels, total] = await Promise.all([
                Sublabel.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Sublabel.countDocuments(filter)
            ]);
            
            const sublabelsWithAssignmentData = sublabels.map(sl => {
                const assignment = user.sublabels.find(s => s.sublabel.equals(sl._id));
                return {
                    id: sl._id,
                    name: sl.name,
                    membershipStatus: sl.membershipStatus,
                    isDefault: assignment ? assignment.isDefault : false,
                    assignedAt: assignment ? assignment.assignedAt : null,
                };
            });


            return httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    user: {
                        id: user._id,
                        name: `${user.firstName} ${user.lastName}`,
                    },
                    sublabels: sublabelsWithAssignmentData,
                    pagination: {
                        currentPage: pageNum,
                        totalPages: Math.ceil(total / limitNum),
                        totalItems: total,
                        itemsPerPage: limitNum
                    }
                }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    }
}