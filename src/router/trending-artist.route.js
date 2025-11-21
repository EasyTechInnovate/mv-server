import { Router } from 'express'
import adminTrendingArtistController from '../controller/TrendingArtist/admin-trending-artist.controller.js'
import userTrendingArtistController from '../controller/TrendingArtist/user-trending-artist.controller.js'
import validateRequest from '../middleware/validateRequest.js'
import authentication from '../middleware/authentication.js'
import authorization from '../middleware/authorization.js'
import trendingArtistSchemas from '../schema/trending-artist.schema.js'

const router = Router()

// Public/User routes
router.route('/self').get(userTrendingArtistController.self)

router.route('/active')
    .get(
        validateRequest(trendingArtistSchemas.getActiveTrendingArtists, 'query'),
        userTrendingArtistController.getActiveTrendingArtists
    )

router.route('/top').get(userTrendingArtistController.getTopTrendingArtists)

router.route('/stats').get(userTrendingArtistController.getTrendingArtistStats)

router.route('/categories').get(userTrendingArtistController.getTrendingArtistsByCategory)

// Admin routes
router.route('/admin/self').get(
    authentication,
    authorization(['admin']),
    adminTrendingArtistController.self
)

router.route('/admin')
    .post(
        authentication,
        authorization(['admin']),
        validateRequest(trendingArtistSchemas.createTrendingArtist),
        adminTrendingArtistController.createTrendingArtist
    )
    .get(
        authentication,
        authorization(['admin']),
        validateRequest(trendingArtistSchemas.getAllTrendingArtists, 'query'),
        adminTrendingArtistController.getAllTrendingArtists
    )

router.route('/admin/stats').get(
    authentication,
    authorization(['admin']),
    adminTrendingArtistController.getTrendingArtistStats
)

router.route('/admin/:artistId')
    .get(
        authentication,
        authorization(['admin']),
        validateRequest(trendingArtistSchemas.getTrendingArtistById),
        adminTrendingArtistController.getTrendingArtistById
    )
    .patch(
        authentication,
        authorization(['admin']),
        validateRequest(trendingArtistSchemas.updateTrendingArtist),
        adminTrendingArtistController.updateTrendingArtist
    )
    .delete(
        authentication,
        authorization(['admin']),
        validateRequest(trendingArtistSchemas.deleteTrendingArtist),
        adminTrendingArtistController.deleteTrendingArtist
    )

export default router
