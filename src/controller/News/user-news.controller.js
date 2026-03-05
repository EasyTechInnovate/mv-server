import NewsModel from '../../model/news.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import httpResponse from '../../util/httpResponse.js'

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'News public service is running.')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getPublishedNews: async (req, res, next) => {
        try {
            const news = await NewsModel.find({ display: true })
                .sort({ order: 1, createdAt: -1 })
                .lean()

            httpResponse(req, res, 200, responseMessage.SUCCESS, news)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
