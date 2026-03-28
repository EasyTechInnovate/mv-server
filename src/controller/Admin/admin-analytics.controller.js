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
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { emailAddress: { $regex: search, $options: 'i' } },
                    { accountId: { $regex: search, $options: 'i' } }
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

            // Clean up KYC and Payout data if missing/null for consistent display
            const transformedUsers = users.map(u => ({
                ...u,
                kyc: {
                    ...u.kyc,
                    details: {
                        aadhaarNumber: u.kyc?.details?.aadhaarNumber || "",
                        panNumber: u.kyc?.details?.panNumber || "",
                        gstUdhyamNumber: u.kyc?.details?.gstUdhyamNumber || "",
                        passportNumber: u.kyc?.details?.passportNumber || "",
                        vatNumber: u.kyc?.details?.vatNumber || "",
                    }
                },
                payoutMethods: {
                    primaryMethod: u.payoutMethods?.primaryMethod || "bank",
                    bank: {
                        accountHolderName: u.payoutMethods?.bank?.accountHolderName || "",
                        bankName: u.payoutMethods?.bank?.bankName || "",
                        accountNumber: u.payoutMethods?.bank?.accountNumber || "",
                        ifscSwiftCode: u.payoutMethods?.bank?.ifscSwiftCode || "",
                        verified: u.payoutMethods?.bank?.verified || false,
                    },
                    upi: {
                        accountHolderName: u.payoutMethods?.upi?.accountHolderName || "",
                        upiId: u.payoutMethods?.upi?.upiId || "",
                        verified: u.payoutMethods?.upi?.verified || false,
                    },
                    paypal: {
                        accountName: u.payoutMethods?.paypal?.accountName || "",
                        paypalEmail: u.payoutMethods?.paypal?.paypalEmail || "",
                        verified: u.payoutMethods?.paypal?.verified || false,
                    }
                }
            }));

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                users: transformedUsers,
                pagination
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateAggregatorBanner: async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { heading, description } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (user.userType !== 'aggregator') {
                return httpError(next, new Error('User is not an aggregator'), req, 400);
            }

            user.aggregatorBanner = {
                heading: heading || null,
                description: description || null
            };

            await user.save();

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                aggregatorBanner: user.aggregatorBanner
            });
        } catch (error) {
            httpError(next, error, req, 500);
        }
    }
}