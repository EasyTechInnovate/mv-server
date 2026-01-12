import fs from 'fs'
import ReportData from '../../model/report-data.model.js'
import MonthManagement from '../../model/month-management.model.js'
import Analytics from '../../model/analytics.model.js'
import Royalty from '../../model/royalty.model.js'
import Wallet from '../../model/wallet.model.js'
import User from '../../model/user.model.js'
import MCN from '../../model/mcn.model.js'
import { EReportType, EReportStatus } from '../../constant/application.js'
import { processCsvFile, calculateReportSummary, validateCsvHeaders } from '../../util/csvProcessor.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

const adminReportController = {
    async uploadReport(req, res, next) {
        try {
            const { monthId, reportType } = req.body

            if (!req.file) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('file')), req, 400)
            }

            if (!Object.values(EReportType).includes(reportType)) {
                return httpError(next, new Error(responseMessage.COMMON.INVALID_PARAMETERS('reportType')), req, 400)
            }

            const month = await MonthManagement.findById(monthId)
            if (!month) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Month')), req, 404)
            }

            const existingReport = await ReportData.findByMonthAndType(monthId, reportType)
            if (existingReport) {
                if (fs.existsSync(existingReport.filePath)) {
                    fs.unlinkSync(existingReport.filePath)
                }
                await ReportData.findByIdAndDelete(existingReport._id)
            }

            const filePath = req.file.path
            const fileName = req.file.filename
            const originalFileName = req.file.originalname
            const fileSize = req.file.size

            const headerValidation = await validateCsvHeaders(filePath, reportType)
            if (!headerValidation.isValid) {
                fs.unlinkSync(filePath)
                return httpError(
                    next,
                    new Error(responseMessage.customMessage(`Invalid CSV headers. Missing: ${headerValidation.missingHeaders.join(', ')}`)),
                    req,
                    400
                )
            }

            const reportData = new ReportData({
                monthId,
                reportType,
                fileName,
                originalFileName,
                filePath,
                fileSize,
                status: EReportStatus.PENDING,
                uploadedBy: req.authenticatedUser._id
            })

            await reportData.save()

            adminReportController.processCsvInBackground(reportData._id, filePath, reportType)

            httpResponse(
                req,
                res,
                201,
                responseMessage.CREATED,
                {
                    reportId: reportData._id,
                    status: reportData.status,
                    message: responseMessage.customMessage('File uploaded successfully. Processing in background.')
                }
            )
        } catch (err) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }
            httpError(next, err, req, 500)
        }
    },

    async processCsvInBackground(reportId, filePath, reportType) {
        try {
            const reportData = await ReportData.findById(reportId).populate('monthId')
            if (!reportData) return

            reportData.updateStatus(EReportStatus.PROCESSING)
            await reportData.save()

            const csvData = await processCsvFile(filePath, reportType)
            const summary = calculateReportSummary(csvData, reportType)

            // Store parsed data in ReportData
            reportData.data[reportType === EReportType.BONUS_ROYALTY ? 'bonusRoyalty' : reportType] = csvData
            reportData.totalRecords = csvData.length
            reportData.processedRecords = csvData.length
            reportData.summary = summary

            // Insert data into proper collections for dashboard queries
            let insertedCount = 0
            const monthId = reportData.monthId._id
            const month = reportData.monthId.month

            if (reportType === EReportType.ANALYTICS) {
                // Clear existing analytics for this month
                await Analytics.deleteMany({ monthId })

                // Insert new analytics records
                const analyticsRecords = csvData.map(record => ({
                    userAccountId: record.accountId,
                    licensee: record.licensee,
                    licensor: record.licensor,
                    platform: record.musicService,
                    monthId,
                    accountId: record.accountId,
                    labelName: record.label,
                    artistName: record.artist,
                    albumTitle: record.albumTitle,
                    trackTitle: record.trackTitle || record.productTitle || record.albumTitle || 'Unknown',
                    productTitle: record.productTitle,
                    volVersion: record.volVersion,
                    upc: record.upc,
                    catalogNumber: record.catNo,
                    isrc: record.isrc,
                    totalUnits: record.totalUnits || 0,
                    countryCode: (record.countryOfSale || 'XX').substring(0, 2).toUpperCase(),
                    usageType: record.usageType,
                    reportMonth: month.split('-')[0],
                    reportYear: parseInt('20' + month.split('-')[1])
                }))

                const result = await Analytics.insertMany(analyticsRecords)
                insertedCount = result.length

            } else if (reportType === EReportType.ROYALTY) {
                // Clear existing royalty for this month
                await Royalty.deleteMany({ monthId, royaltyType: 'regular' })

                // Insert new royalty records
                const royaltyRecords = csvData.map(record => ({
                    userAccountId: record.accountId,
                    licensee: record.licensee,
                    licensor: record.licensor,
                    platform: record.musicService,
                    monthId,
                    accountId: record.accountId,
                    labelName: record.label,
                    artistName: record.artist,
                    albumTitle: record.albumTitle,
                    trackTitle: record.trackTitle || record.productTitle || record.albumTitle || 'Unknown',
                    productTitle: record.productTitle,
                    volVersion: record.volVersion,
                    upc: record.upc,
                    catalogNumber: record.catNo,
                    isrc: record.isrc,
                    royaltyType: 'regular',
                    totalUnits: record.totalUnits || 0,
                    countryCode: (record.countryOfSale || 'XX').substring(0, 2).toUpperCase(),
                    regularRoyalty: Math.max(0, record.royalty || 0),
                    bonusRoyalty: 0,
                    totalEarnings: Math.max(0, record.royalty || 0),
                    maheshwariVisualsCommission: Math.max(0, record.maheshwariVisualsCommission || 0),
                    reportMonth: month.split('-')[0],
                    reportYear: parseInt('20' + month.split('-')[1])
                }))

                const result = await Royalty.insertMany(royaltyRecords)
                insertedCount = result.length

            } else if (reportType === EReportType.BONUS_ROYALTY) {
                // Clear existing bonus royalty for this month
                await Royalty.deleteMany({ monthId, royaltyType: 'bonus' })

                // Insert new bonus royalty records
                const bonusRecords = csvData.map(record => ({
                    userAccountId: record.accountId,
                    licensee: record.licensee,
                    licensor: record.licensor,
                    platform: record.musicService,
                    monthId,
                    accountId: record.accountId,
                    labelName: record.label,
                    artistName: record.artist,
                    albumTitle: record.albumTitle,
                    trackTitle: record.trackTitle || record.productTitle || record.albumTitle || 'Unknown',
                    productTitle: record.productTitle,
                    volVersion: record.volVersion,
                    upc: record.upc,
                    catalogNumber: record.catNo,
                    isrc: record.isrc,
                    royaltyType: 'bonus',
                    totalUnits: record.totalUnits || 0,
                    countryCode: (record.countryOfSale || 'XX').substring(0, 2).toUpperCase(),
                    regularRoyalty: Math.max(0, record.royalty || 0),
                    bonusRoyalty: Math.max(0, record.bonus || 0),
                    totalEarnings: Math.max(0, (record.bonus || 0) + (record.royalty || 0)),
                    maheshwariVisualsCommission: Math.max(0, record.maheshwariVisualsCommission || 0),
                    reportMonth: month.split('-')[0],
                    reportYear: parseInt('20' + month.split('-')[1])
                }))

                const result = await Royalty.insertMany(bonusRecords)
                insertedCount = result.length

            } else if (reportType === EReportType.MCN) {
                // Clear existing MCN for this month
                await MCN.deleteMany({ monthId })

                // Insert new MCN records
                const mcnRecords = csvData.map(record => ({
                    userAccountId: record.accountId,
                    licensee: record.licensee,
                    licensor: record.licensor,
                    assetChannelId: record.assetChannelId,
                    youtubeChannelName: record.youtubeChannelName,
                    monthId,
                    accountId: record.accountId,
                    revenueSharePercent: record.revenueSharePercent || 0,
                    youtubePayoutUsd: record.youtubePayoutUsd || 0,
                    mvCommission: record.mvCommission || 0,
                    revenueUsd: record.revenueUsd || 0,
                    conversionRate: record.conversionRate || 0,
                    payoutRevenueInr: record.payoutRevenueInr || 0,
                    reportMonth: month.split('-')[0],
                    reportYear: parseInt('20' + month.split('-')[1])
                }))

                const result = await MCN.insertMany(mcnRecords)
                insertedCount = result.length
            }

            if (reportType === EReportType.ROYALTY || reportType === EReportType.BONUS_ROYALTY) {
                const userEarnings = await Royalty.aggregate([
                    { $match: { monthId } },
                    {
                        $group: {
                            _id: '$userAccountId',
                            totalEarnings: { $sum: '$totalEarnings' },
                            regularRoyalty: { $sum: '$regularRoyalty' },
                            bonusRoyalty: { $sum: '$bonusRoyalty' },
                            commission: { $sum: '$maheshwariVisualsCommission' }
                        }
                    }
                ])

                for (const earnings of userEarnings) {
                    const user = await User.findOne({ accountId: earnings._id })
                    if (user) {
                        let wallet = await Wallet.findByUserId(user._id)
                        if (!wallet) {
                            wallet = await Wallet.createWallet(user._id, user.accountId)
                        }
                        await wallet.updateEarnings({
                            totalEarnings: earnings.totalEarnings,
                            regularRoyalty: earnings.regularRoyalty,
                            bonusRoyalty: earnings.bonusRoyalty,
                            commission: earnings.commission,
                            month: reportData.monthId.month
                        })
                        console.log(`✅ Updated wallet for user ${user.accountId}: +${earnings.totalEarnings} INR`)
                    }
                }
            }

            // Update wallets for MCN earnings
            if (reportType === EReportType.MCN) {
                const userEarnings = await MCN.aggregate([
                    { $match: { monthId } },
                    {
                        $group: {
                            _id: '$userAccountId',
                            totalEarnings: { $sum: '$payoutRevenueInr' },
                            mvCommission: { $sum: '$mvCommission' }
                        }
                    }
                ])

                for (const earnings of userEarnings) {
                    const user = await User.findOne({ accountId: earnings._id })
                    if (user) {
                        let wallet = await Wallet.findByUserId(user._id)
                        if (!wallet) {
                            wallet = await Wallet.createWallet(user._id, user.accountId)
                        }
                        await wallet.updateEarnings({
                            mcnRoyalty: earnings.totalEarnings,
                            commission: earnings.mvCommission,
                            month: reportData.monthId.month
                        })
                        console.log(`✅ Updated wallet for user ${user.accountId}: +${earnings.totalEarnings} INR (MCN)`)
                    }
                }
            }

            reportData.updateStatus(EReportStatus.COMPLETED)
            await reportData.save()

            console.log(`✅ Inserted ${insertedCount} ${reportType} records into collection`)

        } catch (error) {
            console.error('❌ CSV Processing Error:', error)
            const reportData = await ReportData.findById(reportId)
            if (reportData) {
                reportData.updateStatus(EReportStatus.FAILED, error.message)
                await reportData.save()
            }
        }
    },

    async getReports(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                monthId,
                reportType,
                status,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            let filter = { isActive: true }

            if (monthId) filter.monthId = monthId
            if (reportType && Object.values(EReportType).includes(reportType)) {
                filter.reportType = reportType
            }
            if (status && Object.values(EReportStatus).includes(status)) {
                filter.status = status
            }
            if (search) {
                filter.$or = [
                    { originalFileName: { $regex: search, $options: 'i' } },
                    { fileName: { $regex: search, $options: 'i' } }
                ]
            }

            const sortObj = {}
            sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1

            const [reports, totalCount] = await Promise.all([
                ReportData.find(filter)
                    .populate('monthId', 'month displayName type')
                    .populate('uploadedBy', 'firstName lastName emailAddress')
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limitNumber),
                ReportData.countDocuments(filter)
            ])

            const pagination = {
                totalCount,
                totalPages: Math.ceil(totalCount / limitNumber),
                currentPage: pageNumber,
                hasNext: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrev: pageNumber > 1
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    reports,
                    pagination
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getReportById(req, res, next) {
        try {
            const { id } = req.params

            const report = await ReportData.findOne({ _id: id, isActive: true })
                .populate('monthId', 'month displayName type')
                .populate('uploadedBy', 'firstName lastName emailAddress')

            if (!report) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Report')), req, 404)
            }

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                report
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getReportData(req, res, next) {
        try {
            const { id } = req.params
            const {
                page = 1,
                limit = 100,
                search
            } = req.query

            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const report = await ReportData.findOne({ _id: id, isActive: true })

            if (!report) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Report')), req, 404)
            }

            let data = []
            const dataKey = report.reportType === EReportType.BONUS_ROYALTY ? 'bonusRoyalty' : report.reportType

            if (report.data && report.data[dataKey]) {
                data = report.data[dataKey]

                if (search) {
                    data = data.filter(record =>
                        Object.values(record).some(value =>
                            value && value.toString().toLowerCase().includes(search.toLowerCase())
                        )
                    )
                }
                const totalCount = data.length
                data = data.slice(skip, skip + limitNumber)

                const pagination = {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limitNumber),
                    currentPage: pageNumber,
                    hasNext: pageNumber < Math.ceil(totalCount / limitNumber),
                    hasPrev: pageNumber > 1
                }

                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.SUCCESS,
                    {
                        data,
                        summary: report.summary,
                        pagination
                    }
                )
            } else {
                httpResponse(
                    req,
                    res,
                    200,
                    responseMessage.SUCCESS,
                    {
                        data: [],
                        summary: report.summary,
                        pagination: { totalCount: 0, totalPages: 0, currentPage: 1, hasNext: false, hasPrev: false }
                    }
                )
            }
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async deleteReport(req, res, next) {
        try {
            const { id } = req.params

            const report = await ReportData.findById(id)
            if (!report) {
                return httpError(next, new Error(responseMessage.ERROR.NOT_FOUND('Report')), req, 404)
            }

            if (fs.existsSync(report.filePath)) {
                fs.unlinkSync(report.filePath)
            }
            report.isActive = false
            await report.save()

            httpResponse(
                req,
                res,
                200,
                responseMessage.DELETED
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getReportsByMonth(req, res, next) {
        try {
            const { monthId } = req.params

            const reports = await ReportData.findByMonth(monthId)
                .populate('monthId', 'month displayName type')
                .populate('uploadedBy', 'firstName lastName emailAddress')
                .sort({ createdAt: -1 })

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                reports
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    },

    async getReportStats(req, res, next) {
        try {
            const stats = await ReportData.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$reportType',
                        total: { $sum: 1 },
                        pending: { $sum: { $cond: [{ $eq: ['$status', EReportStatus.PENDING] }, 1, 0] } },
                        processing: { $sum: { $cond: [{ $eq: ['$status', EReportStatus.PROCESSING] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $eq: ['$status', EReportStatus.COMPLETED] }, 1, 0] } },
                        failed: { $sum: { $cond: [{ $eq: ['$status', EReportStatus.FAILED] }, 1, 0] } },
                        totalRecords: { $sum: '$totalRecords' },
                        totalRevenue: { $sum: '$summary.totalRevenue' }
                    }
                }
            ])

            const totalReports = await ReportData.countDocuments({ isActive: true })
            const totalProcessedRecords = await ReportData.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: null, total: { $sum: '$totalRecords' } } }
            ])

            httpResponse(
                req,
                res,
                200,
                responseMessage.SUCCESS,
                {
                    overview: {
                        totalReports,
                        totalProcessedRecords: totalProcessedRecords[0]?.total || 0
                    },
                    byType: stats
                }
            )
        } catch (err) {
            httpError(next, err, req, 500)
        }
    }
}

export default adminReportController