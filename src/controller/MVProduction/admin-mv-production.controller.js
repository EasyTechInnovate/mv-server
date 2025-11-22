import MVProductionModel from '../../model/mv-production.model.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import httpResponse from '../../util/httpResponse.js';

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'Admin MV Production service is running.');
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getAllMVProductions: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const filter = {};
            if (status) filter.status = status;
            if (search) {
                filter.$or = [
                    { 'projectOverview.projectTitle': { $regex: search, $options: 'i' } },
                    { 'projectOverview.artistName': { $regex: search, $options: 'i' } },
                    { 'ownerInfo.copyrightOwnerName': { $regex: search, $options: 'i' } },
                    { accountId: { $regex: search, $options: 'i' } }
                ];
            }

            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const [productions, totalCount] = await Promise.all([
                MVProductionModel.find(filter)
                    .populate('userId', 'firstName lastName emailAddress accountId')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                MVProductionModel.countDocuments(filter)
            ]);

            const pagination = {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalCount,
                hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrevPage: pageNumber > 1
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                productions,
                pagination
            });
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getMVProductionById: async (req, res, next) => {
        try {
            const { productionId } = req.params;

            const production = await MVProductionModel.findById(productionId)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .lean();

            if (!production) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, production);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    updateMVProduction: async (req, res, next) => {
        try {
            const { productionId } = req.params;
            const updateData = req.body;

            const existingProduction = await MVProductionModel.findById(productionId);

            if (!existingProduction) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404);
            }

            const updatedProduction = await MVProductionModel.findByIdAndUpdate(
                productionId,
                updateData,
                { new: true, runValidators: true }
            )
                .populate('userId', 'firstName lastName emailAddress accountId')
                .lean();

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedProduction);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    updateMVProductionStatus: async (req, res, next) => {
        try {
            const { productionId } = req.params;
            const { status } = req.body;

            const existingProduction = await MVProductionModel.findById(productionId);

            if (!existingProduction) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404);
            }

            const updatedProduction = await MVProductionModel.findByIdAndUpdate(
                productionId,
                { status },
                { new: true, runValidators: true }
            )
                .populate('userId', 'firstName lastName emailAddress accountId')
                .lean();

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedProduction);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    deleteMVProduction: async (req, res, next) => {
        try {
            const { productionId } = req.params;

            const deletedProduction = await MVProductionModel.findByIdAndDelete(productionId).lean();

            if (!deletedProduction) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, deletedProduction);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getMVProductionStats: async (req, res, next) => {
        try {
            const [totalProductions, pendingProductions, acceptedProductions, rejectedProductions, recentProductions] = await Promise.all([
                MVProductionModel.countDocuments(),
                MVProductionModel.countDocuments({ status: 'pending' }),
                MVProductionModel.countDocuments({ status: 'accept' }),
                MVProductionModel.countDocuments({ status: 'reject' }),
                MVProductionModel.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('userId', 'firstName lastName emailAddress accountId')
                    .select('projectOverview.projectTitle projectOverview.artistName status createdAt')
                    .lean()
            ]);

            const stats = {
                totalProductions,
                pendingProductions,
                acceptedProductions,
                rejectedProductions,
                recentProductions
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, stats);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    }
};
