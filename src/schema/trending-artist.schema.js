import { z } from 'zod'
import { ETrendingArtistStatus } from '../constant/application.js'

const createTrendingArtist = z.object({
    body: z.object({
        artistNumber: z.string().trim().min(1, 'Artist number is required').max(50, 'Artist number too long'),
        artistName: z.string().trim().min(1, 'Artist name is required').max(100, 'Artist name too long'),
        designation: z.string().trim().min(1, 'Designation is required').max(100, 'Designation too long'),
        profileImageUrl: z.string().url('Invalid profile image URL').optional().nullable(),
        catalogUrls: z.array(z.string().url('Invalid catalog URL')).optional().default([]),
        totalReleases: z.number().min(0, 'Total releases cannot be negative').default(0),
        monthlyStreams: z.number().min(0, 'Monthly streams cannot be negative').default(0),
        status: z.enum(Object.values(ETrendingArtistStatus)).optional().default(ETrendingArtistStatus.ACTIVE)
    })
})

const updateTrendingArtist = z.object({
    params: z.object({
        artistId: z.string().min(1, 'Artist ID is required')
    }),
    body: z.object({
        artistNumber: z.string().trim().min(1, 'Artist number is required').max(50, 'Artist number too long').optional(),
        artistName: z.string().trim().min(1, 'Artist name is required').max(100, 'Artist name too long').optional(),
        designation: z.string().trim().min(1, 'Designation is required').max(100, 'Designation too long').optional(),
        profileImageUrl: z.string().url('Invalid profile image URL').optional().nullable(),
        catalogUrls: z.array(z.string().url('Invalid catalog URL')).optional(),
        totalReleases: z.number().min(0, 'Total releases cannot be negative').optional(),
        monthlyStreams: z.number().min(0, 'Monthly streams cannot be negative').optional(),
        status: z.enum(Object.values(ETrendingArtistStatus)).optional()
    })
})

const getTrendingArtistById = z.object({
    params: z.object({
        artistId: z.string().min(1, 'Artist ID is required')
    })
})

const deleteTrendingArtist = z.object({
    params: z.object({
        artistId: z.string().min(1, 'Artist ID is required')
    })
})

const getAllTrendingArtists = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        status: z.enum(Object.values(ETrendingArtistStatus)).optional(),
        search: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'monthlyStreams', 'totalReleases', 'artistName']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional()
    })
})

const getActiveTrendingArtists = z.object({
    query: z.object({
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        sortBy: z.enum(['monthlyStreams', 'totalReleases', 'createdAt']).optional()
    })
})

export default {
    createTrendingArtist,
    updateTrendingArtist,
    getTrendingArtistById,
    deleteTrendingArtist,
    getAllTrendingArtists,
    getActiveTrendingArtists
}
