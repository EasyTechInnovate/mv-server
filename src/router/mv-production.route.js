import { Router } from 'express';
import adminMVProductionController from '../controller/MVProduction/admin-mv-production.controller.js';
import userMVProductionController from '../controller/MVProduction/user-mv-production.controller.js';
import validateRequest from '../middleware/validateRequest.js';
import authentication from '../middleware/authentication.js';
import authorization from '../middleware/authorization.js';
import mvProductionSchemas from '../schema/mv-production.schema.js';

const router = Router();

router.route('/self').get(
    authentication,
    userMVProductionController.self
);

router.route('/admin/self').get(
    authentication,
    authorization(['admin']),
    adminMVProductionController.self
);

router.route('/admin/stats').get(
    authentication,
    authorization(['admin']),
    adminMVProductionController.getMVProductionStats
);

router.route('/admin/:productionId/status').patch(
    authentication,
    authorization(['admin']),
    validateRequest(mvProductionSchemas.updateMVProductionStatus),
    adminMVProductionController.updateMVProductionStatus
);

router.route('/admin/:productionId')
    .get(
        authentication,
        authorization(['admin']),
        validateRequest(mvProductionSchemas.getMVProductionById),
        adminMVProductionController.getMVProductionById
    )
    .patch(
        authentication,
        authorization(['admin']),
        validateRequest(mvProductionSchemas.updateMVProduction),
        adminMVProductionController.updateMVProduction
    )
    .delete(
        authentication,
        authorization(['admin']),
        validateRequest(mvProductionSchemas.deleteMVProduction),
        adminMVProductionController.deleteMVProduction
    );

router.route('/admin')
    .get(
        authentication,
        authorization(['admin']),
        validateRequest(mvProductionSchemas.getAllMVProductions, 'query'),
        adminMVProductionController.getAllMVProductions
    );

router.route('/')
    .post(
        authentication,
        validateRequest(mvProductionSchemas.createMVProduction),
        userMVProductionController.createMVProduction
    )
    .get(
        authentication,
        validateRequest(mvProductionSchemas.getUserMVProductions, 'query'),
        userMVProductionController.getUserMVProductions
    );

router.route('/:productionId')
    .get(
        authentication,
        validateRequest(mvProductionSchemas.getMVProductionById),
        userMVProductionController.getMVProductionById
    )
    .patch(
        authentication,
        validateRequest(mvProductionSchemas.updateMVProduction),
        userMVProductionController.updateMVProduction
    )
    .delete(
        authentication,
        validateRequest(mvProductionSchemas.deleteMVProduction),
        userMVProductionController.deleteMVProduction
    );

export default router;
