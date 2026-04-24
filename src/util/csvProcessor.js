import fs from 'fs'
import csv from 'csv-parser'
import { EReportType } from '../constant/application.js'

const requiredHeadersByType = {
    [EReportType.ANALYTICS]:     { 'Acount ID': 'accountId' },
    [EReportType.ROYALTY]:       { 'Acount ID': 'accountId' },
    [EReportType.BONUS_ROYALTY]: { 'Acount ID': 'accountId' },
    [EReportType.MCN]:           { 'Acount ID': 'accountId' }
}

const csvFieldMappings = {
    [EReportType.ANALYTICS]: {
        'Licensee': 'licensee',
        'Licensor': 'licensor',
        'Music Service': 'musicService',
        'Month': 'month',
        'Acount ID': 'accountId',
        'Label': 'label',
        'Artist': 'artist',
        'Album Title': 'albumTitle',
        'Track Title': 'trackTitle',
        'Product Title': 'productTitle',
        'Vol/Version': 'volVersion',
        'UPC': 'upc',
        'Cat No': 'catNo',
        'ISRC': 'isrc',
        'Total Units': 'totalUnits',
        'S/R': 'sr',
        'Country of Sale': 'countryOfSale',
        'Usage Type': 'usageType'
    },
    [EReportType.ROYALTY]: {
        'Licensee': 'licensee',
        'Licensor': 'licensor',
        'Music Service': 'musicService',
        'Month': 'month',
        'Acount ID': 'accountId',
        'Label': 'label',
        'Artist': 'artist',
        'Album Title': 'albumTitle',
        'Track Title': 'trackTitle',
        'Product Title': 'productTitle',
        'Vol/Version': 'volVersion',
        'UPC': 'upc',
        'Cat No': 'catNo',
        'ISRC': 'isrc',
        'Total Units': 'totalUnits',
        'S/R': 'sr',
        'Country of Sale': 'countryOfSale',
        'Usage Type': 'usageType',
        'Income': 'income',
        'Maheshwari Visuals Commission': 'maheshwariVisualsCommission',
        'Royalty': 'royalty'
    },
    [EReportType.BONUS_ROYALTY]: {
        'Licensee': 'licensee',
        'Licensor': 'licensor',
        'Music Service': 'musicService',
        'Month': 'month',
        'Acount ID': 'accountId',
        'Label': 'label',
        'Artist': 'artist',
        'Album Title': 'albumTitle',
        'Track Title': 'trackTitle',
        'Product Title': 'productTitle',
        'Vol/Version': 'volVersion',
        'UPC': 'upc',
        'Cat No': 'catNo',
        'ISRC': 'isrc',
        'Total Units': 'totalUnits',
        'S/R': 'sr',
        'Country of Sale': 'countryOfSale',
        'Usage Type': 'usageType',
        'Income': 'income',
        'Maheshwari Visuals Commission': 'maheshwariVisualsCommission',
        'Bonus': 'bonus',
        'Royalty': 'royalty'
    },
    [EReportType.MCN]: {
        'Licensee': 'licensee',
        'Licensor': 'licensor',
        'Asset Channel ID': 'assetChannelId',
        'YouTube Chanel Name': 'youtubeChannelName',
        'Month': 'month',
        'Acount ID': 'accountId',
        'Revenue Share %': 'revenueSharePercent',
        'YouTube Payout (USD)': 'youtubePayoutUsd',
        'MV Commission': 'mvCommission',
        'Revenue (USD)': 'revenueUsd',
        'Conversion Rate': 'conversionRate',
        'Payout Revenue (INR)': 'payoutRevenueInr'
    }
}

export const processCsvFile = (filePath, reportType) => {
    return new Promise((resolve, reject) => {
        const results = []
        const fieldMapping = csvFieldMappings[reportType]

        if (!fieldMapping) {
            return reject(new Error(`Invalid report type: ${reportType}`))
        }

        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found: ${filePath}`))
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const mappedRow = {}

                Object.entries(fieldMapping).forEach(([csvHeader, schemaField]) => {
                    const value = row[csvHeader] !== undefined ? row[csvHeader] : row[schemaField]

                    if (value !== undefined && value !== '') {
                        if (['totalUnits', 'income', 'maheshwariVisualsCommission', 'royalty',
                             'bonus', 'revenueSharePercent', 'youtubePayoutUsd', 'mvCommission',
                             'revenueUsd', 'conversionRate', 'payoutRevenueInr'].includes(schemaField)) {
                            mappedRow[schemaField] = parseFloat(value) || 0
                        } else {
                            mappedRow[schemaField] = value.toString().trim()
                        }
                    }
                })

                if (Object.keys(mappedRow).length > 0) {
                    results.push(mappedRow)
                }
            })
            .on('end', () => {
                resolve(results)
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}

export const calculateReportSummary = (data, reportType) => {
    const summary = {
        totalImpressions: 0,
        totalUnits: 0,
        totalRevenue: 0,
        activeRecords: data.length
    }

    data.forEach(record => {
        if (record.totalUnits) {
            summary.totalUnits += record.totalUnits
        }

        if (reportType === EReportType.ANALYTICS) {
            summary.totalImpressions = summary.totalUnits
        } else if (reportType === EReportType.ROYALTY) {
            if (record.income) {
                summary.totalRevenue += record.income
            }
        } else if (reportType === EReportType.BONUS_ROYALTY) {
            if (record.income) {
                summary.totalRevenue += record.income
            }
        } else if (reportType === EReportType.MCN) {
            if (record.revenueUsd) {
                summary.totalRevenue += record.revenueUsd
            }
        }
    })

    return summary
}

export const validateCsvHeaders = (filePath, reportType) => {
    return new Promise((resolve, reject) => {
        const mapping = csvFieldMappings[reportType]
        const actualHeaders = []

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (headers) => {
                actualHeaders.push(...headers)
            })
            .on('data', () => {
            })
            .on('end', () => {
                const required = requiredHeadersByType[reportType] || {}
                const missingHeaders = Object.entries(required)
                    .filter(([displayName, camelKey]) =>
                        !actualHeaders.includes(displayName) && !actualHeaders.includes(camelKey)
                    )
                    .map(([displayName]) => displayName)

                resolve({
                    isValid: missingHeaders.length === 0,
                    missingHeaders,
                    actualHeaders
                })
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}