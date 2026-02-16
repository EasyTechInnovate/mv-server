import mongoose from 'mongoose';
import {
  EReleaseType,
  ETrackType,
  EReleaseStatus,
  EMusicGenre,
  EAudioFormat,
  ETerritories,
  EDistributionPartners,
  EReleaseStep,
  EMusicLanguage
} from '../constant/application.js';

const trackSchema = new mongoose.Schema({
  trackName: {
    type: String,
    required: [true, 'Track name is required'],
    trim: true,
    maxlength: [200, 'Track name cannot exceed 200 characters']
  },
  genre: {
    type: String,
    enum: Object.values(EMusicGenre),
    required: [true, 'Genre is required']
  },
  composerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Composer name cannot exceed 100 characters']
  },
  lyricistName: {
    type: String,
    trim: true,
    maxlength: [100, 'Lyricist name cannot exceed 100 characters']
  },
  singerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Singer name cannot exceed 100 characters']
  },
  producerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Producer name cannot exceed 100 characters']
  },
  isrc: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    match: [/^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/, 'Invalid ISRC format']
  },
  audioFiles: [{
    format: {
      type: String,
      enum: Object.values(EAudioFormat),
      required: [true, 'Audio format is required']
    },
    fileUrl: {
      type: String,
      required: [true, 'Audio file URL is required'],
      trim: true
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative']
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    }
  }],
  previewTiming: {
    startTime: {
      type: Number,
      min: [0, 'Start time cannot be negative'],
      default: 0
    },
    endTime: {
      type: Number,
      min: [0, 'End time cannot be negative'],
      default: 30
    }
  },
  callerTuneTiming: {
    startTime: {
      type: Number,
      min: [0, 'Start time cannot be negative'],
      default: 0
    },
    endTime: {
      type: Number,
      min: [0, 'End time cannot be negative'],
      default: 30
    }
  },
  language: {
    type: String,
    enum: Object.values(EMusicLanguage),
    required: false
  }
}, {
  timestamps: true
});

const releaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  releaseId: {
    type: String,
    unique: true,
    required: [true, 'Release ID is required'],
    trim: true,
    index: true
  },
  releaseType: {
    type: String,
    enum: Object.values(EReleaseType),
    default: EReleaseType.BASIC
  },
  trackType: {
    type: String,
    enum: Object.values(ETrackType),
    required: [true, 'Track type is required']
  },
  step1: {
    coverArt: {
      imageUrl: {
        type: String,
        trim: true
      },
      imageSize: {
        type: Number,
        min: [0, 'Image size cannot be negative']
      },
      imageFormat: {
        type: String,
        enum: ['jpg', 'jpeg', 'png', 'webp']
      },
      singerName: [{
        type: String,
        trim: true
      }]
    },
    releaseInfo: {
      releaseName: {
        type: String,
        trim: true,
        maxlength: [200, 'Release name cannot exceed 200 characters']
      },
      genre: {
        type: String,
        enum: Object.values(EMusicGenre)
      },
      labelName: {
        type: String,
        trim: true,
        maxlength: [100, 'Label name cannot exceed 100 characters']
      },
      upc: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        match: [/^[0-9]{12}$/, 'UPC must be exactly 12 digits']
      }
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  step2: {
    tracks: [trackSchema],
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  step3: {
    releaseDate: {
      type: Date,
      validate: {
        validator: function(value) {
          return !value || value >= new Date();
        },
        message: 'Release date must be in the future'
      }
    },
    territorialRights: {
      hasRights: {
        type: Boolean,
        default: false
      },
      territories: [{
        type: String,
        enum: Object.values(ETerritories)
      }]
    },
    partnerSelection: {
      hasPartners: {
        type: Boolean,
        default: false
      },
      partners: [{
        type: String,
        enum: Object.values(EDistributionPartners)
      }]
    },
    copyrights: {
      ownsCopyright: {
        type: Boolean,
        default: false
      },
      copyrightDocuments: [{
        documentUrl: {
          type: String,
          trim: true
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }]
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  releaseStatus: {
    type: String,
    enum: Object.values(EReleaseStatus),
    default: EReleaseStatus.DRAFT,
    index: true
  },
  currentStep: {
    type: String,
    enum: Object.values(EReleaseStep),
    default: EReleaseStep.COVER_ART_AND_INFO
  },
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
  },
  submittedAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  liveAt: {
    type: Date,
    default: null
  },
  updateRequest: {
    requestedAt: {
      type: Date,
      default: null
    },
    requestReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Update request reason cannot exceed 500 characters']
    },
    requestedChanges: {
      type: String,
      trim: true,
      maxlength: [1000, 'Requested changes cannot exceed 1000 characters']
    }
  },
  takeDown: {
    requestedAt: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Take down reason cannot exceed 500 characters']
    },
    processedAt: {
      type: Date,
      default: null
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  totalSteps: {
    type: Number,
    default: 3,
    min: 3,
    max: 3
  },
  completedSteps: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  audioFootprinting: [{
    trackId: { type: mongoose.Schema.Types.ObjectId, default: null },
    trackName: { type: String, trim: true, default: null },
    matchPercentage: { type: Number, min: 0, max: 100, default: null },
    title: { type: String, trim: true, default: null },
    label: { type: String, trim: true, default: null },
    artists: { type: [String], default: [] },
    album: { type: String, trim: true, default: null },
    releaseDate: { type: String, default: null },
    durationMs: { type: Number, default: null },
    matchTime: {
      startMs: { type: Number, default: null },
      dbStartMs: { type: Number, default: null },
      dbEndMs: { type: Number, default: null }
    },
    externalIds: {
      isrc: { type: String, trim: true, uppercase: true, default: null },
      upc: { type: String, trim: true, default: null }
    },
    streamingLinks: {
      spotify: { type: String, trim: true, default: null },
      deezer: { type: String, trim: true, default: null }
    },
    genres: { type: [String], default: [] },
    checkedAt: { type: Date, default: Date.now },
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

releaseSchema.index({ userId: 1, releaseStatus: 1 });
releaseSchema.index({ userId: 1, trackType: 1 });
releaseSchema.index({ releaseStatus: 1, createdAt: -1 });
releaseSchema.index({ userId: 1, createdAt: -1 });
releaseSchema.index({ 'step1.releaseInfo.releaseName': 'text' });
releaseSchema.index({ submittedAt: -1 });
releaseSchema.index({ publishedAt: -1 });
releaseSchema.index({ liveAt: -1 });

releaseSchema.virtual('completionPercentage').get(function() {
  return Math.round((this.completedSteps / this.totalSteps) * 100);
});

releaseSchema.virtual('isReadyForSubmission').get(function() {
  return this.step1.isCompleted && this.step2.isCompleted && this.step3.isCompleted;
});

releaseSchema.virtual('releaseTitle').get(function() {
  return this.step1.releaseInfo.releaseName || 'Untitled Release';
});

releaseSchema.methods.completeStep = function(stepNumber) {
  const stepKey = `step${stepNumber}`;
  if (this[stepKey]) {
    this[stepKey].isCompleted = true;
    this[stepKey].completedAt = new Date();
    this.completedSteps = Math.max(this.completedSteps, stepNumber);
    
    if (stepNumber < this.totalSteps) {
      const nextStep = stepNumber + 1;
      const nextStepKey = `step${nextStep}`;
      if (!this[nextStepKey].isCompleted) {
        const stepValues = Object.values(EReleaseStep);
        this.currentStep = stepValues[stepNumber];
      }
    }
  }
};

releaseSchema.methods.submitForReview = function() {
  if (!this.isReadyForSubmission) {
    throw new Error('All steps must be completed before submission');
  }
  
  this.releaseStatus = EReleaseStatus.SUBMITTED;
  this.submittedAt = new Date();
};

releaseSchema.methods.approveForProcessing = function(adminId, notes = '') {
  this.releaseStatus = EReleaseStatus.UNDER_REVIEW;
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
  this.adminReview.adminNotes = notes;
};

releaseSchema.methods.startProcessing = function(adminId) {
  this.releaseStatus = EReleaseStatus.PROCESSING;
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
};

releaseSchema.methods.publishRelease = function(adminId) {
  this.releaseStatus = EReleaseStatus.PUBLISHED;
  this.publishedAt = new Date();
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
};

releaseSchema.methods.goLive = function(adminId) {
  this.releaseStatus = EReleaseStatus.LIVE;
  this.liveAt = new Date();
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
};

releaseSchema.methods.rejectRelease = function(adminId, reason) {
  this.releaseStatus = EReleaseStatus.REJECTED;
  this.adminReview.reviewedBy = adminId;
  this.adminReview.reviewedAt = new Date();
  this.adminReview.rejectionReason = reason;
};

releaseSchema.methods.requestTakeDown = function(reason) {
  this.releaseStatus = EReleaseStatus.TAKE_DOWN;
  this.takeDown.requestedAt = new Date();
  this.takeDown.reason = reason;
};

releaseSchema.methods.requestUpdate = function(reason, changes) {
  this.releaseStatus = EReleaseStatus.UPDATE_REQUEST;
  this.updateRequest.requestedAt = new Date();
  this.updateRequest.requestReason = reason;
  this.updateRequest.requestedChanges = changes;
};

releaseSchema.statics.findByStatus = function(status) {
  return this.find({ releaseStatus: status, isActive: true });
};

releaseSchema.statics.findByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

releaseSchema.statics.findPendingReviews = function() {
  return this.find({ 
    releaseStatus: { $in: [EReleaseStatus.SUBMITTED, EReleaseStatus.UPDATE_REQUEST] },
    isActive: true 
  }).sort({ submittedAt: 1 });
};

export default mongoose.model('BasicRelease', releaseSchema);