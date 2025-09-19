import User from '../../model/user.model.js';
import { EUserRole, ETeamRole, EDepartment, EModuleAccess, ETeamMemberStatus } from '../../constant/application.js';
import responseMessage from '../../constant/responseMessage.js';
import httpResponse from '../../util/httpResponse.js';
import httpError from '../../util/httpError.js';
import quicker from '../../util/quicker.js';

export default {
    async self(req, res, next) {
        try {
            httpResponse(req, res, 200, responseMessage.SERVICE('Team Member Management'));
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },

    async inviteTeamMember(req, res, next) {
        try {
            const { firstName, lastName, emailAddress, teamRole, department, moduleAccess } = req.body;

            const existingUser = await User.findOne({ emailAddress });
            if (existingUser) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('User with this email already exists')),
                    req,
                    409
                );
            }

            const invitationToken = quicker.generateVerificationToken();
            const accountId = await quicker.generateAccountId('team_member', User);

            const teamMember = new User({
                firstName,
                lastName,
                accountId,
                emailAddress,
                role: EUserRole.TEAM_MEMBER,
                teamRole,
                department,
                moduleAccess,
                invitedBy: req.authenticatedUser._id,
                isInvitationAccepted: false,
                invitationToken,
                invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isActive: false,
                isEmailVerified: false
            });

            await teamMember.save();

            teamMember.addNotification(
                'Team Invitation',
                'You have been invited to join the team. Please accept the invitation to get started.',
                'info'
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
                invitationToken,
                invitationExpiresAt: teamMember.invitationExpiresAt,
                createdAt: teamMember.createdAt
            };

            return httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('Team member invited successfully'),
                responseData
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getAllTeamMembers(req, res, next) {
        try {
            const { page = 1, limit = 10, search, teamRole, department, status } = req.query;

            let query = { role: EUserRole.TEAM_MEMBER };

            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { emailAddress: { $regex: search, $options: 'i' } }
                ];
            }

            if (teamRole) {
                query.teamRole = teamRole;
            }

            if (department) {
                query.department = department;
            }

            if (status === 'active') {
                query.isActive = true;
                query.isInvitationAccepted = true;
            } else if (status === 'inactive') {
                query.isActive = false;
            } else if (status === 'pending') {
                query.isInvitationAccepted = false;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const totalTeamMembers = await User.countDocuments(query);
            const totalPages = Math.ceil(totalTeamMembers / parseInt(limit));

            const teamMembers = await User.find(query)
                .populate('invitedBy', 'firstName lastName emailAddress')
                .select('-password -refreshTokens -accountConfirmation -resetPasswordToken -notifications -kyc -subscription -sublabels -profileCompletion -phoneNumber -address -userType -profile -artistData -labelData -aggregatorData -consent -socialMedia')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const pagination = {
                currentPage: parseInt(page),
                totalPages,
                totalItems: totalTeamMembers,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            };

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Team members retrieved successfully'),
                { teamMembers, pagination }
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getTeamMemberById(req, res, next) {
        try {
            const { teamMemberId } = req.params;

            const teamMember = await User.findOne({
                _id: teamMemberId,
                role: EUserRole.TEAM_MEMBER
            })
            .populate('invitedBy', 'firstName lastName emailAddress')
            .select('-password -refreshTokens -accountConfirmation -resetPasswordToken -notifications -kyc -subscription -sublabels -profileCompletion -phoneNumber -address -userType -profile -artistData -labelData -aggregatorData -consent -socialMedia');

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
                responseMessage.customMessage('Team member retrieved successfully'),
                teamMember
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async updateTeamMember(req, res, next) {
        try {
            const { teamMemberId } = req.params;
            const { firstName, lastName, teamRole, department, moduleAccess } = req.body;

            const teamMember = await User.findOne({
                _id: teamMemberId,
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
            teamMember.teamRole = teamRole;
            teamMember.department = department;
            teamMember.moduleAccess = moduleAccess;

            await teamMember.save();

            teamMember.addNotification(
                'Profile Updated',
                'Your team profile has been updated by an administrator.',
                'info'
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
                isInvitationAccepted: teamMember.isInvitationAccepted,
                updatedAt: teamMember.updatedAt
            };

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Team member updated successfully'),
                responseData
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async updateTeamMemberStatus(req, res, next) {
        try {
            const { teamMemberId } = req.params;
            const { isActive } = req.body;

            const teamMember = await User.findOne({
                _id: teamMemberId,
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

            teamMember.isActive = isActive;
            await teamMember.save();

            teamMember.addNotification(
                'Account Status Updated',
                `Your account has been ${isActive ? 'activated' : 'deactivated'} by an administrator.`,
                isActive ? 'success' : 'warning'
            );

            await teamMember.save();

            const responseData = {
                _id: teamMember._id,
                firstName: teamMember.firstName,
                lastName: teamMember.lastName,
                emailAddress: teamMember.emailAddress,
                isActive: teamMember.isActive,
                updatedAt: teamMember.updatedAt
            };

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Team member status updated successfully'),
                responseData
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async deleteTeamMember(req, res, next) {
        try {
            const { teamMemberId } = req.params;

            const teamMember = await User.findOne({
                _id: teamMemberId,
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

            await User.findByIdAndDelete(teamMemberId);

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Team member deleted successfully')
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async resendInvitation(req, res, next) {
        try {
            const { teamMemberId } = req.params;

            const teamMember = await User.findOne({
                _id: teamMemberId,
                role: EUserRole.TEAM_MEMBER,
                isInvitationAccepted: false
            });

            if (!teamMember) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('Team member not found or invitation already accepted')),
                    req,
                    404
                );
            }

            const newInvitationToken = quicker.generateVerificationToken();
            teamMember.invitationToken = newInvitationToken;
            teamMember.invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await teamMember.save();

            teamMember.addNotification(
                'Invitation Resent',
                'Your team invitation has been resent. Please check your email.',
                'info'
            );

            await teamMember.save();

            const responseData = {
                _id: teamMember._id,
                firstName: teamMember.firstName,
                lastName: teamMember.lastName,
                emailAddress: teamMember.emailAddress,
                invitationToken: newInvitationToken,
                invitationExpiresAt: teamMember.invitationExpiresAt
            };

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Invitation resent successfully'),
                responseData
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    },

    async getTeamStatistics(req, res, next) {
        try {
            const totalTeamMembers = await User.countDocuments({ role: EUserRole.TEAM_MEMBER });
            const activeTeamMembers = await User.countDocuments({
                role: EUserRole.TEAM_MEMBER,
                isActive: true,
                isInvitationAccepted: true
            });
            const pendingInvitations = await User.countDocuments({
                role: EUserRole.TEAM_MEMBER,
                isInvitationAccepted: false
            });

            const departmentStats = await User.aggregate([
                { $match: { role: EUserRole.TEAM_MEMBER } },
                { $group: { _id: '$department', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            const roleStats = await User.aggregate([
                { $match: { role: EUserRole.TEAM_MEMBER } },
                { $group: { _id: '$teamRole', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            const statistics = {
                totalTeamMembers,
                activeTeamMembers,
                pendingInvitations,
                inactiveTeamMembers: totalTeamMembers - activeTeamMembers - pendingInvitations,
                departmentDistribution: departmentStats,
                roleDistribution: roleStats
            };

            return httpResponse(
                req,
                res,
                200,
                responseMessage.customMessage('Team statistics retrieved successfully'),
                statistics
            );
        } catch (err) {
            return httpError(next, err, req, 500);
        }
    }
};