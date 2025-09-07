import { Router } from 'express'
import healthRouter from './health.route.js'
import authRouter from './auth.route.js'
import subscriptionRouter from './subscription.route.js'
import adminRouter from './admin.route.js'
import aggregatorRouter from './aggregator.route.js'

const router = Router()

router.use(healthRouter)
router.use('/auth', authRouter)
router.use('/subscription', subscriptionRouter)
router.use('/admin', adminRouter)
router.use('/aggregator', aggregatorRouter)

export default router