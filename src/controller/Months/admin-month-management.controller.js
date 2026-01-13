import MonthManagement from '../../model/month-management.model.js'
import { EMonthManagementType } from '../../constant/application.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'


export default {
    async createMonth(req, res, next) {
        try {
            const { month, displayName, type, isActive = true } = req.body

            const existingMonth = await MonthManagement.findOne({
                month: month.trim(),
                type,
                isActive: true
            })

            if (existingMonth) {
                return httpError(next, new Error(responseMessage.ERROR.ALREADY_EXISTS('Month for this type')), req, 400)
            }

            const monthManagement = new MonthManagement({
                month: month.trim(),
                displayName: displayName.trim(),
                type,
                isActive
            })

            const savedMonth = await monthManagement.save()

            httpResponse(
                req,
                res,
                201,
                responseMessage.SUCCESS,
                savedMonth
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getAllMonths(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                type,
                isActive,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            let filter = {}
            
            if (type && Object.values(EMonthManagementType).includes(type)) {
                filter.type = type
            }
            
            if (isActive !== undefined) {
                filter.isActive = isActive === 'true'
            }

            if (search) {
                filter.$or = [
                    { month: { $regex: search, $options: 'i' } },
                    { displayName: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [months, totalCount] = await Promise.all([
                MonthManagement.find(filter)
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber),
                MonthManagement.countDocuments(filter)
            ])

            const pagination = {
                totalCount,
                totalPages: Math.ceil(totalCount / limitNumber),
                currentPage: pageNumber,
                hasNext: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrev: pageNumber > 1
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    months,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMonthById(req, res, next) {
        try {
            const { id } = req.params

            const month = await MonthManagement.findById(id)
            if (!month) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Month')), req, 404)
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                month
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async updateMonth(req, res, next) {
        try {
            const { id } = req.params
            const { month, displayName, type, isActive } = req.body

            const existingMonth = await MonthManagement.findById(id)
            if (!existingMonth) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Month')), req, 404)
            }

            if (month || type) {
                const duplicateCheck = await MonthManagement.findOne({
                    _id: { $ne: id },
                    month: month ? month.trim() : existingMonth.month,
                    type: type || existingMonth.type,
                    isActive: true
                })

                if (duplicateCheck) {
                    return httpError(next, new Error(responseMessage.ERROR.ALREADY_EXISTS('Month for this type')), req, 400)
                }
            }

            const updateData = {}
            if (month) updateData.month = month.trim()
            if (displayName) updateData.displayName = displayName.trim()
            if (type) updateData.type = type
            if (isActive !== undefined) updateData.isActive = isActive

            const updatedMonth = await MonthManagement.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            )

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                updatedMonth
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async deleteMonth(req, res, next) {
        try {
            const { id } = req.params

            const month = await MonthManagement.findById(id)
            if (!month) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Month')), req, 404)
            }

            await MonthManagement.findByIdAndUpdate(id, { isActive: false })

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                { message: 'Month deactivated successfully' }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMonthsByType(req, res, next) {
        try {
            const { type } = req.params;
            const { includeInactive = false } = req.query;

            if (!Object.values(EMonthManagementType).includes(type)) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('month type')), req, 400);
            }

            const matchStage = { type };
            if (!includeInactive) {
                matchStage.isActive = true;
            }

            const months = await MonthManagement.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'reportdatas',
                        let: { monthId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$monthId', '$$monthId'] },
                                            { $eq: ['$reportType', type] },
                                            { $eq: ['$isActive', true] }
                                        ]
                                    }
                                }
                            },
                            { $project: { _id: 1, status: 1 } }
                        ],
                        as: 'report'
                    }
                },
                {
                    $addFields: {
                        reportDetails: {
                            $cond: {
                                if: { $gt: [{ $size: '$report' }, 0] },
                                then: {
                                    isSubmitted: true,
                                    reportId: { $arrayElemAt: ['$report._id', 0] },
                                    status: { $arrayElemAt: ['$report.status', 0] }
                                },
                                else: {
                                    isSubmitted: false,
                                    reportId: null,
                                    status: null
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        report: 0 
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            ]);

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                months
            );
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async toggleMonthStatus(req, res, next) {
        try {
            const { id } = req.params

            const month = await MonthManagement.findById(id)
            if (!month) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Month')), req, 404)
            }

            month.isActive = !month.isActive
            await month.save()

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                month
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getMonthStats(req, res, next) {
        try {
            const stats = await MonthManagement.aggregate([
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: 1 },
                        active: {
                            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                        },
                        inactive: {
                            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                        }
                    }
                },
                {
                    $project: {
                        type: '$_id',
                        total: 1,
                        active: 1,
                        inactive: 1,
                        _id: 0
                    }
                }
            ])

            const totalMonths = await MonthManagement.countDocuments()
            const activeMonths = await MonthManagement.countDocuments({ isActive: true })

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    overview: {
                        totalMonths,
                        activeMonths,
                        inactiveMonths: totalMonths - activeMonths
                    },
                    byType: stats
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}