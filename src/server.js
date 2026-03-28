import app from './app.js';
import config from './config/config.js';
import { initRateLimiter } from './config/rateLimiter.js';
import databaseService from './service/databaseService.js';
import logger from './util/logger.js';
import { initializeDefaultSublabels } from './util/sublabelHelper.js';
import subscriptionExpiryCron from './cron/subscriptionExpiry.cron.js';

const server = app.listen(config.server.port);

(async () => {
    try {
        const connection = await databaseService.connect();
        logger.info('DATABASE_CONNECTION', {
            meta: {
                CONNECTION_NAME: connection.name,
            },
        });

        initRateLimiter(connection);
        logger.info('RATE_LIMITER_INITIATED');

        await initializeDefaultSublabels();
        logger.info('DEFAULT_SUBLABELS_INITIALIZED');

        subscriptionExpiryCron.start();
        logger.info('SUBSCRIPTION_EXPIRY_CRON_STARTED');

        logger.info('APPLICATION_STARTED', {
            meta: {
                PORT: config.server.port,
                SERVER_URL: config.server.url,
            },
        });
    } catch (err) {
        logger.error('APPLICATION_ERROR', { meta: err });

        server.close((error) => {
            if (error) {
                logger.error('APPLICATION_ERROR', { meta: error });
            }

            process.exit(1);
        });
    }
})();
