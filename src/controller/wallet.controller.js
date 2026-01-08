import Wallet from '../model/wallet.model.js'
import responseMessage from '../constant/responseMessage.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'

const walletController = {
    async getMyWallet(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const accountId = req.authenticatedUser.accountId

            let wallet = await Wallet.findByUserId(userId)

            if (!wallet) {
                wallet = await Wallet.createWallet(userId, accountId)
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    wallet: {
                        accountId: wallet.accountId,
                        totalEarnings: wallet.totalEarnings,
                        regularRoyalty: wallet.regularRoyalty,
                        bonusRoyalty: wallet.bonusRoyalty,
                        totalCommission: wallet.totalCommission,
                        availableBalance: wallet.availableBalance,
                        pendingPayout: wallet.pendingPayout,
                        totalPaidOut: wallet.totalPaidOut,
                        withdrawableBalance: wallet.withdrawableBalance,
                        lastCalculatedAt: wallet.lastCalculatedAt,
                        lastCalculatedMonth: wallet.lastCalculatedMonth,
                        hasBalance: wallet.hasBalance,
                        canWithdraw: wallet.canWithdraw
                    }
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getWalletDetails(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const accountId = req.authenticatedUser.accountId

            let wallet = await Wallet.findByUserId(userId)

            if (!wallet) {
                wallet = await Wallet.createWallet(userId, accountId)
            }

            const breakdown = {
                earnings: {
                    regularRoyalty: wallet.regularRoyalty,
                    bonusRoyalty: wallet.bonusRoyalty,
                    totalEarnings: wallet.totalEarnings
                },
                deductions: {
                    commission: wallet.totalCommission,
                    paidOut: wallet.totalPaidOut
                },
                balances: {
                    availableBalance: wallet.availableBalance,
                    pendingPayout: wallet.pendingPayout,
                    withdrawableBalance: wallet.withdrawableBalance
                },
                metadata: {
                    lastCalculatedAt: wallet.lastCalculatedAt,
                    lastCalculatedMonth: wallet.lastCalculatedMonth
                }
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    wallet: breakdown
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}

export default walletController
