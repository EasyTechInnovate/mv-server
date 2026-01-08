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
} from "../../constant/application.js";
import responseMessage from "../../constant/responseMessage.js";
import httpResponse from "../../util/httpResponse.js";
import httpError from "../../util/httpError.js";
import quicker from "../../util/quicker.js";

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

  async getAllPlans(req, res, next) {
    try {
      const { includeInactive } = req.query;

      const filter = includeInactive === "true" ? {} : { isActive: true };
      const plans = await SubscriptionPlan.find(filter).sort({
        displayOrder: 1,
        createdAt: -1,
      });

      const formattedPlans = plans.map((plan) => ({
        _id: plan._id,
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        features: plan.features,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        isBestValue: plan.isBestValue,
        displayOrder: plan.displayOrder,
        limits: plan.limits,
        trial: plan.trial,
        discount: plan.discount,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      }));

      return httpResponse(req, res, 200, responseMessage.SUCCESS, {
        plans: formattedPlans,
        totalPlans: plans.length,
      });
    } catch (err) {
      return httpError(next, err, req, 500);
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

      const formattedPlan = {
        _id: newPlan._id,
        planId: newPlan.planId,
        name: newPlan.name,
        description: newPlan.description,
        price: newPlan.price,
        currency: newPlan.currency,
        interval: newPlan.interval,
        intervalCount: newPlan.intervalCount,
        features: newPlan.features,
        isActive: newPlan.isActive,
        isPopular: newPlan.isPopular,
        isBestValue: newPlan.isBestValue,
        displayOrder: newPlan.displayOrder,
        limits: newPlan.limits,
        trial: newPlan.trial,
        discount: newPlan.discount,
        createdAt: newPlan.createdAt,
      };

      return httpResponse(
        req,
        res,
        201,
        responseMessage.CREATED,
        formattedPlan
      );
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

      const planData = {
        _id: plan._id,
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        features: plan.features,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        isBestValue: plan.isBestValue,
        displayOrder: plan.displayOrder,
        limits: plan.limits,
        trial: plan.trial,
        discount: plan.discount,
        analytics: {
          subscriberCount,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalTransactions: totalRevenue[0]?.count || 0,
        },
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };

      return httpResponse(req, res, 200, responseMessage.SUCCESS, planData);
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
        if (
          typeof updateData[key] === "object" &&
          updateData[key] !== null &&
          !Array.isArray(updateData[key])
        ) {
          if (plan[key]) {
            Object.assign(plan[key], updateData[key]);
          } else {
            plan[key] = updateData[key];
          }
        } else {
          plan[key] = updateData[key];
        }
      });

      await plan.save();

      const formattedPlan = {
        _id: plan._id,
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        features: plan.features,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        isBestValue: plan.isBestValue,
        displayOrder: plan.displayOrder,
        limits: plan.limits,
        trial: plan.trial,
        discount: plan.discount,
        updatedAt: plan.updatedAt,
      };

      return httpResponse(
        req,
        res,
        200,
        responseMessage.UPDATED,
        formattedPlan
      );
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
      const { status, page = 1, limit = 10 } = req.query

      const query = {}
      if (status) {
        query.applicationStatus = status
      }

      const skip = (page - 1) * limit
      const applications = await AggregatorApplication.find(query)
        .populate('reviewedBy', 'firstName lastName emailAddress')
        .populate('createdAccountId', 'firstName lastName emailAddress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))

      const totalApplications = await AggregatorApplication.countDocuments(query)

      const responseData = {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalApplications / limit),
          totalApplications,
          hasNextPage: page * limit < totalApplications,
          hasPrevPage: page > 1
        }
      }

      return httpResponse(req, res, 200, responseMessage.SUCCESS, responseData)
    } catch (err) {
      return httpError(next, err, req, 500)
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
};
