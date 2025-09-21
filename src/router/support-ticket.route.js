import { Router } from 'express';
import supportTicketController from '../controller/SupportTicket/support-ticket.controller.js';
import validateRequest from '../middleware/validateRequest.js';
import authentication from '../middleware/authentication.js';
import authorization from '../middleware/authorization.js';
import {
    createTicketSchema,
    getTicketsSchema,
    getTicketByIdSchema,
    addResponseSchema,
    addSatisfactionRatingSchema
} from '../schema/support-ticket.schema.js';
import { EUserRole } from '../constant/application.js';

const router = Router();

router.route('/self')
    .get(supportTicketController.self);

router.route('/')
    .post(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        validateRequest(createTicketSchema),
        supportTicketController.createTicket
    );

router.route('/my-tickets')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        validateRequest(getTicketsSchema),
        supportTicketController.getMyTickets
    );

router.route('/my-stats')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        supportTicketController.getMyTicketStats
    );


router.route('/:ticketId')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        validateRequest(getTicketByIdSchema),
        supportTicketController.getTicketById
    );

router.route('/:ticketId/response')
    .post(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        validateRequest(addResponseSchema),
        supportTicketController.addResponse
    );

router.route('/:ticketId/rating')
    .post(
        authentication,
        authorization([EUserRole.USER, EUserRole.TEAM_MEMBER]),
        validateRequest(addSatisfactionRatingSchema),
        supportTicketController.addSatisfactionRating
    );

export default router;