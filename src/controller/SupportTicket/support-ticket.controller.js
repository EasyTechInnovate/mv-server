import SupportTicket from '../../model/support-ticket.model.js'
import User from '../../model/user.model.js'
import quicker from '../../util/quicker.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'
import { ETicketStatus } from '../../constant/application.js'

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Support Ticket'));
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async createTicket(req, res, next) {
        try {
            const {
                subject,
                priority,
                ticketType,
                details,
            } = req.body;

            const ticketId = await quicker.generateTicketId(SupportTicket);

            const ticketData = {
                ticketId,
                subject,
                priority,
                ticketType,
                details,
                userId: req.authenticatedUser._id,
            };

            const ticket = new SupportTicket(ticketData);
            await ticket.save();

            req.authenticatedUser.addNotification(
                'Support Ticket Created',
                `Your support ticket ${ticketId} has been created and will be reviewed by our team.`,
                'info'
            );
            await req.authenticatedUser.save();

            const populatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress');

            httpResponse(req, res, 201, responseMessage.CREATED, populatedTicket);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async getMyTickets(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                priority,
                search,
                sortBy = 'lastActivityAt',
                sortOrder = 'desc',
                dateFrom,
                dateTo
            } = req.query;

            const userId = req.authenticatedUser._id;
            const skip = (page - 1) * limit;

            const filter = { userId };

            if (status) filter.status = status;
            if (priority) filter.priority = priority;

            if (search) {
                filter.$or = [
                    { subject: { $regex: search, $options: 'i' } },
                    { ticketId: { $regex: search, $options: 'i' } }
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
                .populate('assignedTo', 'firstName lastName emailAddress')
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

            const filter = { ticketId };

            if (req.authenticatedUser) {
                filter.userId = req.authenticatedUser._id;
            }

            const ticket = await SupportTicket.findOne(filter)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress')
                .populate('responses.respondedBy', 'firstName lastName emailAddress');

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            const publicResponses = ticket.responses.filter(response => !response.isInternal);
            const ticketData = ticket.toJSON();
            ticketData.responses = publicResponses;

            httpResponse(req, res, 200, responseMessage.SUCCESS, ticketData);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async addResponse(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { message, attachments } = req.body;

            if (!req.authenticatedUser) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Authentication required')),
                    req,
                    401
                );
            }

            // Find ticket either by userId or by contactEmail for guest tickets
            const ticket = await SupportTicket.findOne({
                ticketId,
                userId: req.authenticatedUser._id
            });

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

            await ticket.addResponse(message, req.authenticatedUser._id, false, attachments || []);

            if (ticket.status === ETicketStatus.RESOLVED) {
                ticket.status = ETicketStatus.OPEN;
                await ticket.save();
            }

            const updatedTicket = await SupportTicket.findById(ticket._id)
                .populate('userId', 'firstName lastName emailAddress accountId')
                .populate('assignedTo', 'firstName lastName emailAddress')
                .populate('responses.respondedBy', 'firstName lastName emailAddress');

            const publicResponses = updatedTicket.responses.filter(response => !response.isInternal);
            const ticketData = updatedTicket.toJSON();
            ticketData.responses = publicResponses;

            httpResponse(req, res, 200, responseMessage.UPDATED, ticketData);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async addSatisfactionRating(req, res, next) {
        try {
            const { ticketId } = req.params;
            const { rating, feedback } = req.body;

            if (!req.authenticatedUser) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Authentication required')),
                    req,
                    401
                );
            }

            const ticket = await SupportTicket.findOne({
                ticketId,
                userId: req.authenticatedUser._id
            });

            if (!ticket) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Ticket not found')),
                    req,
                    404
                );
            }

            if (ticket.status !== ETicketStatus.RESOLVED && ticket.status !== ETicketStatus.CLOSED) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Can only rate resolved or closed tickets')),
                    req,
                    400
                );
            }

            if (ticket.satisfaction.rating) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Satisfaction rating already provided')),
                    req,
                    400
                );
            }

            await ticket.addSatisfactionRating(rating, feedback);

            httpResponse(req, res, 200, responseMessage.UPDATED, {
                ticketId: ticket.ticketId,
                rating,
                feedback
            });
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },


    async getMyTicketStats(req, res, next) {
        try {
            if (!req.authenticatedUser) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Authentication required')),
                    req,
                    401
                );
            }

            const userId = req.authenticatedUser._id;

            const stats = await SupportTicket.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        totalTickets: { $sum: 1 },
                        openTickets: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
                        pendingTickets: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                        closedTickets: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
                    }
                }
            ]);

            const categoryStats = await SupportTicket.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            const result = {
                overallStats: stats[0] || {
                    totalTickets: 0,
                    openTickets: 0,
                    pendingTickets: 0,
                    resolvedTickets: 0,
                    closedTickets: 0
                },
                categoryStats
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, result);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    }
}