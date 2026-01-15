import MerchStore from '../../model/merch-store.model.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import httpResponse from '../../util/httpResponse.js';
import { EMerchStoreStatus } from '../../constant/application.js';

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'Admin Merch Store service is running.');
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getAllMerchStores: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, status, userId, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const filter = {};
            if (status) filter.status = status;
            if (userId) filter.userId = userId;
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
                    .populate('userId', 'firstName lastName emailAddress accountId')
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
            const { storeId } = req.params;

            const merchStore = await MerchStore.findById(storeId)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .lean();

            if (!merchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, merchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    updateMerchStoreStatus: async (req, res, next) => {
        try {
            const { storeId } = req.params;
            const { status, adminNotes, rejectionReason } = req.body;

            const existingMerchStore = await MerchStore.findById(storeId);

            if (!existingMerchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            existingMerchStore.status = status;

            if (adminNotes) {
                existingMerchStore.adminNotes = adminNotes;
            }

            if (status === EMerchStoreStatus.REJECTED || status === EMerchStoreStatus.DESIGN_REJECTED) {
                if (!rejectionReason) {
                    return httpError(next, 'Rejection reason is required when rejecting', req, 400);
                }
                existingMerchStore.rejectionReason = rejectionReason;
            }

            if (status === EMerchStoreStatus.APPROVED) {
                existingMerchStore.approvedAt = new Date();
                existingMerchStore.status = EMerchStoreStatus.DESIGN_PENDING;
            }

            if (status === EMerchStoreStatus.DESIGN_APPROVED) {
                existingMerchStore.designsApprovedAt = new Date();
            }

            const updatedMerchStore = await existingMerchStore.save();

            const populatedMerchStore = await MerchStore.findById(updatedMerchStore._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .lean();

            httpResponse(req, res, 200, responseMessage.SUCCESS, populatedMerchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    updateMerchStore: async (req, res, next) => {
        try {
            const { storeId } = req.params;
            const updateData = req.body;

            const existingMerchStore = await MerchStore.findById(storeId);

            if (!existingMerchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            const updatedMerchStore = await MerchStore.findByIdAndUpdate(
                storeId,
                updateData,
                { new: true, runValidators: true }
            )
                .populate('userId', 'firstName lastName emailAddress accountId')
                .lean();

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedMerchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    deleteMerchStore: async (req, res, next) => {
        try {
            const { storeId } = req.params;

            const existingMerchStore = await MerchStore.findById(storeId);

            if (!existingMerchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            await MerchStore.deleteOne({ _id: storeId });

            httpResponse(req, res, 200, responseMessage.SUCCESS, 'Merch store deleted successfully');
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getStats: async (req, res, next) => {
        try {
            const [
                totalStores,
                pendingStores,
                approvedStores,
                rejectedStores,
                designPendingStores,
                designSubmittedStores,
                designApprovedStores
            ] = await Promise.all([
                MerchStore.countDocuments(),
                MerchStore.countDocuments({ status: EMerchStoreStatus.PENDING }),
                MerchStore.countDocuments({ status: EMerchStoreStatus.APPROVED }),
                MerchStore.countDocuments({ status: EMerchStoreStatus.REJECTED }),
                MerchStore.countDocuments({ status: EMerchStoreStatus.DESIGN_PENDING }),
                MerchStore.countDocuments({ status: EMerchStoreStatus.DESIGN_SUBMITTED }),
                MerchStore.countDocuments({ status: EMerchStoreStatus.DESIGN_APPROVED })
            ]);

            const stats = {
                totalStores,
                pendingStores,
                approvedStores,
                rejectedStores,
                designPendingStores,
                designSubmittedStores,
                designApprovedStores
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, stats);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    updateDesignStatus: async (req, res, next) => {
        try {
            const { storeId, designId } = req.params;
            const { status, rejectionReason, adminNotes } = req.body;

            const merchStore = await MerchStore.findById(storeId);
            if (!merchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            const design = merchStore.designs.id(designId);
            if (!design) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Design not found'), req, 404);
            }

            design.status = status;
            if (rejectionReason) design.rejectionReason = rejectionReason;
            if (adminNotes) design.adminNotes = adminNotes;

            await merchStore.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, merchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    manageDesignProducts: async (req, res, next) => {
        try {
            const { storeId, designId } = req.params;
            const { products } = req.body; // Array of { name, link }

            const merchStore = await MerchStore.findById(storeId);
            if (!merchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            const design = merchStore.designs.id(designId);
            if (!design) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Design not found'), req, 404);
            }

            design.products = products;

            await merchStore.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, merchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    updateDesignName: async (req, res, next) => {
        try {
            const { storeId, designId } = req.params;
            const { designName } = req.body;

            const merchStore = await MerchStore.findById(storeId);
            if (!merchStore) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Merch store not found'), req, 404);
            }

            const design = merchStore.designs.id(designId);
            if (!design) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND('Design not found'), req, 404);
            }

            design.designName = designName;

            await merchStore.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, merchStore);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },

    getListedProducts: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, search } = req.query;
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const pipeline = [
                {
                    $match: {
                        'designs.status': 'approved'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                },
                {
                    $unwind: '$userInfo'
                },
                {
                    $project: {
                        _id: 1,
                        artistName: '$artistInfo.artistName',
                        accountId: 1,
                        email: '$userInfo.emailAddress',
                        firstName: '$userInfo.firstName',
                        lastName: '$userInfo.lastName',
                        approvedDesignsCount: {
                            $size: {
                                $filter: {
                                    input: '$designs',
                                    as: 'design',
                                    cond: { $eq: ['$$design.status', 'approved'] }
                                }
                            }
                        }
                    }
                }
            ];

            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { artistName: { $regex: search, $options: 'i' } },
                            { accountId: { $regex: search, $options: 'i' } },
                            { email: { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            pipeline.push(
                { $sort: { approvedDesignsCount: -1 } },
                { $skip: skip },
                { $limit: limitNumber }
            );

            const result = await MerchStore.aggregate(pipeline);
            // Note: Pagination for aggregation is simple here, for real production count might need facet

            httpResponse(req, res, 200, responseMessage.SUCCESS, result);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    }
};
