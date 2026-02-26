import Wallet from '../model/wallet.model.js'
import Royalty from '../model/royalty.model.js'
import PayoutRequest from '../model/payoutRequest.model.js'
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
                adminAdjustments: wallet.adminAdjustments || [],
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
    ,

    async getTransactionHistory(req, res, next) {
        try {
            const userId = req.authenticatedUser._id
            const accountId = req.authenticatedUser.accountId
            const { page = 1, limit = 20, type, month, year } = req.query

            const pageNum = parseInt(page)
            const limitNum = parseInt(limit)

            // ── 1. Royalty credits ── aggregated by month+type, not per-track
            const royaltyMatch = { userAccountId: accountId }
            if (month && year) {
                royaltyMatch.reportMonth = month
                royaltyMatch.reportYear = parseInt(year)
            }

            const royaltyByMonth = await Royalty.aggregate([
                { $match: royaltyMatch },
                {
                    $group: {
                        _id: { year: '$reportYear', month: '$reportMonth', royaltyType: '$royaltyType' },
                        totalEarnings: { $sum: '$totalEarnings' },
                        totalStreams: { $sum: '$totalUnits' },
                        latestDate: { $max: '$createdAt' }
                    }
                },
                { $sort: { latestDate: -1 } }
            ])

            // ── 2. Admin adjustments ── embedded in wallet
            let wallet = await Wallet.findByUserId(userId)
            if (!wallet) {
                wallet = await Wallet.createWallet(userId, accountId)
            }
            await wallet.populate('adminAdjustments.adjustedBy', 'firstName lastName')

            let adminAdjustments = wallet.adminAdjustments || []
            if (month && year) {
                adminAdjustments = adminAdjustments.filter(adj => {
                    const d = new Date(adj.adjustedAt)
                    return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)
                })
            }

            // ── 3. Payout withdrawals ──
            const payoutMatch = { userId, isActive: true }
            if (month && year) {
                const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
                const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
                payoutMatch.requestedAt = { $gte: startOfMonth, $lte: endOfMonth }
            }
            const payouts = await PayoutRequest.find(payoutMatch).sort({ requestedAt: -1 }).lean()

            // ── Build unified list ──
            const transactions = []

            royaltyByMonth.forEach(r => {
                const isBonus = r._id.royaltyType === 'bonus'
                transactions.push({
                    id: `royalty_${r._id.year}_${r._id.month}_${r._id.royaltyType}`,
                    type: isBonus ? 'bonus_royalty' : 'regular_royalty',
                    direction: 'credit',
                    amount: parseFloat(r.totalEarnings.toFixed(2)),
                    description: `${isBonus ? 'Bonus' : 'Regular'} Royalty — ${r._id.month} ${r._id.year}`,
                    month: `${r._id.month} ${r._id.year}`,
                    streams: r.totalStreams,
                    date: r.latestDate
                })
            })

            adminAdjustments.forEach(adj => {
                transactions.push({
                    id: adj._id,
                    type: 'admin_adjustment',
                    direction: adj.type, // 'credit' or 'debit'
                    amount: adj.amount,
                    description: adj.reason,
                    date: adj.adjustedAt,
                    adjustedBy: adj.adjustedBy
                        ? `${adj.adjustedBy.firstName} ${adj.adjustedBy.lastName}`
                        : 'Admin',
                    balanceBefore: adj.balanceBefore,
                    balanceAfter: adj.balanceAfter
                })
            })

            payouts.forEach(p => {
                transactions.push({
                    id: p.requestId,
                    type: 'withdrawal',
                    direction: 'debit',
                    amount: p.amount,
                    description: `Withdrawal — ${p.payoutMethod?.replace('_', ' ')}`,
                    date: p.requestedAt,
                    status: p.status,
                    requestId: p.requestId
                })
            })

            // ── Filter by type if passed ──
            const filtered = type
                ? transactions.filter(t => t.type === type)
                : transactions

            // ── Sort: most recent first ──
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date))

            // ── Paginate in memory (data sets are small per user) ──
            const totalItems = filtered.length
            const paged = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)

            // ── Summary across all (unfiltered) transactions ──
            const totalCredits = transactions
                .filter(t => t.direction === 'credit')
                .reduce((sum, t) => sum + t.amount, 0)
            const totalDebits = transactions
                .filter(t => t.direction === 'debit')
                .reduce((sum, t) => sum + t.amount, 0)

            return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                transactions: paged,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalItems / limitNum),
                    totalItems,
                    itemsPerPage: limitNum
                },
                summary: {
                    totalCredits: parseFloat(totalCredits.toFixed(2)),
                    totalDebits: parseFloat(totalDebits.toFixed(2)),
                    currentBalance: wallet.availableBalance
                }
            })
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}

export default walletController
