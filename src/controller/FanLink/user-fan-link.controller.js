import FanLink from '../../model/fan-link.model.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import httpResponse from '../../util/httpResponse.js';
import { EFanLinkStatus } from '../../constant/application.js';

const self = async (req, res, next) => {
    try {
        httpResponse(req, res, 200, responseMessage.customMessage('Fan Link Builder service is running'));
    } catch (error) {
        next(error);
    }
};

const createFanLink = async (req, res, next) => {
    try {
        const userId = req.authenticatedUser._id;
        const userAccountId = req.authenticatedUser.accountId;
        const { title, description, customUrl, platformLinks } = req.body;

        const existingFanLink = await FanLink.findByCustomUrl(customUrl);
        if (existingFanLink) {
            return next(new httpError(responseMessage.customMessage('Custom URL already exists'), 409));
        }

        const fullUrl = `${process.env.CLIENT_URL}/s/${customUrl}`;

        const newFanLink = new FanLink({
            userId,
            userAccountId,
            title,
            description,
            customUrl: customUrl.toLowerCase(),
            fullUrl,
            platformLinks,
            status: EFanLinkStatus.ACTIVE
        });

        await newFanLink.save();

        httpResponse(req, res, 201, responseMessage.customMessage('Fan link created successfully'), newFanLink);
    } catch (error) {
        next(error);
    }
};

const updateFanLink = async (req, res, next) => {
    try {
        const userId = req.authenticatedUser._id;
        const userAccountId = req.authenticatedUser.accountId;
        const { fanLinkId } = req.params;
        const updates = req.body;

        const fanLink = await FanLink.findOne({ _id: fanLinkId, userId, userAccountId });
        if (!fanLink) {
            return next(new httpError(responseMessage.customMessage('Fan link not found'), 404));
        }

        if (updates.customUrl && updates.customUrl !== fanLink.customUrl) {
            const existingFanLink = await FanLink.findByCustomUrl(updates.customUrl);
            if (existingFanLink && existingFanLink._id.toString() !== fanLinkId) {
                return next(new httpError(responseMessage.customMessage('Custom URL already exists'), 409));
            }
            updates.customUrl = updates.customUrl.toLowerCase();
            updates.fullUrl = `${process.env.CLIENT_URL}/s/${updates.customUrl}`;
        }

        const updatedFanLink = await FanLink.findByIdAndUpdate(fanLinkId, updates, { new: true });

        httpResponse(req, res, 200, responseMessage.customMessage('Fan link updated successfully'), updatedFanLink);
    } catch (error) {
        next(error);
    }
};

const deleteFanLink = async (req, res, next) => {
    try {
        const userId = req.authenticatedUser._id;
        const userAccountId = req.authenticatedUser.accountId;
        const { fanLinkId } = req.params;

        const fanLink = await FanLink.findOne({ _id: fanLinkId, userId, userAccountId });
        if (!fanLink) {
            return next(new httpError(responseMessage.customMessage('Fan link not found'), 404));
        }

        await FanLink.findByIdAndDelete(fanLinkId);

        httpResponse(req, res, 200, responseMessage.customMessage('Fan link deleted successfully'));
    } catch (error) {
        next(error);
    }
};

const getFanLinks = async (req, res, next) => {
    try {
        const userId = req.authenticatedUser._id;
        const userAccountId = req.authenticatedUser.accountId;
        const { page, limit, status, search } = req.query;

        const result = await FanLink.getFanLinksByUser(userId, userAccountId, page, limit, status, search);

        httpResponse(req, res, 200, responseMessage.customMessage('Fan links retrieved successfully'), result);
    } catch (error) {
        next(error);
    }
};

const getFanLinkById = async (req, res, next) => {
    try {
        const userId = req.authenticatedUser._id;
        const userAccountId = req.authenticatedUser.accountId;
        const { fanLinkId } = req.params;

        const fanLink = await FanLink.findOne({ _id: fanLinkId, userId, userAccountId });
        if (!fanLink) {
            return next(new httpError(responseMessage.customMessage('Fan link not found'), 404));
        }

        httpResponse(req, res, 200, responseMessage.customMessage('Fan link retrieved successfully'), fanLink);
    } catch (error) {
        next(error);
    }
};

const getFanLinkStats = async (req, res, next) => {
    try {
        const userId = req.authenticatedUser._id;
        const userAccountId = req.authenticatedUser.accountId;

        const stats = await FanLink.getFanLinkStats(userId, userAccountId);

        httpResponse(req, res, 200, responseMessage.customMessage('Fan link stats retrieved successfully'), stats);
    } catch (error) {
        next(error);
    }
};

const checkCustomUrlAvailability = async (req, res, next) => {
    try {
        const { customUrl } = req.params;

        const existingFanLink = await FanLink.findByCustomUrl(customUrl);

        const isAvailable = !existingFanLink;

        httpResponse(req, res, 200, responseMessage.customMessage('Custom URL availability checked'), {
            customUrl,
            isAvailable,
            message: isAvailable ? 'Custom URL is available' : 'Custom URL is already taken'
        });
    } catch (error) {
        next(error);
    }
};

const getFanLinkByCustomUrl = async (req, res, next) => {
    try {
        const { customUrl } = req.params;

        const fanLink = await FanLink.findOne({ customUrl: customUrl.toLowerCase() })
            .populate('userId', 'firstName lastName profile.photo');
        if (!fanLink) {
            return next(new httpError(responseMessage.customMessage('Fan link not found'), 404));
        }

        if (fanLink.status !== EFanLinkStatus.ACTIVE) {
            return next(new httpError(responseMessage.customMessage('Fan link is not active'), 404));
        }

        await FanLink.incrementClickCount(fanLink._id);

        httpResponse(req, res, 200, responseMessage.customMessage('Fan link retrieved successfully'), fanLink);
    } catch (error) {
        next(error);
    }
};

const userFanLinkController = {
    self,
    createFanLink,
    updateFanLink,
    deleteFanLink,
    getFanLinks,
    getFanLinkById,
    getFanLinkStats,
    checkCustomUrlAvailability,
    getFanLinkByCustomUrl
};

export default userFanLinkController;