import NewsModel from '../../model/news.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import httpResponse from '../../util/httpResponse.js'

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'Admin News service is running.')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    createNews: async (req, res, next) => {
        try {
            const { imageUrl, articleUrl, display, order } = req.body

            const newNews = new NewsModel({ imageUrl, articleUrl, display, order })
            const savedNews = await newNews.save()

            httpResponse(req, res, 201, responseMessage.SUCCESS, savedNews)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getAllNews: async (req, res, next) => {
        try {
            const { page = 1, limit = 50, display } = req.query
            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const filter = {}
            if (display !== undefined) filter.display = display === 'true'

            const [news, totalCount] = await Promise.all([
                NewsModel.find(filter)
                    .sort({ order: 1, createdAt: -1 })
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                NewsModel.countDocuments(filter)
            ])

            const pagination = {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalCount,
                hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrevPage: pageNumber > 1
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, { news, pagination })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getNewsById: async (req, res, next) => {
        try {
            const { newsId } = req.params

            const news = await NewsModel.findById(newsId).lean()

            if (!news) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, news)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateNews: async (req, res, next) => {
        try {
            const { newsId } = req.params
            const updateData = req.body

            const existingNews = await NewsModel.findById(newsId)

            if (!existingNews) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            const updatedNews = await NewsModel.findByIdAndUpdate(
                newsId,
                updateData,
                { new: true, runValidators: true }
            ).lean()

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedNews)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    deleteNews: async (req, res, next) => {
        try {
            const { newsId } = req.params

            const deletedNews = await NewsModel.findByIdAndDelete(newsId).lean()

            if (!deletedNews) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, deletedNews)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
