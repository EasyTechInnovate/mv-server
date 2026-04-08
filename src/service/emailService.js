import config from '../config/config.js';

const YEAR = () => String(new Date().getFullYear())

const send = async (apiKey, recipient, attribs) => {
    if (!apiKey) {
        console.warn(`BillionMail key missing — email not sent to ${recipient}`)
        return
    }
    try {
        const res = await fetch(`${config.email.billionmailUrl}/api/batch_mail/api/send`, {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipient, attribs: { year: YEAR(), ...attribs } })
        })
        const data = await res.json()
        if (!data.success) console.error('BillionMail error:', data.msg)
        return data
    } catch (err) {
        console.error('BillionMail send failed:', err.message)
    }
}

const K = config.email.keys

// ─── Auth ──────────────────────────────────────────────────────────────────

export const sendForgotPasswordEmail = (to, firstName, resetUrl) =>
    send(K.forgotPassword, to, {
        name: firstName,
        email: to,
        reset_link: resetUrl,
        expiry_time: '1 hour'
    })

export const sendVerificationEmail = (to, firstName, code) =>
    send(K.emailVerification, to, {
        name: firstName,
        email: to,
        code
    })

export const sendTeamInvitationEmail = (to, firstName, invitationUrl) =>
    send(K.teamInvitation, to, {
        name: firstName,
        email: to,
        invitation_link: invitationUrl
    })

// ─── 1. Welcome ────────────────────────────────────────────────────────────

export const sendWelcomeEmail = (to, firstName) =>
    send(K.welcome, to, {
        name: firstName,
        email: to,
        subscriptions_link: `${config.client.url}/pricing/everyone`
    })

// ─── 2. Distribution Agreement ─────────────────────────────────────────────

export const sendDistributionAgreementEmail = (to, firstName) =>
    send(K.distributionAgreement, to, {
        name: firstName,
        email: to
    })

// ─── 3. Membership Purchase Failed ────────────────────────────────────────

export const sendMembershipPurchaseFailedEmail = (to, firstName, planName, amount) =>
    send(K.membershipFailed, to, {
        name: firstName,
        email: to,
        plan_name: planName,
        amount: String(amount),
        retry_link: `${config.client.url}/subscriptions`
    })

// ─── 4. Membership Purchase Reminder ──────────────────────────────────────

export const sendMembershipPurchaseReminderEmail = (to, firstName) =>
    send(K.membershipReminder, to, {
        name: firstName,
        email: to,
        subscriptions_link: `${config.client.url}/subscriptions`
    })

// ─── 5. Membership Activation ─────────────────────────────────────────────

