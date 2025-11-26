import SupportTicket from '../../model/support-ticket.model.js'
import User from '../../model/user.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import { ETicketStatus, EUserRole } from '../../constant/application.js'

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Admin Support Ticket'));
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async getAllTickets(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                category,
                priority,
                assignedDepartment,
                search,
                sortBy = 'lastActivityAt',
                sortOrder = 'desc',
                dateFrom,
                dateTo
            } = req.query;

            const skip = (page - 1) * limit;
            const filter = {};

            if (status) filter.status = status;
            if (category) filter.category = category;
            if (priority) filter.priority = priority;
            if (assignedDepartment) filter.assignedDepartment = assignedDepartment;

            if (search) {
                filter.$or = [
                    { subject: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { ticketId: { $regex: search, $options: 'i' } },
                    { contactEmail: { $regex: search, $options: 'i' } }
                ];
            }

            if (dateFrom || dateTo) {
                filter.createdAt = {};
                if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) filter.createdAt.$lte = new Date(dateTo);
            }

            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const tickets = await SupportTicket.find(filter)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department')
                .populate('responses.respondedBy', 'firstName lastName emailAddress role teamRole')
                .populate('internalNotes.addedBy', 'firstName lastName emailAddress role teamRole')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit));

            const totalTickets = await SupportTicket.countDocuments(filter);
            const totalPages = Math.ceil(totalTickets / limit);

            const pagination = {
                currentPage: parseInt(page),
                totalPages,
                totalCount: totalTickets,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                tickets,
                pagination
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async getTicketById(req, res, next) {
        try {
            const { ticketId } = req.params;

            const ticket = await SupportTicket.findOne({ ticketId })
                .populate('userId', 'firstName lastName emailAddress accountId userType')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department')
                .populate('responses.respondedBy', 'firstName lastName emailAddress role teamRole')
                .populate('internalNotes.addedBy', 'firstName lastName emailAddress role teamRole');

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, ticket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async updateTicket(req, res, next) {
        try {
            const { ticketId } = req.params;
            const updates = req.body;

            const ticket = await SupportTicket.findOne({ ticketId });

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    ticket[key] = updates[key];
                }
            });

            ticket.lastActivityAt = new Date();
            await ticket.save();

            const updatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department');

            if (ticket.userId) {
                const user = await User.findById(ticket.userId);
                if (user) {
                    user.addNotification(
                        'Ticket Updated',
                        `Your support ticket ${ticketId} has been updated.`,
                        'info'
                    );
                    await user.save();
                }
            }

            httpResponse(req, res, 200, responseMessage.UPDATED, updatedTicket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async assignTicket(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { assignedTo, assignedDepartment } = req.body;

            const ticket = await SupportTicket.findOne({ ticketId });

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            if (assignedTo) {
                const assignee = await User.findById(assignedTo);
                if (!assignee || (assignee.role !== EUserRole.ADMIN && assignee.role !== EUserRole.TEAM_MEMBER)) {
                    return httpError(
                        next,
                        new Error(responseMessage.customMessage('Invalid assignee')),
                        req,
                        400
                    );
                }
            }

            await ticket.assignTo(assignedTo, assignedDepartment);

            const updatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department');

            if (assignedTo) {
                const assignee = await User.findById(assignedTo);
                if (assignee) {
                    assignee.addNotification(
                        'Ticket Assigned',
                        `You have been assigned to support ticket ${ticketId}.`,
                        'info'
                    );
                    await assignee.save();
                }
            }

            if (ticket.userId) {
                const user = await User.findById(ticket.userId);
                if (user) {
                    user.addNotification(
                        'Ticket Assignment Updated',
                        `Your support ticket ${ticketId} has been assigned to our team.`,
                        'info'
                    );
                    await user.save();
                }
            }

            httpResponse(req, res, 200, responseMessage.UPDATED, updatedTicket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async updateTicketStatus(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { status } = req.body;

            const ticket = await SupportTicket.findOne({ ticketId });

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            await ticket.updateStatus(status);

            const updatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department');

            if (ticket.userId) {
                const user = await User.findById(ticket.userId);
                if (user) {
                    let notificationMessage = `Your support ticket ${ticketId} status has been updated to ${status}.`;

                    if (status === ETicketStatus.RESOLVED) {
                        notificationMessage = `Your support ticket ${ticketId} has been resolved. Please review the solution and provide feedback.`;
                    } else if (status === ETicketStatus.CLOSED) {
                        notificationMessage = `Your support ticket ${ticketId} has been closed.`;
                    }

                    user.addNotification(
                        'Ticket Status Updated',
                        notificationMessage,
                        'info'
                    );
                    await user.save();
                }
            }

            httpResponse(req, res, 200, responseMessage.UPDATED, updatedTicket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async updateTicketPriority(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { priority } = req.body;

            const ticket = await SupportTicket.findOne({ ticketId });

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            await ticket.updatePriority(priority);

            const updatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department');

            httpResponse(req, res, 200, responseMessage.UPDATED, updatedTicket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async addResponse(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { message, isInternal, attachments } = req.body;

            const ticket = await SupportTicket.findOne({ ticketId });

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            if (ticket.status === ETicketStatus.CLOSED) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Cannot add response to closed ticket')),
                    req,
                    400
                );
            }

            await ticket.addResponse(message, req.authenticatedUser._id, isInternal || false, attachments || []);

            if (!isInternal && ticket.status === ETicketStatus.OPEN) {
                ticket.status = ETicketStatus.PENDING;
                await ticket.save();
            }

            const updatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department')
                .populate('responses.respondedBy', 'firstName lastName emailAddress role teamRole');

            if (!isInternal && ticket.userId) {
                const user = await User.findById(ticket.userId);
                if (user) {
                    user.addNotification(
                        'Ticket Response Added',
                        `A new response has been added to your support ticket ${ticketId}.`,
                        'info'
                    );
                    await user.save();
                }
            }

            httpResponse(req, res, 200, responseMessage.UPDATED, updatedTicket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async addInternalNote(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { note } = req.body;

            const ticket = await SupportTicket.findOne({ ticketId });

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            await ticket.addInternalNote(note, req.authenticatedUser._id);

            const updatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department')
                .populate('internalNotes.addedBy', 'firstName lastName emailAddress role teamRole');

            httpResponse(req, res, 200, responseMessage.UPDATED, updatedTicket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async escalateTicket(req, res, next) {
        try {
            const { ticketId } = req.params;

            const ticket = await SupportTicket.findOne({ ticketId });

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            if (ticket.escalationLevel >= 3) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket is already at maximum escalation level')),
                    req,
                    400
                );
            }

            await ticket.escalate();

            const updatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress teamRole department');

            httpResponse(req, res, 200, responseMessage.UPDATED, updatedTicket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async getTicketStats(req, res, next) {
        try {
            const { dateFrom, dateTo, department } = req.query;

            const matchFilter = {};

            if (dateFrom || dateTo) {
                matchFilter.createdAt = {};
                if (dateFrom) matchFilter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) matchFilter.createdAt.$lte = new Date(dateTo);
            }

            if (department) {
                matchFilter.assignedDepartment = department;
            }

            const stats = await SupportTicket.getTicketStats();
            const categoryStats = await SupportTicket.getCategoryStats();
            const departmentStats = await SupportTicket.getDepartmentStats();

            const priorityStats = await SupportTicket.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: '$priority',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const resolutionStats = await SupportTicket.aggregate([
                {
                    $match: {
                        ...matchFilter,
                        resolvedAt: { $ne: null }
                    }
                },
                {
                    $project: {
                        resolutionTime: {
                            $divide: [
                                { $subtract: ['$resolvedAt', '$createdAt'] },
                                1000 * 60 * 60
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageResolutionTime: { $avg: '$resolutionTime' },
                        totalResolved: { $sum: 1 }
                    }
                }
            ]);

            const teamPerformance = await SupportTicket.aggregate([
                {
                    $match: {
                        ...matchFilter,
                        assignedTo: { $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'assignedTo',
                        foreignField: '_id',
                        as: 'assignee'
                    }
                },
                { $unwind: '$assignee' },
                {
                    $group: {
                        _id: '$assignedTo',
                        assigneeName: { $first: { $concat: ['$assignee.firstName', ' ', '$assignee.lastName'] } },
                        teamRole: { $first: '$assignee.teamRole' },
                        department: { $first: '$assignee.department' },
                        totalAssigned: { $sum: 1 },
                        resolved: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.RESOLVED] }, 1, 0] } },
                        closed: { $sum: { $cond: [{ $eq: ['$status', ETicketStatus.CLOSED] }, 1, 0] } }
                    }
                },
                { $sort: { totalAssigned: -1 } }
            ]);

            const result = {
                overallStats: stats,
                categoryStats,
                departmentStats,
                priorityStats,
                resolutionStats: resolutionStats[0] || { averageResolutionTime: 0, totalResolved: 0 },
                teamPerformance
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, result);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async bulkUpdateTickets(req, res, next) {
        try {
            const { ticketIds, updates } = req.body;

            const tickets = await SupportTicket.find({ ticketId: { $in: ticketIds } });

            if (tickets.length === 0) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('No tickets found')),
                    req,
                    404
                );
            }

            const updatePromises = tickets.map(async (ticket) => {
                Object.keys(updates).forEach(key => {
                    if (updates[key] !== undefined) {
                        ticket[key] = updates[key];
                    }
                });
                ticket.lastActivityAt = new Date();
                return ticket.save();
            });

            await Promise.all(updatePromises);

            httpResponse(req, res, 200, responseMessage.UPDATED, {
                updatedCount: tickets.length,
                ticketIds: tickets.map(t => t.ticketId)
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async getMyAssignedTickets(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                category,
                priority,
                search,
                sortBy = 'lastActivityAt',
                sortOrder = 'desc'
            } = req.query;

            const userId = req.authenticatedUser._id;
            const skip = (page - 1) * limit;

            const filter = { assignedTo: userId };

            if (status) filter.status = status;
            if (category) filter.category = category;
            if (priority) filter.priority = priority;

            if (search) {
                filter.$or = [
                    { subject: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { ticketId: { $regex: search, $options: 'i' } }
                ];
            }

            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const tickets = await SupportTicket.find(filter)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit));

            const totalTickets = await SupportTicket.countDocuments(filter);
            const totalPages = Math.ceil(totalTickets / limit);

            const pagination = {
                currentPage: parseInt(page),
                totalPages,
                totalCount: totalTickets,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                tickets,
                pagination
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    }
}