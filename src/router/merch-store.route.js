import { Router } from 'express';
import adminMerchStoreController from '../controller/MerchStore/admin-merch-store.controller.js';
import userMerchStoreController from '../controller/MerchStore/user-merch-store.controller.js';
import validateRequest from '../middleware/validateRequest.js';
import authentication from '../middleware/authentication.js';
import authorization from '../middleware/authorization.js';
import { merchStoreSchema } from '../schema/merch-store.schema.js';

const router = Router();

router.route('/self').get(
    authentication,
    userMerchStoreController.self
);

router.route('/admin/self').get(
    authentication,
    authorization(['admin']),
    adminMerchStoreController.self
);

router.route('/admin/stats').get(
    authentication,
    authorization(['admin']),
    adminMerchStoreController.getStats
);

router.route('/admin/listed-products').get(
    authentication,
    authorization(['admin']),
    adminMerchStoreController.getListedProducts
);

router.route('/admin/:storeId/status').patch(
    authentication,
    authorization(['admin']),
    validateRequest(merchStoreSchema.updateStatus),
    adminMerchStoreController.updateMerchStoreStatus
);

router.route('/admin/:storeId')
    .get(
        authentication,
        authorization(['admin']),
        validateRequest(merchStoreSchema.getMerchStoreById),
        adminMerchStoreController.getMerchStoreById
    )
    .patch(
        authentication,
        authorization(['admin']),
        validateRequest(merchStoreSchema.updateMerchStore),
        adminMerchStoreController.updateMerchStore
    )
    .delete(
        authentication,
        authorization(['admin']),
        validateRequest(merchStoreSchema.deleteMerchStore),
        adminMerchStoreController.deleteMerchStore
    );



router.route('/admin/:storeId/designs/:designId/status').patch(
    authentication,
    authorization(['admin']),
    adminMerchStoreController.updateDesignStatus
);

router.route('/admin/:storeId/designs/:designId/products').patch(
    authentication,
    authorization(['admin']),
    adminMerchStoreController.manageDesignProducts
);

router.route('/admin/:storeId/designs/:designId/name').patch(
    authentication,
    authorization(['admin']),
    adminMerchStoreController.updateDesignName
);

router.route('/admin')
    .get(
        authentication,
        authorization(['admin']),
        validateRequest(merchStoreSchema.getMerchStores, 'query'),
        adminMerchStoreController.getAllMerchStores
    );

router.route('/')
    .post(
        authentication,
        validateRequest(merchStoreSchema.createMerchStore),
        userMerchStoreController.createMerchStore
    )
    .get(
        authentication,
        validateRequest(merchStoreSchema.getMerchStores, 'query'),
        userMerchStoreController.getUserMerchStores
    );

router.route('/approved-designs').get(
    authentication,
    validateRequest(merchStoreSchema.getApprovedDesigns, 'query'),
    userMerchStoreController.getApprovedDesigns
);

router.route('/:storeId/designs').post(
    authentication,
    validateRequest(merchStoreSchema.submitDesigns),
    userMerchStoreController.submitDesigns
);

router.route('/:storeId')
    .get(
        authentication,
        validateRequest(merchStoreSchema.getMerchStoreById),
        userMerchStoreController.getMerchStoreById
    )
    .patch(
        authentication,
        validateRequest(merchStoreSchema.updateMerchStore),
        userMerchStoreController.updateMerchStore
    )
    .delete(
        authentication,
        validateRequest(merchStoreSchema.deleteMerchStore),
        userMerchStoreController.deleteMerchStore
    );

export default router;
