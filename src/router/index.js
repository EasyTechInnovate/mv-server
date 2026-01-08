import { Router } from 'express';

import healthRouter from './health.route.js';
import authRouter from './auth.route.js';
import subscriptionRouter from './subscription.route.js';
import adminRouter from './admin.route.js';
import aggregatorRouter from './aggregator.route.js';
import releaseRouter from './release.route.js';
import advanceReleaseRouter from './advance-release.route.js';
import monthManagementRouter from './month-management.route.js';
import reportRouter from './report.route.js';
import faqRouter from './faq.route.js';
import testimonialRouter from './testimonial.route.js';
import trendingLabelRouter from './trending-label.route.js';
import trendingArtistRouter from './trending-artist.route.js';
import companySettingsRouter from './company-settings.route.js';
import teamMemberRouter from './team-member.route.js';
import supportTicketRouter from './support-ticket.route.js';
import mcnRouter from './mcn.route.js';
import marketingRouter from './marketing.route.js';
import fanLinkRouter from './fan-link.route.js';
import mvProductionRouter from './mv-production.route.js';
import merchStoreRouter from './merch-store.route.js';
import uploadRoutes from './upload.route.js';
import walletRouter from './wallet.route.js';
import payoutRequestRouter from './payout-request.route.js';

const router = Router();

// mount all routers
router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/subscription', subscriptionRouter);
router.use('/admin', adminRouter);
router.use('/aggregator', aggregatorRouter);
router.use('/releases', releaseRouter);
router.use('/advance-releases', advanceReleaseRouter);
router.use('/months', monthManagementRouter);
router.use('/reports', reportRouter);
router.use('/faqs', faqRouter);
router.use('/testimonials', testimonialRouter);
router.use('/trending-labels', trendingLabelRouter);
router.use('/trending-artists', trendingArtistRouter);
router.use('/company-settings', companySettingsRouter);
router.use('/team-members', teamMemberRouter);
router.use('/support-tickets', supportTicketRouter);
router.use('/mcn', mcnRouter);
router.use('/marketing', marketingRouter);
router.use('/fan-links', fanLinkRouter);
router.use('/mv-production', mvProductionRouter);
router.use('/merch-store', merchStoreRouter);
router.use('/upload', uploadRoutes)
router.use('/wallet', walletRouter);
router.use('/payout-requests', payoutRequestRouter);


export default router;
