import TrendingArtistModel from '../../model/trending-artist.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import httpResponse from '../../util/httpResponse.js'

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'Admin Trending Artist service is running.')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    createTrendingArtist: async (req, res, next) => {
        try {
            const artistData = req.body

            const existingArtist = await TrendingArtistModel.findOne({
                artistNumber: artistData.artistNumber
            })

            if (existingArtist) {
                return httpError(next, responseMessage.ERROR.ALREADY_EXISTS(), req, 409)
            }

            const newArtist = new TrendingArtistModel(artistData)
            const savedArtist = await newArtist.save()

            httpResponse(req, res, 201, responseMessage.SUCCESS, savedArtist)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getAllTrendingArtists: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const filter = {}
            if (status) filter.status = status
            if (search) {
                filter.$or = [
                    { artistName: { $regex: search, $options: 'i' } },
                    { artistNumber: { $regex: search, $options: 'i' } },
                    { designation: { $regex: search, $options: 'i' } }
                ]
            }

            const sortOptions = {}
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

            const [artists, totalCount] = await Promise.all([
                TrendingArtistModel.find(filter)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                TrendingArtistModel.countDocuments(filter)
            ])

            const pagination = {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalCount,
                hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrevPage: pageNumber > 1
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                artists,
                pagination
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getTrendingArtistById: async (req, res, next) => {
        try {
            const { artistId } = req.params

            const artist = await TrendingArtistModel.findById(artistId).lean()

            if (!artist) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, artist)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateTrendingArtist: async (req, res, next) => {
        try {
            const { artistId } = req.params
            const updateData = req.body

            const existingArtist = await TrendingArtistModel.findById(artistId)

            if (!existingArtist) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            if (updateData.artistNumber && updateData.artistNumber !== existingArtist.artistNumber) {
                const conflictArtist = await TrendingArtistModel.findOne({
                    _id: { $ne: artistId },
                    artistNumber: updateData.artistNumber
                })

                if (conflictArtist) {
                    return httpError(next, responseMessage.ERROR.ALREADY_EXISTS(), req, 409)
                }
            }

            const updatedArtist = await TrendingArtistModel.findByIdAndUpdate(
                artistId,
                updateData,
                { new: true, runValidators: true }
            ).lean()

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedArtist)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    deleteTrendingArtist: async (req, res, next) => {
        try {
            const { artistId } = req.params

            const deletedArtist = await TrendingArtistModel.findByIdAndDelete(artistId).lean()

            if (!deletedArtist) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, deletedArtist)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getTrendingArtistStats: async (req, res, next) => {
        try {
            const [totalArtists, activeArtists, inactiveArtists, topStreamingArtists] = await Promise.all([
                TrendingArtistModel.countDocuments(),
                TrendingArtistModel.countDocuments({ status: 'active' }),
                TrendingArtistModel.countDocuments({ status: 'inactive' }),
                TrendingArtistModel.find({ status: 'active' })
                    .sort({ monthlyStreams: -1 })
                    .limit(5)
                    .select('artistName monthlyStreams totalReleases')
                    .lean()
            ])

            const stats = {
                totalArtists,
                activeArtists,
                inactiveArtists,
                topStreamingArtists
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, stats)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
