import Wallet from '../model/wallet.model.js'
import Royalty from '../model/royalty.model.js'
import MCN from '../model/mcn.model.js'
import MonthManagement from '../model/month-management.model.js'
import User from '../model/user.model.js'

export const recalculateWalletForUser = async (userId) => {
    const user = await User.findById(userId).select('accountId').lean()
    if (!user) return null

    const activeMonths = await MonthManagement.find({ isActive: true }).select('_id').lean()
    const activeMonthIds = activeMonths.map(m => m._id)

    const [royaltyAgg, mcnAgg] = await Promise.all([
        Royalty.aggregate([
            { $match: { accountId: user.accountId, monthId: { $in: activeMonthIds } } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$totalEarnings' },
                    regularRoyalty: { $sum: '$regularRoyalty' },
                    bonusRoyalty: { $sum: '$bonusRoyalty' },
                    commission: { $sum: '$maheshwariVisualsCommission' }
                }
            }
        ]),
        MCN.aggregate([
            { $match: { accountId: user.accountId, monthId: { $in: activeMonthIds } } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$payoutRevenueInr' },
                    commission: { $sum: '$mvCommission' }
                }
            }
        ])
    ])

    const royalty = royaltyAgg[0] || { totalEarnings: 0, regularRoyalty: 0, bonusRoyalty: 0, commission: 0 }
    const mcn = mcnAgg[0] || { totalEarnings: 0, commission: 0 }

    let wallet = await Wallet.findByUserId(userId)
    if (!wallet) {
        wallet = await Wallet.createWallet(userId, user.accountId)
    }

    const adjTotal = wallet._adminAdjustmentsTotal()

    wallet.totalEarnings = royalty.totalEarnings + mcn.totalEarnings
    wallet.regularRoyalty = royalty.regularRoyalty
    wallet.bonusRoyalty = royalty.bonusRoyalty
    wallet.mcnRoyalty = mcn.totalEarnings
    wallet.totalCommission = royalty.commission + mcn.commission
    wallet.availableBalance = wallet.totalEarnings - wallet.totalCommission + adjTotal
    wallet.withdrawableBalance = wallet.availableBalance - wallet.pendingPayout - wallet.totalPaidOut

    return wallet.save()
}
