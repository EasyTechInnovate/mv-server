import MerchStore from '../../model/merch-store.model.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import httpResponse from '../../util/httpResponse.js';
import { EMerchStoreStatus } from '../../constant/application.js';

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'User Merch Store service is running.');
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    createMerchStore: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const accountId = req.authenticatedUser.accountId;
            const { artistInfo, productPreferences, marketingPlan, legalConsents } = req.body;

            const newMerchStore = new MerchStore({
                userId,
                accountId,
                artistInfo,
                productPreferences,
                marketingPlan,
                legalConsents,
                status: EMerchStoreStatus.PENDING
            });

            const savedMerchStore = await newMerchStore.save();

            httpResponse(req, res, 201, responseMessage.SUCCESS, savedMerchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getUserMerchStores: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const filter = { userId };
            if (status) filter.status = status;
            if (search) {
                filter.$or = [
                    { 'artistInfo.artistName': { $regex: search, $options: 'i' } },
                    { accountId: { $regex: search, $options: 'i' } }
                ];
            }

            const sortOptions = {};
            if (sortBy === 'artistName') {
                sortOptions['artistInfo.artistName'] = sortOrder === 'asc' ? 1 : -1;
            } else {
                sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
            }

            const [merchStores, totalCount] = await Promise.all([
                MerchStore.find(filter)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                MerchStore.countDocuments(filter)
            ]);

            const pagination = {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalCount,
                hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrevPage: pageNumber > 1
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                merchStores,
                pagination
            });
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getMerchStoreById: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const { storeId } = req.params;

            const merchStore = await MerchStore.findOne({
                _id: storeId,
                userId
            }).lean();

            if (!merchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, merchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    updateMerchStore: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const { storeId } = req.params;
            const updateData = req.body;

            const existingMerchStore = await MerchStore.findOne({
                _id: storeId,
                userId
            });

            if (!existingMerchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            if (existingMerchStore.status !== EMerchStoreStatus.PENDING && existingMerchStore.status !== EMerchStoreStatus.REJECTED) {
                return httpError(next, 'Cannot update merch store that is not in pending or rejected status', req, 400);
            }

            if (updateData.artistInfo) {
                existingMerchStore.artistInfo = {
                    ...existingMerchStore.artistInfo,
                    ...updateData.artistInfo
                };
            }

            if (updateData.productPreferences) {
                existingMerchStore.productPreferences = {
                    ...existingMerchStore.productPreferences,
                    ...updateData.productPreferences
                };
            }

            if (updateData.marketingPlan) {
                existingMerchStore.marketingPlan = {
                    ...existingMerchStore.marketingPlan,
                    ...updateData.marketingPlan
                };
            }

            const updatedMerchStore = await existingMerchStore.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedMerchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    submitDesigns: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const { storeId } = req.params;
            const { designs } = req.body;

            const existingMerchStore = await MerchStore.findOne({
                _id: storeId,
                userId
            });

            if (!existingMerchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            if (existingMerchStore.status !== EMerchStoreStatus.APPROVED && existingMerchStore.status !== EMerchStoreStatus.DESIGN_PENDING && existingMerchStore.status !== EMerchStoreStatus.DESIGN_REJECTED) {
                return httpError(next, 'Can only submit designs for approved merch store applications', req, 400);
            }

            existingMerchStore.designs = designs.map(design => ({
                designLink: design.designLink,
                designName: design.designName || '',
                uploadedAt: new Date()
            }));
            existingMerchStore.status = EMerchStoreStatus.DESIGN_SUBMITTED;
            existingMerchStore.designsSubmittedAt = new Date();

            const updatedMerchStore = await existingMerchStore.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedMerchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    deleteMerchStore: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const { storeId } = req.params;

            const existingMerchStore = await MerchStore.findOne({
                _id: storeId,
                userId
            });

            if (!existingMerchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            if (existingMerchStore.status !== EMerchStoreStatus.PENDING && existingMerchStore.status !== EMerchStoreStatus.REJECTED && existingMerchStore.status !== EMerchStoreStatus.DESIGN_REJECTED) {
                return httpError(next, 'Cannot delete merch store that is approved or in review', req, 400);
            }

            await MerchStore.deleteOne({ _id: storeId });

            httpResponse(req, res, 200, responseMessage.SUCCESS, 'Merch store deleted successfully');
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getApprovedDesigns: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id;
            const { page = 1, limit = 10, sortBy = 'uploadedAt', sortOrder = 'desc' } = req.query;
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            const skip = (pageNumber - 1) * limitNumber;

            // Use aggregation to flatten designs and filter approved ones
            const pipeline = [
                // Match merch stores for this user
                { $match: { userId } },
                // Unwind designs array to flatten it
                { $unwind: { path: '$designs', preserveNullAndEmptyArrays: false } },
                // Filter only approved designs
                { $match: { 'designs.status': 'approved' } },
                // Project the fields we need
                {
                    $project: {
                        _id: '$designs._id',
                        designLink: '$designs.designLink',
                        designName: '$designs.designName',
                        status: '$designs.status',
                        products: '$designs.products',
                        uploadedAt: '$designs.uploadedAt',
                        adminNotes: '$designs.adminNotes',
                        artistName: '$artistInfo.artistName',
                        accountId: '$accountId',
                        storeId: '$_id'
                    }
                }
            ];

            // Add sorting
            const sortOptions = {};
            if (sortBy === 'artistName') {
                sortOptions['artistName'] = sortOrder === 'asc' ? 1 : -1;
            } else if (sortBy === 'designName') {
                sortOptions['designName'] = sortOrder === 'asc' ? 1 : -1;
            } else {
                sortOptions['uploadedAt'] = sortOrder === 'asc' ? 1 : -1;
            }
            pipeline.push({ $sort: sortOptions });

            // Get total count before pagination
            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await MerchStore.aggregate(countPipeline);
            const totalCount = countResult.length > 0 ? countResult[0].total : 0;

            // Add pagination
            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: limitNumber });

            // Execute the aggregation
            const designs = await MerchStore.aggregate(pipeline);

            const pagination = {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalCount,
                hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrevPage: pageNumber > 1
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                designs,
                pagination
            });
        } catch (error) {
            httpError(next, error, req, 500);
        }
    }
};
