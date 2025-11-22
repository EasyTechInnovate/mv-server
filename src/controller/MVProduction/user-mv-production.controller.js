import MVProductionModel from '../../model/mv-production.model.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import httpResponse from '../../util/httpResponse.js';

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'User MV Production service is running.');
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    createMVProduction: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const accountId = req.authenticatedUser.accountId;
            const productionData = req.body;

            const newProduction = new MVProductionModel({
                userId,
                accountId,
                ...productionData
            });

            const savedProduction = await newProduction.save();

            httpResponse(req, res, 201, responseMessage.SUCCESS, savedProduction);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getUserMVProductions: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const { page = 1, limit = 10, status } = req.query;
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const filter = { userId };
            if (status) filter.status = status;

            const [productions, totalCount] = await Promise.all([
                MVProductionModel.find(filter)
                    .sort({ createdAt: -1 })
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
            const userId = req.authenticatedUser._id;
            const { productionId } = req.params;

            const production = await MVProductionModel.findOne({
                _id: productionId,
                userId
            }).lean();

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
            const userId = req.authenticatedUser._id;
            const { productionId } = req.params;
            const updateData = req.body;

            const existingProduction = await MVProductionModel.findOne({
                _id: productionId,
                userId
            });

            if (!existingProduction) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404);
            }

            if (existingProduction.status !== 'pending') {
                return httpError(next, responseMessage.ERROR.CANNOT_UPDATE(), req, 403);
            }

            const updatedProduction = await MVProductionModel.findByIdAndUpdate(
                productionId,
                updateData,
                { new: true, runValidators: true }
            ).lean();

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedProduction);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    deleteMVProduction: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const { productionId } = req.params;

            const existingProduction = await MVProductionModel.findOne({
                _id: productionId,
                userId
            });

            if (!existingProduction) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404);
            }

            if (existingProduction.status !== 'pending') {
                return httpError(next, responseMessage.ERROR.CANNOT_DELETE(), req, 403);
            }

            const deletedProduction = await MVProductionModel.findByIdAndDelete(productionId).lean();

            httpResponse(req, res, 200, responseMessage.SUCCESS, deletedProduction);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    }
};
