import dayjs from "dayjs";
import bcrypt from 'bcryptjs'
import SubscriptionPlan from "../../model/subscriptionPlan.model.js";
import PaymentTransaction from "../../model/paymentTransaction.model.js";
import User from "../../model/user.model.js";
import AggregatorApplication from "../../model/aggregatorApplication.model.js";
import {
  ESubscriptionStatus,
  EPaymentStatus,
  EUserType,
  EUserRole,
  EKYCStatus,
  EPayoutMethod,
  EPlanTargetType
} from "../../constant/application.js";
import responseMessage from "../../constant/responseMessage.js";
import httpResponse from "../../util/httpResponse.js";
import httpError from "../../util/httpError.js";
import quicker from "../../util/quicker.js";

function _formatPlan(plan) {
    return {
        _id: plan._id,
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        targetType: plan.targetType,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        features: plan.features,
        showcaseFeatures: plan.showcaseFeatures,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        isBestValue: plan.isBestValue,
        displayOrder: plan.displayOrder,
        limits: plan.limits,
        trial: plan.trial,
        discount: plan.discount,
        discountedPrice: plan.discountedPrice,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    }
}

export default {
  async self(req, res, next) {
    try {
      httpResponse(
        req,
        res,
        200,
        responseMessage.SERVICE("Admin")
      );
    } catch (err) {
      httpError(next, err, req, 500);
    }
  },

  async updateUserProfile(req, res, next) {
    try {
      const { userId } = req.params
      const {
        firstName, lastName,
        emailAddress,
        phoneNumber,
        address,
        profile,
        artistData,
        labelData,
        aggregatorData
      } = req.body

      const user = await User.findById(userId)
      if (!user) {
        return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404)
      }

      if (firstName !== undefined) user.firstName = firstName.trim()
      if (lastName !== undefined) user.lastName = lastName.trim()

      if (emailAddress !== undefined && emailAddress.trim() !== "") {
        const trimmedEmail = emailAddress.trim().toLowerCase()
        if (trimmedEmail !== user.emailAddress) {
          const emailExists = await User.findOne({ emailAddress: trimmedEmail })
          if (emailExists) {
             return httpError(next, new Error(responseMessage.customMessage("Email address is already in use by another account")), req, 409)
          }
          user.emailAddress = trimmedEmail
        }
      }

      if (phoneNumber !== undefined) {
        if (phoneNumber.isoCode !== undefined) user.phoneNumber.isoCode = phoneNumber.isoCode
        if (phoneNumber.countryCode !== undefined) user.phoneNumber.countryCode = phoneNumber.countryCode
        if (phoneNumber.internationalNumber !== undefined) user.phoneNumber.internationalNumber = phoneNumber.internationalNumber
      }

      if (address !== undefined) {
        if (address.street !== undefined) user.address.street = address.street
        if (address.city !== undefined) user.address.city = address.city
        if (address.state !== undefined) user.address.state = address.state
        if (address.country !== undefined) user.address.country = address.country
        if (address.pinCode !== undefined) user.address.pinCode = address.pinCode
      }

      if (profile !== undefined) {
        if (profile.photo !== undefined) user.profile.photo = profile.photo
        if (profile.bio !== undefined) user.profile.bio = profile.bio
        if (profile.primaryGenre !== undefined) user.profile.primaryGenre = profile.primaryGenre
        if (profile.location !== undefined) {
          if (profile.location.lat !== undefined) user.profile.location.lat = profile.location.lat
          if (profile.location.long !== undefined) user.profile.location.long = profile.location.long
          if (profile.location.address !== undefined) user.profile.location.address = profile.location.address
        }
      }

      if (artistData !== undefined && user.userType === EUserType.ARTIST) {
        if (artistData.artistName !== undefined) user.artistData.artistName = artistData.artistName
        if (artistData.youtubeLink !== undefined) user.artistData.youtubeLink = artistData.youtubeLink
        if (artistData.instagramLink !== undefined) user.artistData.instagramLink = artistData.instagramLink
        if (artistData.facebookLink !== undefined) user.artistData.facebookLink = artistData.facebookLink
      }

      if (labelData !== undefined && user.userType === EUserType.LABEL) {
        if (labelData.labelName !== undefined) user.labelData.labelName = labelData.labelName
        if (labelData.youtubeLink !== undefined) user.labelData.youtubeLink = labelData.youtubeLink
        if (labelData.websiteLink !== undefined) user.labelData.websiteLink = labelData.websiteLink
        if (labelData.popularReleaseLink !== undefined) user.labelData.popularReleaseLink = labelData.popularReleaseLink
        if (labelData.briefInfo !== undefined) user.labelData.briefInfo = labelData.briefInfo
        if (labelData.totalReleases !== undefined) user.labelData.totalReleases = labelData.totalReleases
        if (labelData.releaseFrequency !== undefined) user.labelData.releaseFrequency = labelData.releaseFrequency
        if (labelData.monthlyReleasePlans !== undefined) user.labelData.monthlyReleasePlans = labelData.monthlyReleasePlans
      }

      if (aggregatorData !== undefined && user.userType === EUserType.AGGREGATOR) {
        if (aggregatorData.companyName !== undefined) user.aggregatorData.companyName = aggregatorData.companyName
        if (aggregatorData.youtubeLink !== undefined) user.aggregatorData.youtubeLink = aggregatorData.youtubeLink
        if (aggregatorData.websiteLink !== undefined) user.aggregatorData.websiteLink = aggregatorData.websiteLink
        if (aggregatorData.instagramUrl !== undefined) user.aggregatorData.instagramUrl = aggregatorData.instagramUrl
        if (aggregatorData.facebookUrl !== undefined) user.aggregatorData.facebookUrl = aggregatorData.facebookUrl
        if (aggregatorData.linkedinUrl !== undefined) user.aggregatorData.linkedinUrl = aggregatorData.linkedinUrl
        if (aggregatorData.popularReleaseLinks !== undefined) user.aggregatorData.popularReleaseLinks = aggregatorData.popularReleaseLinks
        if (aggregatorData.popularArtistLinks !== undefined) user.aggregatorData.popularArtistLinks = aggregatorData.popularArtistLinks
        if (aggregatorData.associatedLabels !== undefined) user.aggregatorData.associatedLabels = aggregatorData.associatedLabels
        if (aggregatorData.totalReleases !== undefined) user.aggregatorData.totalReleases = aggregatorData.totalReleases
        if (aggregatorData.releaseFrequency !== undefined) user.aggregatorData.releaseFrequency = aggregatorData.releaseFrequency
        if (aggregatorData.monthlyReleasePlans !== undefined) user.aggregatorData.monthlyReleasePlans = aggregatorData.monthlyReleasePlans
        if (aggregatorData.briefInfo !== undefined) user.aggregatorData.briefInfo = aggregatorData.briefInfo
        if (aggregatorData.additionalServices !== undefined) user.aggregatorData.additionalServices = aggregatorData.additionalServices
        if (aggregatorData.howDidYouKnow !== undefined) user.aggregatorData.howDidYouKnow = aggregatorData.howDidYouKnow
        if (aggregatorData.howDidYouKnowOther !== undefined) user.aggregatorData.howDidYouKnowOther = aggregatorData.howDidYouKnowOther
      }

      await user.save()

      return httpResponse(req, res, 200, responseMessage.customMessage('User profile updated successfully'), {
        user: {
          _id: user._id,
          accountId: user.accountId,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddress: user.emailAddress,
          phoneNumber: user.phoneNumber,
          address: user.address,
          profile: user.profile,
          userType: user.userType,
          artistData: user.userType === EUserType.ARTIST ? user.artistData : undefined,
          labelData: user.userType === EUserType.LABEL ? user.labelData : undefined,
          aggregatorData: user.userType === EUserType.AGGREGATOR ? user.aggregatorData : undefined
        }
      })
    } catch (err) {
      return httpError(next, err, req, 500)
    }
  },

  async reviewUserKYC(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, rejectionReason } = req.body;
      const adminId = req.authenticatedUser._id;

      // Import EKYCStatus if not already imported (it is from application.js)
      const { EKYCStatus } = await import("../../constant/application.js");

      if (!Object.values(EKYCStatus).includes(status)) {
        return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('status')), req, 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404);
      }

      user.kyc.status = status;
      if (status === EKYCStatus.VERIFIED) {
        user.kyc.verifiedAt = new Date();
        user.kyc.verifiedBy = adminId;
        user.kyc.rejectionReason = null;

      } else if (status === EKYCStatus.REJECTED) {
        user.kyc.rejectionReason = rejectionReason || 'KYC Rejected by Administrator';
        user.kyc.verifiedAt = null;
      }

      await user.save();

      await user.save();

      return httpResponse(req, res, 200, responseMessage.customMessage(`KYC status updated to ${status}`), {
        kyc: user.kyc
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async updateUserKYC(req, res, next) {
    try {
      const { userId } = req.params;
      const { residencyType, details, status } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404);
      }

      // Validation logic
      const targetResidency = residencyType || user.kyc.residencyType || "indian";
      if (targetResidency === "indian") {
        if (!details?.aadhaarNumber || !/^\d{12}$/.test(details.aadhaarNumber)) {
          return httpError(next, new Error(responseMessage.customMessage('Invalid 12-digit Aadhaar Number (Mandatory)')), req, 400);
        }
        if (details?.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(details.panNumber.toUpperCase())) {
          return httpError(next, new Error(responseMessage.customMessage('Invalid PAN Number format (e.g. ABCDE1234F)')), req, 400);
        }
      } else {
        if (details?.passportNumber && details.passportNumber.length < 6) {
          return httpError(next, new Error(responseMessage.customMessage('Invalid Passport Number (min 6 characters)')), req, 400);
        }
      }


      if (residencyType) user.kyc.residencyType = residencyType;
      
      if (details) {
        // Initialize if null
        if (!user.kyc.details) user.kyc.details = {};
        Object.assign(user.kyc.details, details);
      }

      if (status) user.kyc.status = status;

      await user.save();

      return httpResponse(req, res, 200, responseMessage.customMessage('User KYC updated successfully'), {
        kyc: user.kyc
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async getAllPlans(req, res, next) {
    try {
      const { includeInactive, targetType } = req.query

      const filter = includeInactive === 'true' ? {} : { isActive: true }
      if (targetType && Object.values(EPlanTargetType).includes(targetType)) {
        filter.targetType = targetType
      }

      const plans = await SubscriptionPlan.find(filter).sort({ displayOrder: 1, createdAt: -1 })

      const formattedPlans = plans.map((plan) => _formatPlan(plan))

      return httpResponse(req, res, 200, responseMessage.SUCCESS, {
        plans: formattedPlans,
        totalPlans: plans.length,
      })
    } catch (err) {
      return httpError(next, err, req, 500)
    }
  },

  async createPlan(req, res, next) {
    try {
      const planData = req.body;

      const existingPlan = await SubscriptionPlan.findOne({
        planId: planData.planId,
      });
      if (existingPlan) {
        return httpError(
          next,
          new Error(
            responseMessage.customMessage("Plan with this ID already exists")
          ),
          req,
          409
        );
      }

      if (planData.discount && planData.discount.validUntil) {
        planData.discount.validUntil = new Date(planData.discount.validUntil);
      }

      const newPlan = new SubscriptionPlan(planData);
      await newPlan.save();

      return httpResponse(req, res, 201, responseMessage.CREATED, _formatPlan(newPlan));
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async getPlanById(req, res, next) {
    try {
      const { planId } = req.params;

      const plan = await SubscriptionPlan.findOne({ planId });
      if (!plan) {
        return httpError(
          next,
          new Error(responseMessage.ERROR.NOT_FOUND("Plan")),
          req,
          404
        );
      }

      const subscriberCount = await User.countDocuments({
        "subscription.planId": planId,
        "subscription.status": ESubscriptionStatus.ACTIVE,
      });

      const totalRevenue = await PaymentTransaction.aggregate([
        {
          $match: {
            planId,
            status: EPaymentStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]);

      return httpResponse(req, res, 200, responseMessage.SUCCESS, {
        ..._formatPlan(plan),
        analytics: {
          subscriberCount,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalTransactions: totalRevenue[0]?.count || 0,
        },
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async updatePlan(req, res, next) {
    try {
      const { planId } = req.params;
      const updateData = req.body;

      const plan = await SubscriptionPlan.findOne({ planId });
      if (!plan) {
        return httpError(
          next,
          new Error(responseMessage.ERROR.NOT_FOUND("Plan")),
          req,
          404
        );
      }

      if (updateData.discount && updateData.discount.validUntil) {
        updateData.discount.validUntil = new Date(
          updateData.discount.validUntil
        );
      }

      Object.keys(updateData).forEach((key) => {
        if (Array.isArray(updateData[key])) {
            // Arrays (e.g. showcaseFeatures) are fully replaced
            plan[key] = updateData[key]
        } else if (typeof updateData[key] === 'object' && updateData[key] !== null) {
            plan[key] = plan[key] ? Object.assign(plan[key], updateData[key]) : updateData[key]
        } else {
            plan[key] = updateData[key]
        }
      })

      await plan.save()

      return httpResponse(req, res, 200, responseMessage.UPDATED, _formatPlan(plan));
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async deletePlan(req, res, next) {
    try {
      const { planId } = req.params;

      const plan = await SubscriptionPlan.findOne({ planId });
      if (!plan) {
        return httpError(
          next,
          new Error(responseMessage.ERROR.NOT_FOUND("Plan")),
          req,
          404
        );
      }

      const activeSubscribers = await User.countDocuments({
        "subscription.planId": planId,
        "subscription.status": ESubscriptionStatus.ACTIVE,
      });

      if (activeSubscribers > 0) {
        return httpError(
          next,
          new Error(
            responseMessage.customMessage(
              "Cannot delete plan with active subscribers"
            )
          ),
          req,
          400
        );
      }

      await SubscriptionPlan.deleteOne({ planId });

      return httpResponse(req, res, 200, responseMessage.DELETED, {
        planId,
        message: "Plan deleted successfully",
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async activatePlan(req, res, next) {
    try {
      const { planId } = req.params;

      const plan = await SubscriptionPlan.findOne({ planId });
      if (!plan) {
        return httpError(
          next,
          new Error(responseMessage.ERROR.NOT_FOUND("Plan")),
          req,
          404
        );
      }

      plan.isActive = true;
      await plan.save();

      return httpResponse(req, res, 200, responseMessage.UPDATED, {
        planId,
        isActive: plan.isActive,
        message: "Plan activated successfully",
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async deactivatePlan(req, res, next) {
    try {
      const { planId } = req.params;

      const plan = await SubscriptionPlan.findOne({ planId });
      if (!plan) {
        return httpError(
          next,
          new Error(responseMessage.ERROR.NOT_FOUND("Plan")),
          req,
          404
        );
      }

      plan.isActive = false;
      await plan.save();

      return httpResponse(req, res, 200, responseMessage.UPDATED, {
        planId,
        isActive: plan.isActive,
        message: "Plan deactivated successfully",
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async getSubscribers(req, res, next) {
    try {
      const { page = 1, limit = 20, planId, search } = req.query
      const skip = (parseInt(page) - 1) * parseInt(limit)

      const filter = {
        'subscription.status': ESubscriptionStatus.ACTIVE,
        role: 'user'
      }
      if (planId) filter['subscription.planId'] = planId
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName:  { $regex: search, $options: 'i' } },
          { emailAddress: { $regex: search, $options: 'i' } }
        ]
      }

      const [subscribers, total] = await Promise.all([
        User.find(filter)
          .select('firstName lastName emailAddress userType accountId subscription createdAt')
          .sort({ 'subscription.validUntil': 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(filter)
      ])

      const data = subscribers.map(u => ({
        _id: u._id,
        accountId: u.accountId,
        name: `${u.firstName} ${u.lastName}`,
        emailAddress: u.emailAddress,
        userType: u.userType,
        subscription: {
          planId: u.subscription.planId,
          status: u.subscription.status,
          validFrom: u.subscription.validFrom,
          validUntil: u.subscription.validUntil,
          autoRenewal: u.subscription.autoRenewal
        }
      }))

      return httpResponse(req, res, 200, responseMessage.SUCCESS, {
        subscribers: data,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalSubscribers: total,
          hasNextPage: skip + parseInt(limit) < total,
          hasPreviousPage: parseInt(page) > 1
        }
      })
    } catch (err) {
      return httpError(next, err, req, 500)
    }
  },

  async updateAggregatorSubscription(req, res, next) {
    try {
      const { userId } = req.params
      const { startDate, endDate, notes } = req.body
      const adminId = req.authenticatedUser._id

      const user = await User.findById(userId)
      if (!user) {
        return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404)
      }

      if (user.userType !== EUserType.AGGREGATOR) {
        return httpError(next, new Error(responseMessage.customMessage('This action is only allowed for aggregator accounts')), req, 400)
      }

      user.aggregatorSubscription = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes: notes || null,
        managedBy: adminId
      }
      await user.save()

      return httpResponse(req, res, 200, responseMessage.UPDATED, {
        userId: user._id,
        accountId: user.accountId,
        aggregatorSubscription: user.aggregatorSubscription,
        isCurrentlyActive: user.hasActiveAggregatorSubscription
      })
    } catch (err) {
      return httpError(next, err, req, 500)
    }
  },

  async getRevenueSummary(req, res, next) {
    try {
      const { startDate, endDate, planId } = req.query;

      const matchStage = {
        status: EPaymentStatus.COMPLETED,
      };

      if (planId) matchStage.planId = planId;

      if (startDate || endDate) {
        matchStage.completedAt = {};
        if (startDate) matchStage.completedAt.$gte = new Date(startDate);
        if (endDate) matchStage.completedAt.$lte = new Date(endDate);
      }

      const [totalRevenue, revenueByPlan, revenueByMonth] = await Promise.all([
        PaymentTransaction.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" },
              totalTransactions: { $sum: 1 },
              avgTransactionValue: { $avg: "$amount" },
            },
          },
        ]),

        PaymentTransaction.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$planId",
              totalAmount: { $sum: "$amount" },
              transactionCount: { $sum: 1 },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),

        PaymentTransaction.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                year: { $year: "$completedAt" },
                month: { $month: "$completedAt" },
              },
              totalAmount: { $sum: "$amount" },
              transactionCount: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": -1, "_id.month": -1 } },
          { $limit: 12 },
        ]),
      ]);

      const summary = {
        total: totalRevenue[0] || {
          totalAmount: 0,
          totalTransactions: 0,
          avgTransactionValue: 0,
        },
        byPlan: revenueByPlan,
        byMonth: revenueByMonth.reverse(),
      };

      return httpResponse(req, res, 200, responseMessage.SUCCESS, summary);
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async getUserStats(req, res, next) {
    try {
      const [totalUsers, usersByType, recentRegistrations, activeSubscribers] =
        await Promise.all([
          User.countDocuments({ isActive: true }),

          User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$userType", count: { $sum: 1 } } },
          ]),

          User.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(30)
            .select("firstName lastName emailAddress userType createdAt"),

          User.countDocuments({
            isActive: true,
            "subscription.status": ESubscriptionStatus.ACTIVE,
          }),
        ]);

      const userTypeStats = Object.values(EUserType).map((type) => ({
        userType: type,
        count: usersByType.find((stat) => stat._id === type)?.count || 0,
      }));

      const stats = {
        totalUsers,
        activeSubscribers,
        subscriptionRate:
          totalUsers > 0
            ? ((activeSubscribers / totalUsers) * 100).toFixed(2)
            : 0,
        usersByType: userTypeStats,
        recentRegistrations: recentRegistrations.map((user) => ({
          _id: user._id,
          fullName: `${user.firstName} ${user.lastName}`,
          emailAddress: user.emailAddress,
          userType: user.userType,
          registeredAt: user.createdAt,
        })),
      };

      return httpResponse(req, res, 200, responseMessage.SUCCESS, stats);
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async getSubscriptionStats(req, res, next) {
    try {
      const [subscriptionsByPlan, subscriptionsByStatus, subscriptionGrowth] =
        await Promise.all([
          User.aggregate([
            { $match: { "subscription.planId": { $exists: true, $ne: null } } },
            { $group: { _id: "$subscription.planId", count: { $sum: 1 } } },
          ]),

          User.aggregate([
            { $match: { "subscription.status": { $exists: true } } },
            { $group: { _id: "$subscription.status", count: { $sum: 1 } } },
          ]),

          User.aggregate([
            {
              $match: {
                "subscription.status": ESubscriptionStatus.ACTIVE,
                "subscription.validFrom": { $exists: true },
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: "$subscription.validFrom" },
                  month: { $month: "$subscription.validFrom" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 12 },
          ]),
        ]);

      const plans = await SubscriptionPlan.find({}, "planId name").lean();
      const planNames = plans.reduce((acc, plan) => {
        acc[plan.planId] = plan.name;
        return acc;
      }, {});

      const stats = {
        byPlan: subscriptionsByPlan.map((stat) => ({
          planId: stat._id,
          planName: planNames[stat._id] || "Unknown Plan",
          count: stat.count,
        })),
        byStatus: subscriptionsByStatus.map((stat) => ({
          status: stat._id,
          count: stat.count,
        })),
        growth: subscriptionGrowth.reverse().map((stat) => ({
          period: `${stat._id.year}-${String(stat._id.month).padStart(2, "0")}`,
          newSubscriptions: stat.count,
        })),
      };

      return httpResponse(req, res, 200, responseMessage.SUCCESS, stats);
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

    async getAllAggregatorApplications(req, res, next) {
    try {
      const { status, page = 1, limit = 10, search } = req.query;

      const query = {};
      if (status) {
        query.applicationStatus = status;
      }

      if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { emailAddress: searchRegex },
          { companyName: searchRegex },
        ];
      }

      const skip = (page - 1) * limit;
      const applications = await AggregatorApplication.find(query)
        .populate("reviewedBy", "firstName lastName emailAddress")
        .populate("createdAccountId", "firstName lastName emailAddress")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalApplications =
        await AggregatorApplication.countDocuments(query);

      const responseData = {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalApplications / limit),
          totalApplications,
          hasNextPage: page * limit < totalApplications,
          hasPrevPage: page > 1,
        },
      };

      return httpResponse(req, res, 200, responseMessage.SUCCESS, responseData);
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async getAggregatorApplication(req, res, next) {
    try {
      const { applicationId } = req.params

      const application = await AggregatorApplication.findById(applicationId)
        .populate('reviewedBy', 'firstName lastName emailAddress')
        .populate('createdAccountId', 'firstName lastName emailAddress')

      if (!application) {
        return httpError(
          next,
          new Error(responseMessage.customMessage('Application not found')),
          req,
          404
        )
      }

      return httpResponse(
        req,
        res,
        200,
        responseMessage.SUCCESS,
        { application }
      )
    } catch (err) {
      return httpError(next, err, req, 500)
    }
  },

  async reviewAggregatorApplication(req, res, next) {
    try {
      const { applicationId } = req.params
      const { applicationStatus, adminNotes } = req.body
      const adminId = req.authenticatedUser._id

      const application = await AggregatorApplication.findById(applicationId)

      if (!application) {
        return httpError(
          next,
          new Error(responseMessage.customMessage('Application not found')),
          req,
          404
        )
      }

      if (application.applicationStatus !== 'pending') {
        return httpError(
          next,
          new Error(responseMessage.customMessage('Application has already been reviewed')),
          req,
          400
        )
      }

      application.applicationStatus = applicationStatus
      application.adminNotes = adminNotes || null
      application.reviewedAt = new Date()
      application.reviewedBy = adminId

      await application.save()

      const responseData = {
        application: {
          _id: application._id,
          companyName: application.companyName,
          emailAddress: application.emailAddress,
          applicationStatus: application.applicationStatus,
          adminNotes: application.adminNotes,
          reviewedAt: application.reviewedAt
        }
      }

      return httpResponse(
        req,
        res,
        200,
        responseMessage.customMessage(`Application ${applicationStatus} successfully`),
        responseData
      )
    } catch (err) {
      return httpError(next, err, req, 500)
    }
  },

  async createAggregatorAccount(req, res, next) {
    try {
      const { applicationId } = req.params
      const { password } = req.body

      const application = await AggregatorApplication.findById(applicationId)

      if (!application) {
        return httpError(
          next,
          new Error(responseMessage.customMessage('Application not found')),
          req,
          404
        )
      }

      if (application.applicationStatus !== 'approved') {
        return httpError(
          next,
          new Error(responseMessage.customMessage('Only approved applications can have accounts created')),
          req,
          400
        )
      }

      if (application.isAccountCreated) {
        return httpError(
          next,
          new Error(responseMessage.customMessage('Account has already been created for this application')),
          req,
          400
        )
      }

      const existingUser = await User.findOne({ emailAddress: application.emailAddress })
      if (existingUser) {
        return httpError(
          next,
          new Error(responseMessage.customMessage('A user with this email already exists')),
          req,
          409
        )
      }

      const accountId = await quicker.generateAccountId(EUserType.AGGREGATOR, User)

      const aggregatorUser = new User({
        firstName: application.firstName,
        lastName: application.lastName,
        accountId,
        emailAddress: application.emailAddress,
        password: password,
        role: EUserRole.USER,
        userType: EUserType.AGGREGATOR,
        phoneNumber: {
          isoCode: 'IN',
          countryCode: '+91',
          internationalNumber: application.phoneNumber
        },
        address: {
          street: application.companyName || 'N/A',
          city: 'N/A',
          state: 'N/A',
          country: 'India',
          pinCode: '000000'
        },
        consent: {
          terms: true,
          privacy: true,
          marketing: false
        },
        companyName: application.companyName,
        isActive: true,
        isEmailVerified: true,
        aggregatorData: {
          companyName: application.companyName,
          websiteLink: application.websiteLink,
          instagramUrl: application.instagramUrl,
          facebookUrl: application.facebookUrl,
          linkedinUrl: application.linkedinUrl,
          youtubeLink: application.youtubeLink,
          popularReleaseLinks: application.popularReleaseLinks,
          popularArtistLinks: application.popularArtistLinks,
          associatedLabels: application.associatedLabels,
          totalReleases: application.totalReleases,
          releaseFrequency: application.releaseFrequency,
          monthlyReleasePlans: application.monthlyReleasePlans,
          briefInfo: application.briefInfo,
          additionalServices: application.additionalServices,
          howDidYouKnow: application.howDidYouKnow,
          howDidYouKnowOther: application.howDidYouKnowOther
        }
      })

      await aggregatorUser.save()

      application.isAccountCreated = true
      application.createdAccountId = aggregatorUser._id
      await application.save()

      aggregatorUser.addNotification(
        'Welcome to Maheshwari Visuals!',
        'Your aggregator account has been created successfully. You can now login and access all features.',
        'success'
      )
      
      await aggregatorUser.save()

      const responseData = {
        user: {
          _id: aggregatorUser._id,
          accountId: aggregatorUser.accountId,
          firstName: aggregatorUser.firstName,
          lastName: aggregatorUser.lastName,
          emailAddress: aggregatorUser.emailAddress,
          role: aggregatorUser.role,
          userType: aggregatorUser.userType,
          companyName: aggregatorUser.companyName,
          createdAt: aggregatorUser.createdAt
        },
        application: {
          _id: application._id,
          isAccountCreated: application.isAccountCreated
        }
      }

      return httpResponse(
        req,
        res,
        201,
        responseMessage.customMessage('Aggregator account created successfully'),
        responseData
      )
    } catch (err) {
      return httpError(next, err, req, 500)
    }
  },

  async resetUserPassword(req, res, next) {
    try {
      const { userId } = req.params;
      const { password } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return httpError(
          next,
          new Error(responseMessage.ERROR.NOT_FOUND("User")),
          req,
          404
        );
      }

      // Update password (pre-save hook in user model handles hashing)
      user.password = password;

      // Clear any pending reset password tokens
      if (user.passwordReset) {
        user.passwordReset.isUsed = true;
        user.passwordReset.token = null;
        user.passwordReset.expiresAt = null;
      }

      await user.save();

      user.addNotification(
        "Password Reset by Admin",
        "Your account password has been reset by an administrator.",
        "warning"
      );
      await user.save();

      return httpResponse(
        req,
        res,
        200,
        responseMessage.customMessage("User password reset successfully")
      );
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async updateUserPayoutMethods(req, res, next) {
    try {
      const { userId } = req.params;
      const { bank, upi, paypal, primaryMethod } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('User')), req, 404);
      }

      if (primaryMethod) {
        if (!Object.values(EPayoutMethod).includes(primaryMethod)) {
           return httpError(next, new Error(responseMessage.customMessage('Invalid primary payout method')), req, 400);
        }
        user.payoutMethods.primaryMethod = primaryMethod;
      }

      if (bank) {
        if (bank.accountNumber && !/^\d{9,18}$/.test(bank.accountNumber)) {
          return httpError(next, new Error(responseMessage.customMessage('Invalid Bank Account Number (9-18 digits)')), req, 400);
        }
        
        user.payoutMethods.bank.accountHolderName = bank.accountHolderName ?? user.payoutMethods.bank.accountHolderName;
        user.payoutMethods.bank.bankName = bank.bankName ?? user.payoutMethods.bank.bankName;
        user.payoutMethods.bank.accountNumber = bank.accountNumber ?? user.payoutMethods.bank.accountNumber;
        user.payoutMethods.bank.ifscSwiftCode = bank.ifscSwiftCode ?? user.payoutMethods.bank.ifscSwiftCode;
        if (bank.verified !== undefined) user.payoutMethods.bank.verified = bank.verified;
      }

      if (upi) {
        if (upi.upiId && !/^[\w.-]+@[\w.-]+$/.test(upi.upiId)) {
          return httpError(next, new Error(responseMessage.customMessage('Invalid UPI ID format')), req, 400);
        }
        user.payoutMethods.upi.upiId = upi.upiId ?? user.payoutMethods.upi.upiId;
        user.payoutMethods.upi.accountHolderName = upi.accountHolderName ?? user.payoutMethods.upi.accountHolderName;
        if (upi.verified !== undefined) user.payoutMethods.upi.verified = upi.verified;
      }

      if (paypal) {
        if (paypal.paypalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal.paypalEmail)) {
           return httpError(next, new Error(responseMessage.customMessage('Invalid PayPal Email format')), req, 400);
        }
        user.payoutMethods.paypal.accountName = paypal.accountName ?? user.payoutMethods.paypal.accountName;
        user.payoutMethods.paypal.paypalEmail = paypal.paypalEmail ?? user.payoutMethods.paypal.paypalEmail;
        if (paypal.verified !== undefined) user.payoutMethods.paypal.verified = paypal.verified;
      }

      await user.save();

      return httpResponse(req, res, 200, responseMessage.customMessage('User payout methods updated successfully'), {
        payoutMethods: user.payoutMethods
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },
  async deleteAggregatorApplication(req, res, next) {
    try {
      const { applicationId } = req.params;

      const application = await AggregatorApplication.findById(applicationId);
      if (!application) {
        return httpError(
          next,
          new Error(responseMessage.customMessage("Application not found")),
          req,
          404
        );
      }

      await AggregatorApplication.deleteOne({ _id: applicationId });

      return httpResponse(req, res, 200, responseMessage.DELETED, {
        applicationId,
        message: "Aggregator application deleted successfully",
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },

  async bulkDeleteAggregatorApplications(req, res, next) {
    try {
      const { applicationIds } = req.body;

      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        return httpError(
          next,
          new Error(responseMessage.customMessage("No application IDs provided")),
          req,
          400
        );
      }

      await AggregatorApplication.deleteMany({ _id: { $in: applicationIds } });

      return httpResponse(req, res, 200, responseMessage.DELETED, {
        count: applicationIds.length,
        message: "Aggregator applications deleted successfully",
      });
    } catch (err) {
      return httpError(next, err, req, 500);
    }
  },
};
