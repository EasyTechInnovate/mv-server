import Joi from 'joi'

const newsSchemas = {
    createNewsSchema: Joi.object({
        imageUrl: Joi.string().uri().required(),
        articleUrl: Joi.string().uri().required(),
        display: Joi.boolean().default(false),
        order: Joi.number().integer().min(0).default(0)
    }),

    updateNewsSchema: Joi.object({
        imageUrl: Joi.string().uri(),
        articleUrl: Joi.string().uri(),
        display: Joi.boolean(),
        order: Joi.number().integer().min(0)
    }).min(1),

    newsParamsSchema: Joi.object({
        newsId: Joi.string().length(24).hex().required()
    }),

    getNewsSchema: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(50),
        display: Joi.boolean()
    })
}

export default newsSchemas
