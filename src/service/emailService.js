import { Resend } from 'resend';
import config from '../config/config.js';

let resend;

const getResendClient = () => {
    if (!resend && config.email.resendApiKey) {
        resend = new Resend(config.email.resendApiKey);
    }
    return resend;
};

/**
 * Send a forgot password email
 * @param {string} to - Receiver email
 * @param {string} firstName - User's first name
 * @param {string} resetUrl - Password reset URL
 */
export const sendForgotPasswordEmail = async (to, firstName, resetUrl) => {
    try {
        const client = getResendClient();
        if (!client) {
            console.warn('RESEND_API_KEY is missing. Forgot password email will not be sent.');
            return;
        }

        const data = await client.emails.send({
            from: config.email.from || 'noreply@maheshwarivisuals.com',
            to: [to],
            subject: 'Reset Your Password - Maheshwari Visuals',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #652CD6; text-align: center;">Maheshwari Visuals</h2>
                    <p>Hello ${firstName},</p>
                    <p>We received a request to reset your password. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #652CD6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; color: #652CD6;">${resetUrl}</p>
                    <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Maheshwari Visuals. All rights reserved.</p>
                </div>
            `,
        });

        return data;
    } catch (error) {
        console.error('Error sending forgot password email:', error);
        throw error;
    }
};

/**
 * Send an email verification code
 * @param {string} to - Receiver email
 * @param {string} firstName - User's first name
 * @param {string} code - Verification code
 */
export const sendVerificationEmail = async (to, firstName, code) => {
    try {
        const client = getResendClient();
        if (!client) {
            console.warn('RESEND_API_KEY is missing. Verification email will not be sent.');
            return;
        }

        const data = await client.emails.send({
            from: config.email.from || 'noreply@maheshwarivisuals.com',
            to: [to],
            subject: 'Verify Your Email - Maheshwari Visuals',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #652CD6; text-align: center;">Maheshwari Visuals</h2>
                    <p>Hello ${firstName},</p>
                    <p>Your verification code is:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #652CD6;">${code}</span>
                    </div>
                    <p>Use this code to verify your account. It will expire in 24 hours.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Maheshwari Visuals. All rights reserved.</p>
                </div>
            `,
        });

        return data;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

/**
 * Send a team member invitation email
 * @param {string} to - Receiver email
 * @param {string} firstName - Team member's first name
 * @param {string} invitationUrl - Acceptance URL
 */
export const sendTeamInvitationEmail = async (to, firstName, invitationUrl) => {
    try {
        const client = getResendClient();
        if (!client) {
            console.warn('RESEND_API_KEY is missing. Team invitation email will not be sent.');
            return;
        }

        const data = await client.emails.send({
            from: config.email.from || 'noreply@maheshwarivisuals.com',
            to: [to],
            subject: 'Join the Team - Maheshwari Visuals',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #652CD6; text-align: center;">Maheshwari Visuals</h2>
                    <p>Hello ${firstName},</p>
                    <p>You have been invited to join the Maheshwari Visuals team. Click the button below to accept the invitation and set your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${invitationUrl}" style="background-color: #652CD6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold;">Accept Invitation</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; color: #652CD6;">${invitationUrl}</p>
                    <p>This invitation will expire in 7 days.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Maheshwari Visuals. All rights reserved.</p>
                </div>
            `,
        });

        return data;
    } catch (error) {
        console.error('Error sending team invitation email:', error);
        throw error;
    }
};
