import { Router } from 'express'
import userNewsController from '../controller/News/user-news.controller.js'

const router = Router()

router.route('/self').get(userNewsController.self)

router.route('/').get(userNewsController.getPublishedNews)

export default router
