import mongoose from 'mongoose'
import { ETicketPriority, ETicketStatus, EDepartment, ETicketType } from '../constant/application.js';

const ticketResponseSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Response message must be less than 2000 characters']
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isInternal: {
        type: Boolean,
        default: false
    },
    attachments: [{
        fileName: {
            type: String,
            trim: true
        },
        fileUrl: {
            type: String,
            trim: true
        },
        fileSize: {
            type: Number
        }
    }]
}, {
    timestamps: true,
    _id: true
});

const supportTicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Subject must be less than 200 characters']
    },
    ticketType: {
        type: String,
        enum: Object.values(ETicketType),
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    priority: {
        type: String,
        enum: Object.values(ETicketPriority),
        required: true,
        default: ETicketPriority.MEDIUM
    },
    status: {
        type: String,
        enum: Object.values(ETicketStatus),
        required: true,
        default: ETicketStatus.OPEN
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assignedDepartment: {
        type: String,
        enum: Object.values(EDepartment),
        default: null
    },
    attachments: [{
        fileName: {
            type: String,
            trim: true
        },
        fileUrl: {
            type: String,
            trim: true
        },
        fileSize: {
            type: Number
        }
    }],
    responses: [ticketResponseSchema],
    lastActivityAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    closedAt: {
        type: Date,
        default: null
    },
    internalNotes: [{
        note: {
            type: String,
            trim: true,
            maxlength: [1000, 'Internal note must be less than 1000 characters']
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    escalationLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    isEscalated: {
        type: Boolean,
        default: false
    },
    escalatedAt: {
        type: Date,
        default: null
    },
    satisfaction: {
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        feedback: {
            type: String,
            trim: true,
            maxlength: [1000, 'Satisfaction feedback must be less than 1000 characters'],
            default: null
        },
        submittedAt: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            delete ret.__v
            return ret
        }
    }
})

// ticketId index is automatically created by unique: true
supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ assignedTo: 1 });
supportTicketSchema.index({ assignedDepartment: 1 })
supportTicketSchema.index({ createdAt: -1 })
supportTicketSchema.index({ lastActivityAt: -1 })

supportTicketSchema.pre('save', function (next) {
    this.lastActivityAt = new Date()

    if (this.status === ETicketStatus.RESOLVED && !this.resolvedAt) {
        this.resolvedAt = new Date()
    }

    if (this.status === ETicketStatus.CLOSED && !this.closedAt) {
        this.closedAt = new Date()
    }

    next()
})

supportTicketSchema.methods.addResponse = function (message, respondedBy, isInternal = false, attachments = []) {
    this.responses.push({
        message,
        respondedBy,
        isInternal,
        attachments
    })
    this.lastActivityAt = new Date()
    return this.save()
}

supportTicketSchema.methods.addInternalNote = function (note, addedBy) {
    this.internalNotes.push({
        note,
        addedBy
    })
    return this.save()
}

supportTicketSchema.methods.assignTo = function (userId, department = null) {
    this.assignedTo = userId
    if (department) {
        this.assignedDepartment = department
    }
    this.lastActivityAt = new Date()
    return this.save()
}

supportTicketSchema.methods.updateStatus = function (status) {
    this.status = status
    this.lastActivityAt = new Date()

    if (status === ETicketStatus.RESOLVED) {
        this.resolvedAt = new Date()
    }

    if (status === ETicketStatus.CLOSED) {
        this.closedAt = new Date()
    }

    return this.save()
}

supportTicketSchema.methods.updatePriority = function (priority) {
    this.priority = priority
    this.lastActivityAt = new Date()
    return this.save()
}

supportTicketSchema.methods.escalate = function () {
    this.escalationLevel = Math.min(this.escalationLevel + 1, 3)
    this.isEscalated = true
    this.escalatedAt = new Date()
    this.lastActivityAt = new Date()
    return this.save()
}

supportTicketSchema.methods.addSatisfactionRating = function (rating, feedback = null) {
    this.satisfaction = {
        rating,
        feedback,
        submittedAt: new Date()
    }
    return this.save()
}

supportTicketSchema.statics.getTicketStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalTickets: { $sum: 1 },
                openTickets: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.OPEN] }, 1, 0] } },
                pendingTickets: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.PENDING] }, 1, 0] } },
                resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.RESOLVED] }, 1, 0] } },
                closedTickets: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.CLOSED] }, 1, 0] } },
                criticalTickets: { $sum: { $cond: [{ $eq: ['$priority', ETicketPriority.CRITICAL] }, 1, 0] } },
                highPriorityTickets: { $sum: { $cond: [{ $eq: ['$priority', ETicketPriority.HIGH] }, 1, 0] } },
                escalatedTickets: { $sum: { $cond: ['$isEscalated', 1, 0] } }
            }
        }
    ])

    return stats[0] || {
        totalTickets: 0,
        openTickets: 0,
        pendingTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        criticalTickets: 0,
        highPriorityTickets: 0,
        escalatedTickets: 0
    }
}

supportTicketSchema.statics.getCategoryStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                openCount: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.OPEN] }, 1, 0] } },
                resolvedCount: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.RESOLVED] }, 1, 0] } }
            }
        },
        { $sort: { count: -1 } }
    ])
}

supportTicketSchema.statics.getDepartmentStats = async function () {
    return await this.aggregate([
        {
            $match: { assignedDepartment: { $ne: null } }
        },
        {
            $group: {
                _id: '$assignedDepartment',
                count: { $sum: 1 },
                openCount: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.OPEN] }, 1, 0] } },
                pendingCount: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.PENDING] }, 1, 0] } }
            }
        },
        { $sort: { count: -1 } }
    ])
}

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema)

export default SupportTicket