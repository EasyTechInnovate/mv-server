import express from 'express'
import router from './router/index.js'
import globalErrorHandler from './middleware/globalErrorHandler.js'
import responseMessage from './constant/responseMessage.js'
import httpError from './util/httpError.js'
import helmet from 'helmet'
import cors from 'cors'
import config from './config/config.js'
import cookieParser from 'cookie-parser'

const app = express()

app.use(helmet())
const allowedOrigins = [
    config.security.corsOrigin,
    'http://localhost:3000'
]

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: true
    })
)

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

// Root route - Welcome message and API list
app.get('/', (_, res) => {
    res.json({
        message: 'Welcome to Maheshwari Visuals API Server',
        success: true,
        version: '1.0.0',
    })
})

app.use('/v1', router)

app.use((req, res, next) => {
    try {
        throw new Error(responseMessage.ERROR.NOT_FOUND('route'))
    } catch (err) {
        httpError(next, err, req, 404)
    }
})

app.use(globalErrorHandler)

export default app