export const sendMembershipActivationEmail = (to, firstName, planName, validUntil) => {
    const expiry = new Date(validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    return send(K.membershipActivation, to, {
        name: firstName,
        email: to,
        plan_name: planName,
        valid_until: expiry,
        dashboard_link: `${config.client.url}/app`
    })
}

// ─── 6. Membership Expiry Notice ──────────────────────────────────────────

export const sendMembershipExpiryNoticeEmail = (to, firstName, planName, validUntil, daysLeft) => {
    const expiry = new Date(validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    return send(K.membershipExpiry, to, {
        name: firstName,
        email: to,
        plan_name: planName,
        valid_until: expiry,
        days_left: String(daysLeft),
        renew_link: `${config.client.url}/subscriptions`
    })
}

// ─── 7. KYC Documents Needed (prompt after membership activates) ──────────

export const sendKycDocumentsNeededEmail = (to, firstName) =>
    send(K.kycDocumentsNeeded, to, {
        name: firstName,
        email: to,
        kyc_link: `${config.client.url}/app/settings`
    })

// ─── 8. KYC Verification Underway (after user submits KYC) ───────────────

export const sendKycPendingEmail = (to, firstName) =>
    send(K.kycPending, to, {
        name: firstName,
        email: to
    })

// ─── 8. KYC Status (Verified / Rejected) ──────────────────────────────────

export const sendKycVerifiedEmail = (to, firstName, status, rejectionReason = '') =>
    send(K.kycStatus, to, {
        name: firstName,
        email: to,
        status,
        is_verified: status === 'verified' ? 'true' : 'false',
        rejection_reason: rejectionReason || '',
        dashboard_link: `${config.client.url}/app`,
        resubmit_link: `${config.client.url}/app/settings`
    })

// ─── 9. Royalty Withdraw Requested ────────────────────────────────────────

export const sendRoyaltyWithdrawRequestedEmail = (to, firstName, amount, requestId) =>
    send(K.royaltyWithdrawRequest, to, {
        name: firstName,
        email: to,
        amount: String(amount),
        request_id: requestId
    })

// ─── 10. Royalty Withdraw Status (Approved / Rejected) ────────────────────

export const sendRoyaltyWithdrawStatusEmail = (to, firstName, amount, requestId, status, reason = '') =>
    send(K.royaltyWithdrawStatus, to, {
        name: firstName,
        email: to,
        amount: String(amount),
        request_id: requestId,
        status,
        is_approved: status === 'approved' ? 'true' : 'false',
        reason: reason || ''
    })

// ─── 11. Royalty Paid ─────────────────────────────────────────────────────

export const sendRoyaltyPaidEmail = (to, firstName, amount, requestId, transactionRef = '') =>
    send(K.royaltyPaid, to, {
        name: firstName,
        email: to,
        amount: String(amount),
        request_id: requestId,
        transaction_ref: transactionRef
    })

// ─── 12. Release Submitted ────────────────────────────────────────────────

export const sendReleaseSubmittedEmail = (to, firstName, releaseName, releaseId) =>
    send(K.releaseSubmitted, to, {
        name: firstName,
        email: to,
        release_name: releaseName,
        release_id: releaseId
    })

// ─── 13. Release Approved / Rejected (same template, is_approved flag) ───

export const sendReleaseApprovedEmail = (to, firstName, releaseName, releaseId) =>
    send(K.releaseApproved, to, {
        name: firstName,
        email: to,
        release_name: releaseName,
        release_id: releaseId,
        is_approved: 'true',
        reason: '',
        dashboard_link: `${config.client.url}/app/releases`
    })

export const sendReleaseRejectedEmail = (to, firstName, releaseName, releaseId, reason = '') =>
    send(K.releaseApproved, to, {
        name: firstName,
        email: to,
        release_name: releaseName,
        release_id: releaseId,
        is_approved: 'false',
        reason: reason || '',
        dashboard_link: `${config.client.url}/app/releases`
    })

// ─── 14. Release Under Delivery ───────────────────────────────────────────

export const sendReleaseUnderDeliveryEmail = (to, firstName, releaseName, releaseId) =>
    send(K.releaseUnderDelivery, to, {
        name: firstName,
        email: to,
        release_name: releaseName,
        release_id: releaseId
    })

// ─── 15. Release Live ─────────────────────────────────────────────────────

export const sendReleaseLiveEmail = (to, firstName, releaseName, releaseId) =>
    send(K.releaseLive, to, {
        name: firstName,
        email: to,
        release_name: releaseName,
        release_id: releaseId,
        dashboard_link: `${config.client.url}/app/releases`
    })

// ─── 16. Release Edit Approved ────────────────────────────────────────────

export const sendReleaseEditApprovedEmail = (to, firstName, releaseName, releaseId) =>
    send(K.releaseEditApproved, to, {
        name: firstName,
        email: to,
        release_name: releaseName,
        release_id: releaseId,
        edit_link: `${config.client.url}/app/releases`
    })

// ─── 17. Release Takedown ─────────────────────────────────────────────────

export const sendReleaseTakedownEmail = (to, firstName, releaseName, releaseId) =>
    send(K.releaseTakedown, to, {
        name: firstName,
        email: to,
        release_name: releaseName,
        release_id: releaseId
    })

// ─── 18. Sync Submitted ───────────────────────────────────────────────────

export const sendSyncRequestSubmittedEmail = (to, firstName, trackTitle) =>
    send(K.syncSubmitted, to, {
        name: firstName,
        email: to,
        track_title: trackTitle
    })

// ─── 19. Sync Status ──────────────────────────────────────────────────────

export const sendSyncRequestStatusEmail = (to, firstName, trackTitle, status, reason = '') =>
    send(K.syncStatus, to, {
        name: firstName,
        email: to,
        track_title: trackTitle,
        status,
        is_approved: status === 'approved' ? 'true' : 'false',
        reason: reason || ''
    })

// ─── 20. Playlist Pitching Submitted ──────────────────────────────────────

export const sendPlaylistPitchingSubmittedEmail = (to, firstName, trackTitle) =>
    send(K.playlistSubmitted, to, {
        name: firstName,
        email: to,
        track_title: trackTitle
    })

// ─── 21. Playlist Pitching Status ─────────────────────────────────────────

export const sendPlaylistPitchingStatusEmail = (to, firstName, trackTitle, status, reason = '') =>
    send(K.playlistStatus, to, {
        name: firstName,
        email: to,
        track_title: trackTitle,
        status,
        is_approved: status === 'approved' ? 'true' : 'false',
        reason: reason || ''
    })

// ─── 22. MV Production Submitted ──────────────────────────────────────────

export const sendMVProductionSubmittedEmail = (to, firstName, projectTitle) =>
    send(K.mvProductionSubmitted, to, {
        name: firstName,
        email: to,
        project_title: projectTitle
    })

// ─── 23. MV Production Status ─────────────────────────────────────────────

export const sendMVProductionStatusEmail = (to, firstName, projectTitle, status, reason = '') =>
    send(K.mvProductionStatus, to, {
        name: firstName,
        email: to,
        project_title: projectTitle,
        status,
        is_approved: status === 'accept' ? 'true' : 'false',
        reason: reason || ''
    })

// ─── 24. Merch Store Submitted ────────────────────────────────────────────

export const sendMerchStoreSubmittedEmail = (to, firstName, storeName) =>
    send(K.merchSubmitted, to, {
        name: firstName,
        email: to,
        store_name: storeName
    })

// ─── 25. Merch Store Status ───────────────────────────────────────────────

export const sendMerchStoreStatusEmail = (to, firstName, storeName, status, reason = '') =>
    send(K.merchStatus, to, {
        name: firstName,
        email: to,
        store_name: storeName,
        status: status.replace(/_/g, ' '),
        is_approved: ['approved', 'design_approved'].includes(status) ? 'true' : 'false',
        reason: reason || '',
        store_link: `${config.client.url}/app/merch-store`
    })

// ─── 26. Aggregator Account Activation ────────────────────────────────────

export const sendAggregatorAccountActivationEmail = (to, firstName, password, loginUrl) =>
    send(K.aggregatorActivation, to, {
        name: firstName,
        email: to,
        password,
        login_link: loginUrl
    })
