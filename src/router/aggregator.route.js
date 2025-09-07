import { Router } from 'express'
import aggregatorController from '../controller/Aggregator/aggregator.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import aggregatorSchemas from '../schema/aggregator.schema.js'

const router = Router()

router.route('/apply')
    .post(
        validateRequest(aggregatorSchemas.submitApplication),
        aggregatorController.submitApplication
    )

export default router