import { Router } from 'express'
import basicReleaseController from '../controller/Releases/basic-release.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import releaseSchemas from '../schema/release.schema.js'

const router = Router()

router.route('/self').get(basicReleaseController.self)

router.route('/create')
    .post(
        authentication,
        validateRequest(releaseSchemas.createRelease),
        basicReleaseController.createRelease
    )

router.route('/:releaseId/step1')
    .patch(
        authentication,
        validateRequest(releaseSchemas.updateStep1),
        basicReleaseController.updateStep1
    )

router.route('/:releaseId/step2')
    .patch(
        authentication,
        validateRequest(releaseSchemas.updateStep2),
        basicReleaseController.updateStep2
    )

router.route('/:releaseId/step3')
    .patch(
        authentication,
        validateRequest(releaseSchemas.updateStep3),
        basicReleaseController.updateStep3
    )

router.route('/:releaseId/submit')
    .post(
        authentication,
        validateRequest(releaseSchemas.releaseIdParam),
        basicReleaseController.submitRelease
    )

router.route('/my-releases')
    .get(
        authentication,
        validateRequest(releaseSchemas.getReleases),
        basicReleaseController.getMyReleases
    )

router.route('/:releaseId')
    .get(
        authentication,
        validateRequest(releaseSchemas.releaseIdParam),
        basicReleaseController.getReleaseDetails
    )
    .delete(
        authentication,
        validateRequest(releaseSchemas.releaseIdParam),
        basicReleaseController.deleteRelease
    )

router.route('/:releaseId/request-update')
    .post(
        authentication,
        validateRequest(releaseSchemas.releaseIdParam),
        validateRequest(releaseSchemas.requestUpdate),
        basicReleaseController.requestUpdate
    )

router.route('/:releaseId/request-takedown')
    .post(
        authentication,
        validateRequest(releaseSchemas.releaseIdParam),
        validateRequest(releaseSchemas.requestTakeDown),
        basicReleaseController.requestTakeDown
    )

export default router