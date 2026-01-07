import FAQModel from '../../model/faq.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpError from '../../util/httpError.js'
import httpResponse from '../../util/httpResponse.js'

export default {
    self: async (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS, 'Admin FAQ service is running.')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    createFAQ: async (req, res, next) => {
        try {
            const { question,  answer, category, status, displayOrder } = req.body

            const existingFAQ = await FAQModel.findOne({
                category,
                displayOrder
            })

            if (existingFAQ) {
                return httpError(next, responseMessage.ERROR.ALREADY_EXISTS(), req, 409)
            }

            const newFAQ = new FAQModel({
                question,
                answer,
                category,
                status,
                displayOrder
            })

            const savedFAQ = await newFAQ.save()

            httpResponse(req, res, 201, responseMessage.SUCCESS, savedFAQ)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getAllFAQs: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, category, status } = req.query
            const pageNumber = parseInt(page)
            const limitNumber = parseInt(limit)
            const skip = (pageNumber - 1) * limitNumber

            const filter = {}
            if (category) filter.category = category
            if (status !== undefined) filter.status = status === 'true'

            const [faqs, totalCount] = await Promise.all([
                FAQModel.find(filter)
                    .sort({ category: 1, displayOrder: 1 })
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),
                FAQModel.countDocuments(filter)
            ])

            const pagination = {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalCount,
                hasNextPage: pageNumber < Math.ceil(totalCount / limitNumber),
                hasPrevPage: pageNumber > 1
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                faqs,
                pagination
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getFAQById: async (req, res, next) => {
        try {
            const { faqId } = req.params

            const faq = await FAQModel.findById(faqId).lean()

            if (!faq) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, faq)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateFAQ: async (req, res, next) => {
        try {
            const { faqId } = req.params
            const updateData = req.body

            const existingFAQ = await FAQModel.findById(faqId)

            if (!existingFAQ) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            if (updateData.category && updateData.displayOrder) {
                const conflictFAQ = await FAQModel.findOne({
                    _id: { $ne: faqId },
                    category: updateData.category,
                    displayOrder: updateData.displayOrder
                })

                if (conflictFAQ) {
                    return httpError(next, responseMessage.ERROR.ALREADY_EXISTS(), req, 409)
                }
            } else if (updateData.displayOrder) {
                const conflictFAQ = await FAQModel.findOne({
                    _id: { $ne: faqId },
                    category: existingFAQ.category,
                    displayOrder: updateData.displayOrder
                })

                if (conflictFAQ) {
                    return httpError(next, responseMessage.ERROR.ALREADY_EXISTS(), req, 409)
                }
            } else if (updateData.category) {
                const conflictFAQ = await FAQModel.findOne({
                    _id: { $ne: faqId },
                    category: updateData.category,
                    displayOrder: existingFAQ.displayOrder
                })

                if (conflictFAQ) {
                    return httpError(next, responseMessage.ERROR.ALREADY_EXISTS(), req, 409)
                }
            }

            const updatedFAQ = await FAQModel.findByIdAndUpdate(
                faqId,
                updateData,
                { new: true, runValidators: true }
            ).lean()

            httpResponse(req, res, 200, responseMessage.SUCCESS, updatedFAQ)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    deleteFAQ: async (req, res, next) => {
        try {
            const { faqId } = req.params

            const deletedFAQ = await FAQModel.findByIdAndDelete(faqId).lean()

            if (!deletedFAQ) {
                return httpError(next, responseMessage.ERROR.NOT_FOUND(), req, 404)
            }

            httpResponse(req, res, 200, responseMessage.SUCCESS, deletedFAQ)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}