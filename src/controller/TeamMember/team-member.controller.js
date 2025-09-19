import User from '../../model/user.model.js';
import { EUserRole } from '../../constant/application.js';
import responseMessage from '../../constant/responseMessage.js';
import httpResponse from '../../util/httpResponse.js';
import httpError from '../../util/httpError.js';
import bcrypt from 'bcryptjs';

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Team Member'));
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async acceptInvitation(req, res, next) {
        try {
            const { invitationToken, password } = req.body;

            const teamMember = await User.findOne({
                invitationToken,
                role: EUserRole.TEAM_MEMBER,
                isInvitationAccepted: false,
                invitationExpiresAt: { $gt: new Date() }
            });

            if (!teamMember) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid or expired invitation token')),
                    req,
                    400
                );
            }

            teamMember.password = password;
            teamMember.isInvitationAccepted = true;
            teamMember.isActive = true;
            teamMember.isEmailVerified = true;
            teamMember.invitationToken = null;
            teamMember.invitationExpiresAt = null;

            await teamMember.save();

            teamMember.addNotification(
                'Welcome to the Team',
                'You have successfully joined the team. Welcome aboard!',
                'success'
            );

            await teamMember.save();

            const responseData = {
                _id: teamMember._id,
                accountId: teamMember.accountId,
                firstName: teamMember.firstName,
                lastName: teamMember.lastName,
                emailAddress: teamMember.emailAddress,
                teamRole: teamMember.teamRole,
                department: teamMember.department,
                moduleAccess: teamMember.moduleAccess,
                isActive: teamMember.isActive,
                createdAt: teamMember.createdAt
            };

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Invitation accepted successfully'),
                responseData
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getInvitationDetails(req, res, next) {
        try {
            const { invitationToken } = req.params;

            const teamMember = await User.findOne({
                invitationToken,
                role: EUserRole.TEAM_MEMBER,
                isInvitationAccepted: false,
                invitationExpiresAt: { $gt: new Date() }
            })
            .populate('invitedBy', 'firstName lastName emailAddress')
            .select('firstName lastName emailAddress teamRole department moduleAccess invitationExpiresAt invitedBy createdAt');

            if (!teamMember) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Invalid or expired invitation token')),
                    req,
                    400
                );
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Invitation details retrieved successfully'),
                teamMember
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getProfile(req, res, next) {
        try {
            const teamMember = await User.findOne({
                _id: req.authenticatedUser._id,
                role: EUserRole.TEAM_MEMBER
            })
            .populate('invitedBy', 'firstName lastName emailAddress')
            .select('-password -refreshTokens -accountConfirmation -resetPasswordToken -invitationToken -kyc -subscription -sublabels -profileCompletion -phoneNumber -address -userType -profile -artistData -labelData -aggregatorData -consent -socialMedia');

            if (!teamMember) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Team member not found')),
                    req,
                    404
                );
            }

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Profile retrieved successfully'),
                teamMember
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async updateProfile(req, res, next) {
        try {
            const { firstName, lastName } = req.body;

            const teamMember = await User.findOne({
                _id: req.authenticatedUser._id,
                role: EUserRole.TEAM_MEMBER
            });

            if (!teamMember) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Team member not found')),
                    req,
                    404
                );
            }

            teamMember.firstName = firstName;
            teamMember.lastName = lastName;

            await teamMember.save();

            const responseData = {
                _id: teamMember._id,
                accountId: teamMember.accountId,
                firstName: teamMember.firstName,
                lastName: teamMember.lastName,
                emailAddress: teamMember.emailAddress,
                teamRole: teamMember.teamRole,
                department: teamMember.department,
                moduleAccess: teamMember.moduleAccess,
                updatedAt: teamMember.updatedAt
            };

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Profile updated successfully'),
                responseData
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            const teamMember = await User.findOne({
                _id: req.authenticatedUser._id,
                role: EUserRole.TEAM_MEMBER
            });

            if (!teamMember) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Team member not found')),
                    req,
                    404
                );
            }

            const isCurrentPasswordValid = await teamMember.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Current password is incorrect')),
                    req,
                    400
                );
            }

            teamMember.password = newPassword;
            await teamMember.save();

            teamMember.addNotification(
                'Password Changed',
                'Your password has been changed successfully.',
                'success'
            );

            await teamMember.save();

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Password changed successfully')
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    }
};