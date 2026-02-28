import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import {
  EUserRole,
  EUserType,
  EKYCStatus,
  ESubscriptionStatus,
  ENotificationType,
  ETeamRole,
  EDepartment,
  EModuleAccess,
  ETeamMemberStatus,
} from "../constant/application.js";

dayjs.extend(utc);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    accountId: {
      type: String,
      unique: true,
      required: [true, "Account ID is required"],
      trim: true,
    },

    emailAddress: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    phoneNumber: {
      _id: false,
      isoCode: {
        type: String,
        required: function () {
          return this.role === EUserRole.USER;
        },
      },
      countryCode: {
        type: String,
        required: function () {
          return this.role === EUserRole.USER;
        },
      },
      internationalNumber: {
        type: String,
        required: function () {
          return this.role === EUserRole.USER;
        },
      },
    },
    accountConfirmation: {
      _id: false,
      token: {
        type: String,
        default: null,
      },
      code: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      isUsed: {
        type: Boolean,
        default: false,
      },
    },

    address: {
      _id: false,
      street: {
        type: String,
        required: function () {
          return this.role === EUserRole.USER;
        },
        trim: true,
      },
      city: {
        type: String,
        required: function () {
          return this.role === EUserRole.USER;
        },
        trim: true,
      },
      state: {
        type: String,
        required: function () {
          return this.role === EUserRole.USER;
        },
        trim: true,
      },
      country: {
        type: String,
        required: function () {
          return this.role === EUserRole.USER;
        },
        trim: true,
      },
      pinCode: {
        type: String,
        required: function () {
          return this.role === EUserRole.USER;
        },
        trim: true,
      },
    },

    password: {
      type: String,
      required: function () {
        return !this.googleAuth?.googleId && !(this.role === EUserRole.TEAM_MEMBER && !this.isInvitationAccepted);
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },

    refreshTokens: [{
      type: String,
    }],

    passwordReset: {
      _id: false,
      token: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      isUsed: {
        type: Boolean,
        default: false,
      },
    },

    role: {
      type: String,
      enum: Object.values(EUserRole),
      default: EUserRole.USER,
    },

    teamRole: {
      type: String,
      enum: Object.values(ETeamRole),
      required: function () {
        return this.role === EUserRole.TEAM_MEMBER;
      },
    },

    department: {
      type: String,
      enum: Object.values(EDepartment),
      required: function () {
        return this.role === EUserRole.TEAM_MEMBER;
      },
    },

    moduleAccess: [{
      type: String,
      enum: Object.values(EModuleAccess),
    }],

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isInvitationAccepted: {
      type: Boolean,
      default: false,
    },

    invitationToken: {
      type: String,
      default: null,
    },

    invitationExpiresAt: {
      type: Date,
      default: null,
    },

    userType: {
      type: String,
      enum: Object.values(EUserType),
      required: function () {
        return this.role === EUserRole.USER;
      },
    },

    profile: {
      _id: false,
      photo: {
        type: String,
        default: null,
      },
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        default: null,
      },
      primaryGenre: {
        type: String,
        default: null,
      },
      location: {
        _id: false,
        lat: {
          type: Number,
          default: null,
        },
        long: {
          type: Number,
          default: null,
        },
        address: {
          type: String,
          default: null,
        },
      },
    },

    artistData: {
      _id: false,
      artistName: {
        type: String,
        required: function () {
          return (
            this.userType === EUserType.ARTIST && this.role === EUserRole.USER
          );
        },
        trim: true,
      },
      youtubeLink: {
        type: String,
        default: null,
      },
      instagramLink: {
        type: String,
        default: null,
      },
      facebookLink: {
        type: String,
        default: null,
      },
    },

    labelData: {
      _id: false,
      labelName: {
        type: String,
        required: function () {
          return (
            this.userType === EUserType.LABEL && this.role === EUserRole.USER
          );
        },
        trim: true,
      },
      youtubeLink: {
        type: String,
        default: null,
      },
      websiteLink: {
        type: String,
        default: null,
      },
      popularReleaseLink: {
        type: String,
        default: null,
      },
      popularArtistLinks: [
        {
          type: String,
        },
      ],
      totalReleases: {
        type: Number,
        min: [0, "Total releases cannot be negative"],
        default: 0,
      },
      releaseFrequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
        default: null,
      },
      monthlyReleasePlans: {
        type: Number,
        min: [0, "Monthly release plans cannot be negative"],
        default: 0,
      },
      briefInfo: {
        type: String,
        maxlength: [1000, "Brief info cannot exceed 1000 characters"],
        default: null,
      },
    },

    aggregatorData: {
      _id: false,
      companyName: {
        type: String,
        required: function () {
          return (
            this.userType === EUserType.AGGREGATOR &&
            this.role === EUserRole.USER
          );
        },
        trim: true,
      },
      youtubeLink: {
        type: String,
        default: null,
      },
      websiteLink: {
        type: String,
        default: null,
      },
      instagramUrl: {
        type: String,
        default: null,
      },
      facebookUrl: {
        type: String,
        default: null,
      },
      linkedinUrl: {
        type: String,
        default: null,
      },
      popularReleaseLinks: [
        {
          type: String,
        },
      ],
      popularArtistLinks: [
        {
          type: String,
        },
      ],
      associatedLabels: [
        {
          type: String,
        },
      ],
      totalReleases: {
        type: Number,
        min: [0, "Total releases cannot be negative"],
        default: 0,
      },
      releaseFrequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
        default: null,
      },
      monthlyReleasePlans: {
        type: Number,
        min: [0, "Monthly release plans cannot be negative"],
        default: 0,
      },
      briefInfo: {
        type: String,
        maxlength: [1000, "Brief info cannot exceed 1000 characters"],
        default: null,
      },
      additionalServices: [
        {
          type: String,
          enum: ["music_marketing", "youtube_cms", "music_video_distribution"],
        },
      ],
      howDidYouKnow: {
        type: String,
        enum: ["social_media", "friend", "advertisement", "other"],
        default: null,
      },
      howDidYouKnowOther: {
        type: String,
        default: null,
      },
    },

    aggregatorBanner: {
      _id: false,
      heading: {
        type: String,
        default: null,
      },
      description: {
        type: String,
        default: null,
      },
    },

    socialMedia: {
      _id: false,
      spotify: {
        type: String,
        default: null,
      },
      instagram: {
        type: String,
        default: null,
      },
      youtube: {
        type: String,
        default: null,
      },
      tiktok: {
        type: String,
        default: null,
      },
      linkedin: {
        type: String,
        default: null,
      },
      website: {
        type: String,
        default: null,
      },
      facebook: {
        type: String,
        default: null,
      },
      twitter: {
        type: String,
        default: null,
      },
    },

    kyc: {
      _id: false,
      status: {
        type: String,
        enum: Object.values(EKYCStatus),
        default: EKYCStatus.UNVERIFIED,
      },
      documents: {
        _id: false,
        aadhaar: {
          _id: false,
          number: {
            type: String,
            default: null,
          },
          documentUrl: {
            type: String,
            default: null,
          },
          verified: {
            type: Boolean,
            default: false,
          },
        },
        pan: {
          _id: false,
          number: {
            type: String,
            default: null,
          },
          documentUrl: {
            type: String,
            default: null,
          },
          verified: {
            type: Boolean,
            default: false,
          },
        },
      },
      verificationId: {
        type: String,
        default: null,
      },
      aadhaarVerified: {
        type: Boolean,
        default: false,
      },
      panVerified: {
        type: Boolean,
        default: false,
      },
      verificationApiResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      bankDetails: {
        _id: false,
        accountNumber: {
          type: String,
          default: null,
        },
        ifscCode: {
          type: String,
          default: null,
        },
        accountHolderName: {
          type: String,
          default: null,
        },
        bankName: {
          type: String,
          default: null,
        },
        verified: {
          type: Boolean,
          default: false,
        },
      },
      upiDetails: {
        _id: false,
        upiId: {
          type: String,
          default: null,
        },
        verified: {
          type: Boolean,
          default: false,
        },
      },
      submittedAt: {
        type: Date,
        default: null,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      rejectionReason: {
        type: String,
        default: null,
      },
    },

    taxInfo: {
      _id: false,
      panNumber: {
        type: String,
        default: null,
      },
      gstNumber: {
        type: String,
        default: null,
      },
      billingAddress: {
        _id: false,
        street: {
          type: String,
          default: null,
        },
        city: {
          type: String,
          default: null,
        },
        state: {
          type: String,
          default: null,
        },
        country: {
          type: String,
          default: null,
        },
        pinCode: {
          type: String,
          default: null,
        },
      },
    },

    subscription: {
      _id: false,
      planId: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        enum: Object.values(ESubscriptionStatus),
        default: ESubscriptionStatus.INACTIVE,
      },
      validFrom: {
        type: Date,
        default: null,
      },
      validUntil: {
        type: Date,
        default: null,
      },
      autoRenewal: {
        type: Boolean,
        default: true,
      },
      razorpaySubscriptionId: {
        type: String,
        default: null,
      },
      lastPaymentDate: {
        type: Date,
        default: null,
      },
      nextPaymentDate: {
        type: Date,
        default: null,
      },
    },

    sublabels: [{
      sublabel: {
        type: Schema.Types.ObjectId,
        ref: 'Sublabel',
        required: true
      },
      assignedAt: {
        type: Date,
        default: Date.now
      },
      isDefault: {
        type: Boolean,
        default: false
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],

    profileCompletion: {
      _id: false,
      isComplete: {
        type: Boolean,
        default: false,
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      missingFields: [
        {
          type: String,
        },
      ],
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    featureAccess: {
      _id: false,
      canUploadMusic: {
        type: Boolean,
        default: false,
      },
      canAccessAnalytics: {
        type: Boolean,
        default: false,
      },
      canManageDistribution: {
        type: Boolean,
        default: false,
      },
      uploadLimit: {
        type: Number,
        default: 0,
      },
      monthlyUploadsUsed: {
        type: Number,
        default: 0,
      },
      lastUploadReset: {
        type: Date,
        default: Date.now,
      },
    },

    security: {
      _id: false,
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
      twoFactorSecret: {
        type: String,
        default: null,
      },
      backupCodes: [
        {
          type: String,
        },
      ],
      lastPasswordChange: {
        type: Date,
        default: null,
      },
    },

    notifications: {
      _id: false,
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
    },



    consent: {
      _id: false,
      terms: {
        type: Boolean,
        required: function () {
          return this.role === EUserRole.USER;
        },
      },
      privacy: {
        type: Boolean,
        required: function () {
          return this.role === EUserRole.USER;
        },
      },
      marketing: {
        type: Boolean,
        default: false,
      },
      agreedAt: {
        type: Date,
        default: Date.now,
      },
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    kycStatus: {
      _id: false,
      isCompleted: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
      },
      submittedAt: {
        type: Date,
        default: null,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      rejectedAt: {
        type: Date,
        default: null,
      },
      rejectionReason: {
        type: String,
        default: null,
      },
      documents: {
        _id: false,
        aadharCard: {
          type: String,
          default: null,
        },
        panCard: {
          type: String,
          default: null,
        },
      },
    },

    loginInfo: {
      _id: false,
      lastLogin: {
        type: Date,
        default: null,
      },
      loginCount: {
        type: Number,
        default: 0,
      },
      lastLoginIP: {
        type: String,
        default: null,
      },
      registrationIP: {
        type: String,
        default: null,
      },
    },

    userNotifications: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        title: {
          type: String,
          required: [true, "Notification title is required"],
        },
        message: {
          type: String,
          required: [true, "Notification message is required"],
        },
        type: {
          type: String,
          enum: Object.values(ENotificationType),
          default: "info",
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        readAt: {
          type: Date,
          default: null,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ "phoneNumber.internationalNumber": 1 });
userSchema.index({ userType: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ "kyc.status": 1 });
userSchema.index({ "subscription.status": 1 });
userSchema.index({ "sublabels.sublabel": 1 });
userSchema.index({ "sublabels.isActive": 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ userType: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ "kyc.status": 1, userType: 1 });

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("hasActiveSubscription").get(function () {
  return (
    this.subscription.status === ESubscriptionStatus.ACTIVE &&
    this.subscription.validUntil &&
    new Date() <= this.subscription.validUntil
  );
});

userSchema.virtual("unreadNotificationsCount").get(function () {
  return this.userNotifications?.filter((n) => !n.isRead).length || 0;
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next()
    
    try {
        const salt = await bcrypt.genSalt(12)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (error) {
        next(error)
        
    }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasRole = function (checkRole) {
  return this.role === checkRole;
};

userSchema.methods.setRole = function (newRole) {
  this.role = newRole;
};

userSchema.methods.addNotification = function (
  title,
  message,
  type = "info",
  expiresAt = null
) {
  this.userNotifications.push({
    title,
    message,
    type,
    expiresAt,
  });
};

userSchema.methods.markNotificationAsRead = function (notificationId) {
  const notification = this.userNotifications.id(notificationId);
  if (notification) {
    notification.isRead = true;
    notification.readAt = new Date();
  }
};

userSchema.methods.updateLoginInfo = function (ip) {
  this.loginInfo.lastLogin = dayjs().utc().toDate();
  this.loginInfo.loginCount += 1;
  this.loginInfo.lastLoginIP = ip;
};

userSchema.methods.activateSubscription = function (
  planId,
  validUntil,
  razorpaySubscriptionId = null
) {
  this.subscription.planId = planId;
  this.subscription.status = ESubscriptionStatus.ACTIVE;
  this.subscription.validFrom = new Date();
  this.subscription.validUntil = validUntil;
  this.subscription.lastPaymentDate = new Date();
  this.subscription.razorpaySubscriptionId = razorpaySubscriptionId;

  this.featureAccess.canUploadMusic = true;
  this.featureAccess.canAccessAnalytics = true;
  this.featureAccess.canManageDistribution = true;
};

userSchema.methods.calculateProfileCompletion = function () {
  const requiredFields = [
    "profile.photo",
    "profile.bio",
    "profile.primaryGenre",
    "kyc.documents.aadhaar.verified",
    "kyc.documents.pan.verified",
    "kyc.bankDetails.accountNumber",
  ];

  let completedFields = 0;
  requiredFields.forEach((field) => {
    const value = field.split(".").reduce((obj, key) => obj?.[key], this);
    if (value) completedFields++;
  });

  this.profileCompletion.percentage = Math.round(
    (completedFields / requiredFields.length) * 100
  );
  this.profileCompletion.isComplete = this.profileCompletion.percentage === 100;
  this.profileCompletion.lastUpdated = new Date();

  this.profileCompletion.missingFields = requiredFields.filter((field) => {
    const value = field.split(".").reduce((obj, key) => obj?.[key], this);
    return !value;
  });
};

userSchema.statics.findByRole = function (role) {
  return this.find({
    role: role,
    isActive: true,
  });
};

userSchema.statics.findByUserType = function (userType) {
  return this.find({
    userType,
    isActive: true,
  });
};

userSchema.statics.findActiveSubscribers = function () {
  return this.find({
    "subscription.status": ESubscriptionStatus.ACTIVE,
    "subscription.validUntil": { $gte: new Date() },
    isActive: true,
  });
};

export default mongoose.model("User", userSchema);
