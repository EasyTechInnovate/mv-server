import express from 'express'
import walletController from '../controller/wallet.controller.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import { EUserRole } from '../constant/application.js'

const router = express.Router()

router.route('/my-wallet')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        walletController.getMyWallet
    )

router.route('/my-wallet/details')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        walletController.getWalletDetails
    )

router.route('/my-wallet/transactions')
    .get(
        authentication,
        authorization([EUserRole.USER, EUserRole.ADMIN]),
        walletController.getTransactionHistory
    )

export default router
