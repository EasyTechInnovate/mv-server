import { Router } from 'express';
import teamMemberController from '../controller/TeamMember/team-member.controller.js';
import validateRequest from '../middleware/validateRequest.js';
import authentication from '../middleware/authentication.js';
import authorization from '../middleware/authorization.js';
import teamMemberSchemas from '../schema/team-member.schema.js';
import { EUserRole } from '../constant/application.js';

const router = Router();

router.route('/self')
    .get(teamMemberController.self);

router.route('/accept-invitation')
    .post(
        validateRequest(teamMemberSchemas.acceptInvitationSchema),
        teamMemberController.acceptInvitation
    );

router.route('/invitation/:invitationToken')
    .get(
        validateRequest(teamMemberSchemas.getInvitationDetailsSchema),
        teamMemberController.getInvitationDetails
    );

router.route('/profile')
    .get(
        authentication,
        authorization([EUserRole.TEAM_MEMBER]),
        teamMemberController.getProfile
    )
    .put(
        authentication,
        authorization([EUserRole.TEAM_MEMBER]),
        validateRequest(teamMemberSchemas.updateProfileSchema),
        teamMemberController.updateProfile
    );

router.route('/change-password')
    .patch(
        authentication,
        authorization([EUserRole.TEAM_MEMBER]),
        validateRequest(teamMemberSchemas.changePasswordSchema),
        teamMemberController.changePassword
    );

export default router;