import { z } from 'zod';
import { ETeamRole, EDepartment, EModuleAccess } from '../constant/application.js';

const teamMemberSchemas = {
    inviteTeamMemberSchema: z.object({
        body: z.object({
            firstName: z.string()
                .min(2, 'First name must be at least 2 characters')
                .max(50, 'First name cannot exceed 50 characters')
                .trim(),
            lastName: z.string()
                .min(2, 'Last name must be at least 2 characters')
                .max(50, 'Last name cannot exceed 50 characters')
                .trim(),
            emailAddress: z.string()
                .email('Please provide a valid email address')
                .toLowerCase()
                .trim(),
            teamRole: z.enum(Object.values(ETeamRole), {
                errorMap: () => ({ message: 'Invalid team role' })
            }),
            department: z.enum(Object.values(EDepartment), {
                errorMap: () => ({ message: 'Invalid department' })
            }),
            moduleAccess: z.array(z.enum(Object.values(EModuleAccess), {
                errorMap: () => ({ message: 'Invalid module access' })
            }))
                .min(1, 'At least one module access is required')
                .max(Object.values(EModuleAccess).length, 'Too many module access entries')
        })
    }),

    updateTeamMemberSchema: z.object({
        params: z.object({
            teamMemberId: z.string()
                .regex(/^[0-9a-fA-F]{24}$/, 'Invalid team member ID format')
        }),
        body: z.object({
            firstName: z.string()
                .min(2, 'First name must be at least 2 characters')
                .max(50, 'First name cannot exceed 50 characters')
                .trim(),
            lastName: z.string()
                .min(2, 'Last name must be at least 2 characters')
                .max(50, 'Last name cannot exceed 50 characters')
                .trim(),
            teamRole: z.enum(Object.values(ETeamRole), {
                errorMap: () => ({ message: 'Invalid team role' })
            }),
            department: z.enum(Object.values(EDepartment), {
                errorMap: () => ({ message: 'Invalid department' })
            }),
            moduleAccess: z.array(z.enum(Object.values(EModuleAccess), {
                errorMap: () => ({ message: 'Invalid module access' })
            }))
                .min(1, 'At least one module access is required')
                .max(Object.values(EModuleAccess).length, 'Too many module access entries')
        })
    }),

    updateTeamMemberStatusSchema: z.object({
        params: z.object({
            teamMemberId: z.string()
                .regex(/^[0-9a-fA-F]{24}$/, 'Invalid team member ID format')
        }),
        body: z.object({
            isActive: z.boolean()
        })
    }),

    getTeamMemberByIdSchema: z.object({
        params: z.object({
            teamMemberId: z.string()
                .regex(/^[0-9a-fA-F]{24}$/, 'Invalid team member ID format')
        })
    }),

    getAllTeamMembersSchema: z.object({
        query: z.object({
            page: z.string()
                .regex(/^\d+$/, 'Page must be a positive number')
                .transform(Number)
                .refine(val => val > 0, 'Page must be greater than 0')
                .optional(),
            limit: z.string()
                .regex(/^\d+$/, 'Limit must be a positive number')
                .transform(Number)
                .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
                .optional(),
            search: z.string()
                .trim()
                .optional(),
            teamRole: z.enum(Object.values(ETeamRole))
                .optional(),
            department: z.enum(Object.values(EDepartment))
                .optional(),
            status: z.enum(['active', 'inactive', 'pending'])
                .optional()
        })
    }),

    resendInvitationSchema: z.object({
        params: z.object({
            teamMemberId: z.string()
                .regex(/^[0-9a-fA-F]{24}$/, 'Invalid team member ID format')
        })
    }),

    acceptInvitationSchema: z.object({
        body: z.object({
            invitationToken: z.string()
                .min(1, 'Invitation token is required'),
            password: z.string()
                .min(8, 'Password must be at least 8 characters')
                .max(128, 'Password cannot exceed 128 characters')
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
        })
    }),

    getInvitationDetailsSchema: z.object({
        params: z.object({
            invitationToken: z.string()
                .min(1, 'Invitation token is required')
        })
    }),

    updateProfileSchema: z.object({
        body: z.object({
            firstName: z.string()
                .min(2, 'First name must be at least 2 characters')
                .max(50, 'First name cannot exceed 50 characters')
                .trim(),
            lastName: z.string()
                .min(2, 'Last name must be at least 2 characters')
                .max(50, 'Last name cannot exceed 50 characters')
                .trim()
        })
    }),

    changePasswordSchema: z.object({
        body: z.object({
            currentPassword: z.string()
                .min(1, 'Current password is required'),
            newPassword: z.string()
                .min(8, 'New password must be at least 8 characters')
                .max(128, 'New password cannot exceed 128 characters')
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
        })
    })
};

export default teamMemberSchemas;