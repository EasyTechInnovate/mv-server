import TrendingArtistModel from '../../model/trending-artist.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import httpResponse from '../../util/httpResponse.js'

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'User Trending Artist service is running.')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getActiveTrendingArtists: async (req, res, next) => {
        try {
            const { limit = 10, sortBy = 'monthlyStreams' } = req.query
            const limitNumber = parseInt(limit)

            const sortOptions = {}
            sortOptions[sortBy] = -1

            const artists = await TrendingArtistModel.find({ status: 'active' })
                .select('artistNumber artistName designation profileImageUrl totalReleases monthlyStreams catalogUrls')
                .sort(sortOptions)
                .limit(limitNumber)
                .lean()

            httpResponse(req, res, 200, responseMessage.SUCCESS, artists)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getTopTrendingArtists: async (req, res, next) => {
        try {
            const topArtists = await TrendingArtistModel.find({ status: 'active' })
                .select('artistNumber artistName designation profileImageUrl totalReleases monthlyStreams catalogUrls')
                .sort({ monthlyStreams: -1 })
                .limit(5)
                .lean()

            httpResponse(req, res, 200, responseMessage.SUCCESS, topArtists)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getTrendingArtistStats: async (req, res, next) => {
        try {
            const stats = await TrendingArtistModel.aggregate([
                { $match: { status: 'active' } },
                {
                    $group: {
                        _id: null,
                        totalActiveArtists: { $sum: 1 },
                        totalReleases: { $sum: '$totalReleases' },
                        totalMonthlyStreams: { $sum: '$monthlyStreams' },
                        avgReleasesPerArtist: { $avg: '$totalReleases' },
                        avgStreamsPerArtist: { $avg: '$monthlyStreams' }
                    }
                }
            ])

            const result = stats.length > 0 ? stats[0] : {
                totalActiveArtists: 0,
                totalReleases: 0,
                totalMonthlyStreams: 0,
                avgReleasesPerArtist: 0,
                avgStreamsPerArtist: 0
            }

            delete result._id

            httpResponse(req, res, 200, responseMessage.SUCCESS, result)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getTrendingArtistsByCategory: async (req, res, next) => {
        try {
            const [topByStreams, topByReleases] = await Promise.all([
                TrendingArtistModel.find({ status: 'active' })
                    .select('artistNumber artistName designation profileImageUrl monthlyStreams catalogUrls')
                    .sort({ monthlyStreams: -1 })
                    .limit(3)
                    .lean(),
                TrendingArtistModel.find({ status: 'active' })
                    .select('artistNumber artistName designation profileImageUrl totalReleases catalogUrls')
                    .sort({ totalReleases: -1 })
                    .limit(3)
                    .lean()
            ])

            const categories = {
                topByStreams,
                topByReleases
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, categories)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
